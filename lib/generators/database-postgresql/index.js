'use strict';

const {newDatabaseUsingSecret} = require('../../core/resources');

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
