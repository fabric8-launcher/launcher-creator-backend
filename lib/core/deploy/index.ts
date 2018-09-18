
import { pathExists, readJson, ensureFile, writeFile, createWriteStream } from 'fs-extra';
import { join } from 'path';
import YAML from 'yaml';

import { validate } from '../info';
import { getCapabilityModule } from '../catalog';
import { applyFromFile } from '../resources';
import { zipFolder } from '../utils';

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
    return pathExists(deploymentFile)
        .then(exists => {
            if (exists) {
                return readJson(deploymentFile)
                    .catch((error) => console.error(`Failed to read deployment file ${deploymentFile}: ${error}`));
            } else {
                return {'capabilities': []};
            }
        });
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
function uniqueName(deployment, prefix) {
    let idx = 1;
    let name;
    do {
        name = prefix + '-' + idx++;
    } while (deployment.capabilities[name]);
    return name;
}

// Adds the given capability to the given deployment
function addCapability(deployment, capability) {
    deployment.capabilities = [ ...deployment.capabilities, capability ];
}

// Returns a promise that will resolve when the given
// resources were written to the given file
function writeResources(resourcesFile, resources) {
    return ensureFile(resourcesFile)
        .then(() => writeFile(resourcesFile, YAML.stringify(resources.json)))
        .catch((error) => console.error(`Failed to write resources file ${resourcesFile}: ${error}`));
}

function applyCapability_(resources, targetDir, props) {
    const module = getCapabilityModule(props.module);
    const df = deploymentFileName(targetDir);
    const rf = resourcesFileName(targetDir);
    validate(module.info(), props);
    return module.apply(resources, targetDir, props)
        .then(res => writeResources(rf, res))
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
function applyCapability(resources, targetDir, appName, props) {
    props.application = appName;
    props.name = props.name || appName + '-' + props.module + '-1';
    return applyCapability_(resources, targetDir, props);
}

// Calls `applyCapability()` on all the given capabilities
export function apply(resources, targetDir, appName, capabilities) {
    const p = Promise.resolve(true);
    return capabilities.reduce((acc, cur) => acc
        .then(() => applyCapability(resources, targetDir, appName, cur)), p);
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
