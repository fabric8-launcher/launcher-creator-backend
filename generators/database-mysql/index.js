'use strict';

const support = require('@core/resources');
const newDatabaseUsingSecret = support.newDatabaseUsingSecret;

exports.apply = function(targetDir, props={}) {
    return Promise.resolve(true);
}

exports.generate = function(resources, targetDir, props = {}) {
    return newDatabaseUsingSecret(resources, "mysql", props.databaseUri, props.secretName, {
            MYSQL_ROOT_PASSWORD: "verysecretrootpassword"
        }, {
            MYSQL_DATABASE: "database",
            MYSQL_USER: "user",
            MYSQL_PASSWORD: "password"
        });
};

exports.info = function () {
    return require("./info.json");
};
