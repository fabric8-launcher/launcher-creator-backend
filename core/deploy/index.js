'use strict';

const fs = require('fs-extra');
const path = require('path');

// Returns the name of the deployment file in the given directory
exports.deploymentFile = function(targetDir) {
    return path.join(targetDir, 'deployment.json');
};

// Returns a promise that will resolve to the JSON
// contents of the given file or to an empty object
// if the file wasn't found
exports.readDeployment = function(deploymentFile) {
    return fs.pathExists(deploymentFile)
        .then(exists => {
            if (exists) {
                return fs.readJson(deploymentFile)
                    .catch((error) => console.error(`Failed to read deployment file ${deploymentFile}`));
            } else {
                return {capabilities:{}};
            }
        })
};

// Returns a promise that will resolve when the given
// deployment was written to the given file
exports.writeDeployment = function (deploymentFile, deployment) {
    return fs.writeFile(deploymentFile, JSON.stringify(deployment, null, 2))
        .catch((error) => console.error(`Failed to write deployment file ${deploymentFile}`));
};

// Returns a name based on the given prefix that is
// guaranteed to be unique in the given deployment
exports.uniqueName = function(deployment, prefix) {
    let idx = 1;
    let name;
    do {
        name = prefix + "-" + idx++;
    } while (deployment.capabilities[name]);
    return name;
};

// Adds the given capability to the given deployment
exports.addCapability = function(deployment, capName, capability) {
    deployment.capabilities[capName] = capability;
};

exports.generate = function(deploymentFile) {
};
