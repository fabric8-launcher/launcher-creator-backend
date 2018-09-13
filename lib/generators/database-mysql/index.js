'use strict';

const { newDatabaseUsingSecret } = require('../../core/resources');

exports.apply = function(resources, targetDir, props={}) {
    return newDatabaseUsingSecret(resources, props.appName, 'mysql', props.databaseUri, props.secretName, {
        MYSQL_ROOT_PASSWORD: 'verysecretrootpassword'
    }, {
        MYSQL_DATABASE: 'database',
        MYSQL_USER: 'user',
        MYSQL_PASSWORD: 'password'
    });
};

exports.info = function () {
    return require('./info.json');
};
