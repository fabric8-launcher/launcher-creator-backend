'use strict';

const support = require('../../core/resources');
const newDatabaseUsingSecret = support.newDatabaseUsingSecret;

exports.apply = function(targetDir, props={}) {
    return Promise.resolve(true);
};

exports.generate = function(resources, targetDir, props = {}) {
    return newDatabaseUsingSecret(resources, 'postgresql', props.databaseUri, props.secretName, {}, {
            POSTGRESQL_DATABASE: 'database',
            POSTGRESQL_USER: 'user',
            POSTGRESQL_PASSWORD: 'password'
        });
};

exports.info = function () {
    return require('./info.json');
};
