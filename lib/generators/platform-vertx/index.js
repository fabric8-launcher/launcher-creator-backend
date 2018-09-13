'use strict';

const fs = require('fs-extra');
const path = require('path');
const { newApp } = require('../../core/resources');

exports.apply = function(resources, targetDir, props={}) {
    return fs.copy(path.join(__dirname, 'files'), targetDir)
        .then(() => newApp(props.appName + '-vertx', props.appName, 'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift~.', {}, targetDir))
        .then(res => resources.add(res));
};

exports.info = function () {
    return require('./info.json');
};
