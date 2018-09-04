'use strict';

const fs = require('fs-extra');
const path = require('path');
const validate = require("@core/info").validate;

// Returns the name of the deployment file in the given directory
function deploymentFile(targetDir) {
    return path.join(targetDir, 'deployment.json');
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
        })
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
        name = prefix + "-" + idx++;
    } while (deployment.capabilities[name]);
    return name;
}

// Adds the given capability to the given deployment
function addCapability(deployment, capName, capability) {
    deployment.capabilities[capName] = capability;
}

function getCapabilityModule(capability) {
    return require("@capabilities/" + capability);
}

// Calls `apply()` on the given capability (which allows it to copy, generate
// and change files in the user's project) and adds information about the
// capability to the `deployment.json` in the project's root.
function apply(capName, targetDir, capability, props) {
    const module = getCapabilityModule(capability);
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
    return require("@capabilities/" + capability).generate(capName, resources, targetDir, props);
}

function generateDeployment(resources, targetDir) {
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

function listCapabilities() {
    const deps = require("./package.json").dependencies;
    if (deps) {
        return Object.entries(deps)
            .filter(([name,path]) => name.startsWith("@capabilities/"))
            .map(([name, path]) => ({ module: name, ...getCapabilityModule(name.slice(14)).info() }))
    } else {
        return [];
    }
}

exports.apply = apply;
exports.generate = generate;
exports.generateDeployment = generateDeployment;
exports.getCapabilityModule = getCapabilityModule;
exports.listCapabilities = listCapabilities;
