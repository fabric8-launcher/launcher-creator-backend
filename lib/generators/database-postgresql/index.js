'use strict';

const support = require('../../core/resources');
const newDatabaseUsingSecret = support.newDatabaseUsingSecret;

exports.apply = function(resources, targetDir, props={}) {
    return newDatabaseUsingSecret(resources, props.appName, 'postgresql', props.databaseUri, props.secretName, {}, {
        POSTGRESQL_DATABASE: 'database',
        POSTGRESQL_USER: 'user',
        POSTGRESQL_PASSWORD: 'password'
    });
};

exports.info = function () {
    return require('./info.json');
};
