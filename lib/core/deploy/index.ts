
import { pathExistsSync, readJson, ensureFile, readFile, writeFile, createWriteStream } from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';

import { validate } from 'core/info';
import { getCapabilityModule, info, listEnums } from 'core/catalog';
import { applyFromFile, startBuild, deleteApp } from 'core/oc';
import { filterObject, zipFolder } from 'core/utils';
import { resources, Resources } from 'core/resources';

// Returns the name of the deployment file in the given directory
export function deploymentFileName(targetDir) {
    return join(targetDir, 'deployment.json');
}

// Returns the name of the resources file in the given directory
export function resourcesFileName(targetDir) {
    return join(targetDir, '.openshiftio', 'application.yaml');
}

// Returns a promise that will resolve to the JSON
// contents of the given file or to an empty object
// if the file wasn't found
async function readDeployment(deploymentFile): Promise<any> {
    if (pathExistsSync(deploymentFile)) {
        try {
            return await readJson(deploymentFile);
        } catch (ex) {
            console.error(`Failed to read deployment file ${deploymentFile}: ${ex}`);
            throw ex;
        }
    } else {
        return {'applications': []};
    }
}

// Returns a promise that will resolve when the given
// deployment was written to the given file
async function writeDeployment(deploymentFile, deployment): Promise<any> {
    try {
        await ensureFile(deploymentFile);
        return writeFile(deploymentFile, JSON.stringify(deployment, null, 2));
    } catch (ex) {
        console.error(`Failed to write deployment file ${deploymentFile}: ${ex}`);
        throw ex;
    }
}

// Validates that the given capability can be added to the given deployment
function validateAddCapability(deployment, props) {
    const app = deployment.applications.find(item => item.application === props.application);
    if (!!app) {
        const tier = app.tiers.find(t => t.tier === props.tier);
        if (!!tier) {
            // TODO this is not entirely correct, but we should really get rid of 'framework'
            const rtapp = _.get(tier, 'shared.runtime.name', _.get(tier, 'shared.framework.name'));
            const rtcap = _.get(props, 'runtime.name', _.get(props, 'framework.name'));
            if (!!rtapp && !!rtcap && rtapp !== rtcap) {
                throw new Error(
                    `Trying to add capability with incompatible 'runtime' or 'framework' (is '${rtcap}', should be '${rtapp}')`);
            }
        }
        if (!app.tiers[0].tier && !!props.tier || !!app.tiers[0].tier && !props.tier) {
            throw new Error(`Can't mix tiered and untiered capabilities`);
        }
    }
}

// Adds the given capability to the given deployment
function addCapability(deployment, capability) {
    const cap = { ...capability };
    delete cap.application;
    delete cap.tier;
    delete cap.shared;
    delete cap.sharedExtra;
    let app = deployment.applications.find(item => item.application === capability.application);
    if (!app) {
        app = {
            'application': capability.application,
            'tiers': []
        };
        deployment.applications = [...deployment.applications, app];
    }
    let tier = app.tiers.find(t => t.tier === capability.tier);
    if (!tier) {
        tier = {
            'shared': {},
            'extra': {},
            'capabilities': []
        };
        if (!!capability.tier) {
            tier.tier = capability.tier;
        }
        app.tiers = [ ...app.tiers, tier ];
    }
    if (!!capability.shared) {
        tier.shared = { ...tier.shared, ...capability.shared };
    }
    if (!!capability.sharedExtra) {
        tier.extra = { ...tier.extra, ...capability.sharedExtra };
    }
    tier.capabilities = [ ...tier.capabilities, cap ];
}

// Returns a promise that will resolve when the given
// resources were read from the given file
export async function readResources(resourcesFile): Promise<Resources> {
    try {
        const text = await readFile(resourcesFile, 'utf8');
        return resources(yaml.safeLoad(text));
    } catch (ex) {
        console.error(`Failed to read resources file ${resourcesFile}: ${ex}`);
        throw ex;
    }
}

// Returns a promise that will resolve to a list of resources read
// from the given file if it exists or to an empty Resources object
export async function readOrCreateResources(resourcesFile): Promise<Resources> {
    if (pathExistsSync(resourcesFile)) {
        return readResources(resourcesFile);
    } else {
        return Promise.resolve(resources());
    }
}

// Returns a promise that will resolve when the given
// resources were written to the given file
export async function writeResources(resourcesFile, res): Promise<any> {
    if (!_.isEmpty(res.json)) {
        try {
            await ensureFile(resourcesFile);
            return await writeFile(resourcesFile, yaml.safeDump(res.json));
        } catch (ex) {
            console.error(`Failed to write resources file ${resourcesFile}: ${ex}`);
            throw ex;
        }
    } else {
        return false;
    }
}

async function applyCapability_(generator, res: Resources, targetDir: string, shared, props) {
    // Validate the properties that we get passed are valid
    const capTargetDir = (!props.tier) ? targetDir : join(targetDir, props.tier);
    const capConst = getCapabilityModule(props.module);
    const propDefs = info(capConst).props;
    const allprops = { ...props, ...definedPropsOnly(propDefs, shared) };
    validate(propDefs, listEnums(), allprops);

    // Read the deployment descriptor and validate if we can safely add this capability
    const rf = resourcesFileName(capTargetDir);
    const df = deploymentFileName(targetDir);
    const deployment = await readDeployment(df);
    validateAddCapability(deployment, allprops);

    // Apply the capability
    const cap = new capConst(generator, capTargetDir);
    const extra = {};
    const res2 = await cap.apply(res, allprops, extra);

    // Add the capability's state to the deployment descriptor
    addCapability(deployment, capInfo(info(capConst).props, allprops, extra));

    // Execute any post-apply generators
    const res3 = await postApply(res2, targetDir, deployment);

    // Write everything back to their respective files
    await writeResources(rf, res3);
    await writeDeployment(df, deployment);

    return deployment;
}

function definedPropsOnly(propDefs: any, props: object): object {
    return filterObject(props, (key, value) => !!getPropDef(propDefs, key).id);
}

function postApply(res, targetDir, deployment) {
    let p = Promise.resolve(res);
    const app = deployment.applications[0];
    for (const tier of app.tiers) {
        for (const cap of tier.capabilities) {
            let capConst = null;
            try {
                capConst = getCapabilityModule(cap.module);
            } catch (ex) {
                console.log(`Capability ${cap.module} wasn't found for post-apply, skipping.`);
            }
            if (capConst) {
                const capTargetDir = (!tier.tier) ? targetDir : join(targetDir, tier.tier);
                const generator = getGenerator(capTargetDir);
                const capinst = new capConst(generator, capTargetDir);
                const props = { ...tier.shared, ...cap.props, 'module': cap.module, 'application': app.application, 'tier': tier.tier };
                p = p.then(() => capinst.postApply(res, props, deployment));
            }
        }
    }
    return p;
}

function capInfo(propDefs, props, extra) {
    const props2 = filterObject(props, (key, value) => !getPropDef(propDefs, key).shared);
    const shared = filterObject(props, (key, value) => getPropDef(propDefs, key).shared);
    const sharedExtra = extra.shared;
    const extra2 = { ...extra };
    delete extra2.shared;
    delete props2.module;
    delete props2.application;
    delete props2.tier;
    return {
        'module': props.module,
        'application': props.application,
        'tier': props.tier,
        'props': props2,
        'shared': shared,
        'sharedExtra': sharedExtra,
        'extra': extra2
    };
}

function getPropDef(propDefs, propId) {
    return propDefs.find(pd => pd.id === propId) || {};
}

// Calls `apply()` on the given capability (which allows it to copy, generate
// and change files in the user's project) and adds information about the
// capability to the `deployment.json` in the project's root.
async function applyCapability(generator, res: Resources, targetDir: string, appName: string, tier: string, shared, props) {
    props.application = appName;
    if (!!tier) {
        props.tier = tier;
    }
    return await applyCapability_(generator, res, targetDir, shared, props);
}

function getGenerator(targetDir: string) {
    // The following function gets passed to all Capability `apply()` methods
    // which they then should use whenever they need to apply a Generator
    // to the target project. The same holds true for Generators when they
    // want to apply other Generators.
    const generator = (genConst) => {
        const gen = new genConst(generator, targetDir);
        const oldApply = gen.apply;
        gen.apply = (res2: Resources, props?: object, extra?: object) => {
            validate(info(genConst).props, listEnums(), props);
            return oldApply.call(gen, res2, props, extra);
        };
        return gen;
    };
    return generator;
}

// Calls `applyCapability()` on all the given capabilities
export function apply(res: Resources, targetDir: string, appName: string, tier: string, shared, capabilities) {
    const genTargetDir = (!tier) ? targetDir : join(targetDir, tier);
    const generator = getGenerator(genTargetDir);
    const p = Promise.resolve(true);
    return capabilities.reduce((acc, cur) => acc
        .then(() => applyCapability(generator, res, targetDir, appName, tier, shared, cur)), p);
}

export function deploy(targetDir) {
    const rf = resourcesFileName(targetDir);
    return applyFromFile(rf);
}

export function zip(targetDir, zipFileName) {
    const archiveFolderName = 'app';
    const out = createWriteStream(zipFileName);
    return zipFolder(out, targetDir, archiveFolderName);
}

export async function push(targetDir: string, pushType: string, follow: boolean = false) {
    // TODO MAKE THIS NOT HARD-CODED!
    const targetJar = targetDir + '/target/my-app-1.0.jar';
    let fromPath;
    if (!pushType) {
        pushType = pathExistsSync(targetJar) ? 'binary' : 'source';
    }
    if (pushType === 'source') {
        fromPath = targetDir;
    } else if (pushType === 'binary') {
        fromPath = targetJar;
    } else {
        throw new Error(`Unknown push type '${pushType}', should be 'source' or 'binary'`);
    }

    const rf = resourcesFileName(targetDir);
    const res = await readResources(rf);
    const bcs = res.buildConfigs;
    if (bcs.length === 0) {
        throw new Error(`Missing BuildConfig in ${rf}`);
    } else if (bcs.length > 1) {
        throw new Error(`Multiple BuildConfig resources found in ${rf}, support for this had not been implemented yet!`);
    }
    const bcName = bcs[0].metadata.name;
    return startBuild(bcName, fromPath, follow);
}

export async function del(targetDir: string) {
    const df = deploymentFileName(targetDir);
    const deployment = await readDeployment(df);
    const appLabel = deployment.applications[0].application;
    return deleteApp(appLabel);
}
