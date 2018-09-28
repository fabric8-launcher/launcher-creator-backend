
import { pathExistsSync, readJson, ensureFile, readFile, writeFile, createWriteStream } from 'fs-extra';
import { join } from 'path';
import { isEqual } from 'lodash';
import YAML from 'yaml';

import { validate } from '../info';
import { getCapabilityModule, getGeneratorModule } from '../catalog';
import { applyFromFile, startBuild, deleteApp } from '../oc';
import { zipFolder } from '../utils';
import { resources, Resources } from '../resources';

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
function readDeployment(deploymentFile) {
    if (pathExistsSync(deploymentFile)) {
        return readJson(deploymentFile)
            .catch((error) => console.error(`Failed to read deployment file ${deploymentFile}: ${error}`));
    } else {
        return Promise.resolve({'applications': []});
    }
}

// Returns a promise that will resolve when the given
// deployment was written to the given file
function writeDeployment(deploymentFile, deployment) {
    return ensureFile(deploymentFile)
        .then(() => writeFile(deploymentFile, JSON.stringify(deployment, null, 2)))
        .catch((error) => console.error(`Failed to write deployment file ${deploymentFile}: ${error}`));
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
    delete cap.runtime;
    let app = deployment.applications.find(item => item.application === capability.application);
    if (!app) {
        app = {'application': capability.application, 'runtime': capability.runtime, 'capabilities': []};
        deployment.applications = [...deployment.applications, app];
    }
    app.capabilities = [ ...app.capabilities, cap ];
}

// Returns a promise that will resolve when the given
// resources were read from the given file
function readResources(resourcesFile): Promise<Resources> {
    const p = readFile(resourcesFile, 'utf8')
        .then(text => resources(YAML.parse(text)));
    p.catch(error => console.error(`Failed to read resources file ${resourcesFile}: ${error}`));
    return p;
}

// Returns a promise that will resolve when the given
// resources were written to the given file
function writeResources(resourcesFile, res) {
    return ensureFile(resourcesFile)
        .then(() => writeFile(resourcesFile, YAML.stringify(res.json)))
        .catch(error => console.error(`Failed to write resources file ${resourcesFile}: ${error}`));
}

function applyCapability_(applyGenerator, res, targetDir, props) {
    const module = getCapabilityModule(props.module);
    const df = deploymentFileName(targetDir);
    const rf = resourcesFileName(targetDir);
    validate(module.info(), props);
    return module.apply(applyGenerator, res, targetDir, props)
        .then(res2 => writeResources(rf, res2))
        .then(() => readDeployment(df))
        .then(deployment => {
            const newDeployment = addCapability(deployment, props);
            return writeDeployment(df, deployment)
                .then(() => newDeployment);
        });
}

// Calls `apply()` on the given capability (which allows it to copy, generate
// and change files in the user's project) and adds information about the
// capability to the `deployment.json` in the project's root.
function applyCapability(applyGenerator, res, targetDir, appName, props) {
    props.application = appName;
    props.name = props.name || appName + '-' + props.module + '-1';
    return applyCapability_(applyGenerator, res, targetDir, props);
}

// Calls `applyCapability()` on all the given capabilities
export function apply(res, targetDir, appName, runtime, capabilities) {
    const appliedModules = {};
    const appliedModuleProps = {};

    // The following function gets passed to all Capability `apply()` methods
    // which they then should use whenever they need to apply a Generator
    // to the target project. The same holds true for Generators when they
    // want to apply other Generators.
    // The function makes sure that any particular Generator only gets applied
    // once for each call to `deploy/apply()`.
    const applyGenerator = (generator, resources2, targetDir2, props2) => {
        if (!appliedModules[generator]) {
            const module = getGeneratorModule(generator);
            validate(module.info(), props2);
            appliedModuleProps[generator] = {...props2};
            return appliedModules[generator] = module.apply(applyGenerator, resources2, targetDir2, props2);
        } else {
            if (!isEqual(appliedModuleProps[generator], props2)) {
                const j1 = JSON.stringify(appliedModuleProps[generator]);
                const j2 = JSON.stringify(props2);
                console.warn(`Duplicate generator: ${generator} with different properties! ${j1} vs ${j2}`);
            }
            return appliedModules[generator];
        }
    };

    const p = Promise.resolve(true);
    return capabilities.reduce((acc, cur) => acc
        .then(() => applyCapability(applyGenerator, res, targetDir, appName, { ...cur, 'runtime': runtime })), p);
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

export function push(targetDir: string, pushType: string, follow: boolean = false) {
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
    return readResources(rf)
        .then(res => {
            const bcs = res.buildConfigs;
            if (bcs.length === 0) {
                throw new Error(`Missing BuildConfig in ${rf}`);
            } else if (bcs.length > 1) {
                throw new Error(`Multiple BuildConfig resources found in ${rf}, support for this had not been implemented yet!`);
            }
            const bcName = bcs[0].metadata.name;
            return startBuild(bcName, fromPath, follow);
        });
}

export function del(targetDir: string) {
    const df = deploymentFileName(targetDir);
    return readDeployment(df)
        .then(deployment => {
            const appLabel = deployment.applications[0].application;
            return deleteApp(appLabel);
        });
}
