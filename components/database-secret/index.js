'use strict';

const fs = require('fs-extra');
const path = require('path');
const exec = require('child-process-promise').exec;

exports.apply = function(appName, componentName, targetDir) {
    const modName = path.basename(path.dirname(module.id));
    const secretName = componentName + '-bind';
    const dbName = componentName;
    fs.appendFile(path.join(targetDir, 'deploy.js'), `require("${modName}").deploy("${secretName}", "${dbName}")`)
        .then(() => console.log(`Component ${modName} added to project`))
        .catch((error) => console.error(`Failed to add component ${modName} to project: ${error}`));
}

exports.deploy = function(secretName, dbName) {
    // Create Secret holding Database connection/authentication information
    exec(`oc get secret ${secretName}`)
        .then((result) => {
            console.log(`Secret ${secretName} already exists`);
        })
        .catch((error) => {
            exec(`oc create secret generic ${secretName} \
                    --from-literal=uri=${dbName} \
                    --from-literal=user=dbuser \
                    --from-literal=password=secret`)
                .then((result) => {
                    console.log("Secret ${secretName} created");
                })
                .catch((error) => {
                    console.error(`Exec error: ${error}`);
                });
        })
}

