
import { pathExistsSync, readJson, ensureFile, readFile, writeFile, createWriteStream } from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';

import { validate } from 'core/info';
import { getCapabilityModule, info, listEnums } from 'core/catalog';
import { applyFromFile, startBuild, deleteApp } from 'core/oc';
import { filterObject, zipFolder } from 'core/utils';
import { resources, Resources } from 'core/resources';
import { ApplicationDescriptor, CapabilityDescriptor, DeploymentDescriptor, TierDescriptor } from 'core/catalog/types';

// Returns the name of the deployment file in the given directory
export function deploymentFileName(targetDir) {
    return join(targetDir, 'deployment.json');
}

// Returns the name of the resources file in the given directory
export function resourcesFileName(targetDir) {
    return join(targetDir, '.openshiftio', 'application.yaml');
}

function emptyDeploymentDescriptor(): DeploymentDescriptor {
    return _.cloneDeep({ 'applications': [] });
}

// Returns a promise that will resolve to the JSON
// contents of the given file or to an empty object
// if the file wasn't found
export async function readDeployment(deploymentFile: string): Promise<DeploymentDescriptor> {
    if (pathExistsSync(deploymentFile)) {
        try {
            return await readJson(deploymentFile) as DeploymentDescriptor;
        } catch (ex) {
            console.error(`Failed to read deployment file ${deploymentFile}: ${ex}`);
            throw ex;
        }
    } else {
        return emptyDeploymentDescriptor();
    }
}

// Returns a promise that will resolve when the given
// deployment was written to the given file
export async function writeDeployment(deploymentFile: string, deployment: DeploymentDescriptor): Promise<any> {
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
function addCapability(deployment, capState) {
    const cap = { ...capState };
    delete cap.application;
    delete cap.tier;
    delete cap.shared;
    delete cap.sharedExtra;
    let app = deployment.applications.find(item => item.application === capState.application);
    if (!app) {
        app = {
            'application': capState.application,
            'tiers': []
        };
        deployment.applications = [...deployment.applications, app];
    }
    let tier = app.tiers.find(t => t.tier === capState.tier);
    if (!tier) {
        tier = {
            'shared': {},
            'extra': {},
            'capabilities': []
        };
        if (!!capState.tier) {
            tier.tier = capState.tier;
        }
        app.tiers = [ ...app.tiers, tier ];
    }
    if (!!capState.shared) {
        tier.shared = { ...tier.shared, ...capState.shared };
    }
    if (!!capState.sharedExtra) {
        tier.extra = { ...tier.extra, ...capState.sharedExtra };
    }
    tier.capabilities = [ ...tier.capabilities, cap ];
}

// Returns a promise that will resolve when the given
// resources were read from the given file
export async function readResources(resourcesFile: string): Promise<Resources> {
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
export async function readOrCreateResources(resourcesFile: string): Promise<Resources> {
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
                const generator = getGeneratorConstructorWrapper(capTargetDir);
                const capinst = new capConst(generator, capTargetDir);
                const props = { ...tier.shared, ...cap.props, 'module': cap.module, 'application': app.application, 'tier': tier.tier };
                p = p.then(() => capinst.postApply(res, props, deployment));
            }
        }
    }
    return p;
}

function createCapState(propDefs, props, extra) {
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

function getGeneratorConstructorWrapper(targetDir: string) {
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

// Calls `apply()` on the given capability (which allows it to copy, generate
// and change files in the user's project) and adds information about the
// capability to the `deployment.json` in the project's root.
async function applyCapability(
        generator,
        res: Resources,
        targetDir: string,
        appName: string,
        tierName: string,
        shared: object,
        capability: CapabilityDescriptor): Promise<DeploymentDescriptor> {
    const props: any = { ...capability.props, 'module': capability.module, 'application': appName };
    if (!!tierName) {
        props.tier = tierName;
    }

    // Validate the properties that we get passed are valid
    const capTargetDir = (!props.tier) ? targetDir : join(targetDir, props.tier);
    const capConst = getCapabilityModule(props.module);
    const capInfo = info(capConst);
    const propDefs = capInfo.props;
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
    addCapability(deployment, createCapState(propDefs, allprops, extra));

    // Execute any post-apply generators
    const res3 = await postApply(res2, targetDir, deployment);

    // Write everything back to their respective files
    await writeResources(rf, res3);
    await writeDeployment(df, deployment);

    return deployment;
}

// Calls `applyCapability()` on all the capabilities in the given tier descriptor
async function applyTier(targetDir: string, appName: string, tier: TierDescriptor): Promise<DeploymentDescriptor> {
    const genTargetDir = (!tier.tier) ? targetDir : join(targetDir, tier.tier);
    const res = await readOrCreateResources(resourcesFileName(genTargetDir));
    const generator = getGeneratorConstructorWrapper(genTargetDir);
    const p = Promise.resolve(emptyDeploymentDescriptor());
    return tier.capabilities.reduce((acc, cur) => acc
        .then(() => applyCapability(generator, res, targetDir, appName, tier.tier, tier.shared, cur)), p);
}

// Calls `applyTier()` on all the tiers in the given application descriptor
export function applyApplication(targetDir: string, application: ApplicationDescriptor): Promise<DeploymentDescriptor> {
    const p = Promise.resolve(emptyDeploymentDescriptor());
    return application.tiers.reduce((acc, cur) => acc
        .then(() => applyTier(targetDir, application.application, cur)), p);
}

// Calls `applyApplication()` on all the applications in the given deployment descriptor
export function applyDeployment(targetDir: string, deployment: DeploymentDescriptor): Promise<DeploymentDescriptor> {
    const p = Promise.resolve(emptyDeploymentDescriptor());
    return deployment.applications.reduce((acc, cur) => acc
        .then(() => applyApplication(targetDir, cur)), p);
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
