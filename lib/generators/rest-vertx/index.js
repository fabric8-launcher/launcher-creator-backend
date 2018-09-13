'use strict';

const fs = require('fs-extra');
const path = require('path');
const getGeneratorModule = require('../../core/catalog').getGeneratorModule;

exports.apply = function(resources, targetDir, props={}) {
    // First copy the files from the base Vert.x platform module
    // and then copy our own over that
    return getGeneratorModule('platform-vertx').apply(resources, targetDir, props)
        .then(() => fs.copy(path.join(__dirname, 'files'), targetDir))
        .then(() => resources);
    // TODO Don't just blindly copy all files, we need to _patch_ some of
    // them instead (eg. pom.xml and arquillian.xml and Java code)
};

exports.info = function () {
    return require('./info.json');
};
