'use strict';

const fs = require('fs-extra');

function getCapabilityModule(capability) {
    return require('../../capabilities/' + capability);
}

function listCapabilities() {
    return fs.readdir('./capabilities')
        .then(files => files
            .filter(f => fs.statSync('./capabilities/' + f).isDirectory())
            .map(f => ({ module: f, ...getCapabilityModule(f).info() }))
        );
}

function getGeneratorModule(generator) {
    return require('../../generators/' + generator);
}

function listGenerators() {
    return fs.readdir('./generators')
        .then(files => files
            .filter(f => fs.statSync('./generators/' + f).isDirectory())
            .map(f => ({module: f, ...getGeneratorModule(f).info()}))
        );
}

exports.getCapabilityModule = getCapabilityModule;
exports.listCapabilities = listCapabilities;
exports.getGeneratorModule = getGeneratorModule;
exports.listGenerators = listGenerators;
