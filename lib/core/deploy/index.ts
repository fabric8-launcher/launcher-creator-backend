
import { pathExistsSync, readJson, ensureFile, readFile, writeFile, createWriteStream } from 'fs-extra';
import { join } from 'path';
import { isEqual } from 'lodash';
import YAML from 'yaml';

import { validate } from 'core/info';
import { getCapabilityModule, info } from 'core/catalog';
import { applyFromFile, startBuild, deleteApp } from 'core/oc';
import { zipFolder } from 'core/utils';
import { resources, Resources } from 'core/resources';

// Returns the name of the deployment file in the given directory
function deploymentFileName(targetDir) {
    return join(targetDir, 'deployment.json');
}

// Returns the name of the resources file in the given directory
function resourcesFileName(targetDir) {
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

// Returns a name based on the given prefix that is
// guaranteed to be unique in the given deployment
function uniqueName(deployment, appName, prefix) {
    let idx = 1;
    let name;
    do {
        name = prefix + '-' + idx++;
    } while (deployment.applications[appName].capabilities[name]);
    return name;
}

// Adds the given capability to the given deployment
function addCapability(deployment, capability) {
    const cap = { ...capability };
    delete cap.application;
    delete cap.shared;
    let app = deployment.applications.find(item => item.application === capability.application);
    if (!app) {
        app = {'application': capability.application, 'shared': capability.shared, 'capabilities': []};
        deployment.applications = [...deployment.applications, app];
    }
    app.capabilities = [ ...app.capabilities, cap ];
}

// Returns a promise that will resolve when the given
// resources were read from the given file
export async function readResources(resourcesFile): Promise<Resources> {
    try {
        const text = await readFile(resourcesFile, 'utf8');
        return resources(YAML.parse(text));
    } catch (ex) {
        console.error(`Failed to read resources file ${resourcesFile}: ${ex}`);
        throw ex;
    }
}

// Returns a promise that will resolve when the given
// resources were written to the given file
export async function writeResources(resourcesFile, res): Promise<any> {
    try {
        await ensureFile(resourcesFile);
        return await writeFile(resourcesFile, YAML.stringify(res.json));
    } catch (ex) {
        console.error(`Failed to write resources file ${resourcesFile}: ${ex}`);
        throw ex;
    }
}

async function applyCapability_(applyGenerator, res, targetDir, props) {
    const capConst = getCapabilityModule(props.module);
    validate(info(capConst).props, props);
    const cap = new capConst(applyGenerator, targetDir);
    const df = deploymentFileName(targetDir);
    const rf = resourcesFileName(targetDir);
    const res2 = await cap.apply(res, props);
    await writeResources(rf, res2);
    const deployment = await readDeployment(df);
    const newDeployment = addCapability(deployment, props);
    await writeDeployment(df, deployment);
    return newDeployment;
}

// Calls `apply()` on the given capability (which allows it to copy, generate
// and change files in the user's project) and adds information about the
// capability to the `deployment.json` in the project's root.
async function applyCapability(applyGenerator, res, targetDir, appName, props) {
    props.application = appName;
    return await applyCapability_(applyGenerator, res, targetDir, props);
}

// Calls `applyCapability()` on all the given capabilities
export function apply(res, targetDir, appName, shared, capabilities) {
    // The following function gets passed to all Capability `apply()` methods
    // which they then should use whenever they need to apply a Generator
    // to the target project. The same holds true for Generators when they
    // want to apply other Generators.
    const applyGenerator = (genConst, resources2, props2) => {
        validate(info(genConst).props, props2);
        const generator = new genConst(applyGenerator, targetDir);
        return generator.apply(resources2, props2);
    };

    const p = Promise.resolve(true);
    return capabilities.reduce((acc, cur) => acc
        .then(() => applyCapability(applyGenerator, res, targetDir, appName, { ...cur, ...shared })), p);
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
