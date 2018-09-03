'use strict';

const support = require('@core/resources');
const newApp = support.newApp;
const setDeploymentEnvFromSecret = support.setDeploymentEnvFromSecret;
const newDatabaseUsingSecret = support.newDatabaseUsingSecret;

exports.apply = function(appName, targetDir, capProps={}, compProps={}) {
    return compProps;
}

exports.generate = function(resources, props) {
    return newDatabaseUsingSecret(resources, "mysql", props.databaseName, props.secretName, {}, {
            MYSQL_DATABASE: "my_data",
            MYSQL_USER: "user",
            MYSQL_PASSWORD: "password",
            MYSQL_ROOT_PASSWORD: "rootpassword"
        });
};
