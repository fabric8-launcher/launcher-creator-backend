'use strict';

exports.apply = function (appName, targetDir, capProps = {}, compProps = {}) {
    return compProps;
}

exports.generate = function(resources, props) {
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
                "password": "secret",
            }
        };
        resources.add(secret);
        console.log(`Secret ${props.secretName} added`);
    } else {
        console.log(`Secret ${props.secretName} already exists`);
    }
    return resources;
};
