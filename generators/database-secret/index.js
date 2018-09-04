'use strict';

exports.apply = function(targetDir, props = {}) {
    return Promise.resolve(true);
}

exports.generate = function(resources, targetDir, props = {}) {
    // Create Secret holding Database connection/authentication information
    if (resources.secret(props.secretName).length == 0) {
        const secret = {
            "kind": "Secret",
            "apiVersion": "v1",
            "metadata": {
                "name": props.secretName,
            },
            "stringData": {
                "uri": props.databaseUri,
                "database": props.databaseName,
                "user": "dbuser",
                "password": "secret",  // TODO generate pwd
            }
        };
        resources.add(secret);
        //console.log(`Secret ${props.secretName} added`);
    } else {
        //console.log(`Secret ${props.secretName} already exists`);
    }
    return Promise.resolve(resources);
};

exports.info = function () {
    return require("./info.json");
};
