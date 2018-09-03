'use strict';

const support = require('@core/resources');
const newApp = support.newApp;
const setDeploymentEnvFromSecret = support.setDeploymentEnvFromSecret;
const newDatabaseUsingSecret = support.newDatabaseUsingSecret;

exports.apply = function(appName, targetDir, capProps={}, compProps={}) {
    return compProps;
}

exports.generate = function(resources, props) {
    return newDatabaseUsingSecret(resources, "postgresql", props.databaseName, props.secretName,
        {
            POSTGRESQL_DATABASE: "my_data"
        }, {
            POSTGRESQL_USER: "user",
            POSTGRESQL_PASSWORD: "password"
        });
};
