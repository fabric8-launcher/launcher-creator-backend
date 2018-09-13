'use strict';

const fs = require('fs-extra');
const path = require('path');
const YAML = require('yaml').default;
const validate = require('../../core/info').validate;
const catalog = require('../../core/catalog');
const applyFromFile = require('../../core/resources').applyFromFile;

// Returns the name of the deployment file in the given directory
function deploymentFile(targetDir) {
    return path.join(targetDir, 'deployment.json');
}

// Returns the name of the resources file in the given directory
function resourcesFile(targetDir) {
    return path.join(targetDir, '.openshiftio', 'application.yaml');
}

// Returns a promise that will resolve to the JSON
// contents of the given file or to an empty object
// if the file wasn't found
function readDeployment(deploymentFile) {
    return fs.pathExists(deploymentFile)
        .then(exists => {
            if (exists) {
                return fs.readJson(deploymentFile)
                    .catch((error) => console.error(`Failed to read deployment file ${deploymentFile}: ${error}`));
            } else {
                return {capabilities:{}};
            }
        });
}

// Returns a promise that will resolve when the given
// deployment was written to the given file
function writeDeployment(deploymentFile, deployment) {
    return fs.ensureFile(deploymentFile)
        .then(() => fs.writeFile(deploymentFile, JSON.stringify(deployment, null, 2)))
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
function addCapability(deployment, capName, capability) {
    deployment.capabilities[capName] = capability;
}

// Calls `apply()` on the given capability (which allows it to copy, generate
// and change files in the user's project) and adds information about the
// capability to the `deployment.json` in the project's root.
function applyCapability(capName, targetDir, capability, props) {
    const module = catalog.getCapabilityModule(capability);
    const df = deploymentFile(targetDir);
    return new Promise((resolve, reject) => resolve(validate(module.info(), props)))
        .then(() => module.apply(capName, targetDir, props))
        .then(() => readDeployment(df))
        .then(deployment => {
            const cap = {
                module: capability,
                props: props
            };
            const newDeployment = addCapability(deployment, capName, cap);
            return writeDeployment(df, deployment)
                .then(() => newDeployment);
        });
}

function generate(capName, resources, targetDir, capability, props) {
    return require('../../capabilities/' + capability).generate(capName, resources, targetDir, props);
}

function generateResources(resources, targetDir) {
    const df = deploymentFile(targetDir);
    return readDeployment(df)
        .then((deployment) => {
            let result = Promise.resolve(resources);
            Object.entries(deployment.capabilities).forEach(([capName,cap]) => {
                result = result.then((res) => generate(capName, res, targetDir, cap.module, cap.props));
            });
            return result;
        });
}

// Returns a promise that will resolve when the given
// resources were written to the given file
function writeResources(resourcesFile, resources) {
    return fs.ensureFile(resourcesFile)
        .then(() => fs.writeFile(resourcesFile, YAML.stringify(resources.json)))
        .catch((error) => console.error(`Failed to write resources file ${resourcesFile}: ${error}`));
}

// Generates the complete resources needed to create the application
// on OpenShift and writes it to `.openshift/application.yaml`
function generateAndWriteResources(resources, targetDir) {
    const rf = resourcesFile(targetDir);
    return generateResources(resources, targetDir)
        .then(res => {
            return writeResources(rf, res);
        });
}

function deploy(targetDir) {
    const rf = resourcesFile(targetDir);
    return applyFromFile(rf);
}

exports.applyCapability = applyCapability;
exports.generateAndWriteResources = generateAndWriteResources;
exports.deploy = deploy;
