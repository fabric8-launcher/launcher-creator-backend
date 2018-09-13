'use strict';

const { copy } = require('fs-extra');
const { join } = require('path');
const { getGeneratorModule } = require('../../core/catalog');
const { mergePoms } = require('../../core/maven');

exports.apply = function(resources, targetDir, props={}) {
    // First copy the files from the base Vert.x platform module
    // and then copy our own over that
    return getGeneratorModule('platform-vertx').apply(resources, targetDir, props)
        .then(() => copy(join(__dirname, 'files'), targetDir))
        .then(() => mergePoms(join(targetDir, 'pom.xml'), join(__dirname, 'merge', `pom.${props.databaseType}.xml`)))
        .then(() => resources);
    // TODO Don't just blindly copy all files, we need to _patch_ some of
    // them instead (eg. pom.xml and arquillian.xml and Java code)
};

exports.info = function () {
    return require('./info.json');
};
