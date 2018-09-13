'use strict';

const { readDir, statSync } = require('fs-extra');

function getCapabilityModule(capability) {
    return require('../../capabilities/' + capability);
}

function listCapabilities() {
    return readdir('./lib/capabilities')
        .then(files => files
            .filter(f => statSync('./lib/capabilities/' + f).isDirectory())
            .map(f => ({ module: f, ...getCapabilityModule(f).info() }))
        );
}

function getGeneratorModule(generator) {
    return require('../../generators/' + generator);
}

function listGenerators() {
    return readdir('./lib/generators')
        .then(files => files
            .filter(f => statSync('./lib/generators/' + f).isDirectory())
            .map(f => ({module: f, ...getGeneratorModule(f).info()}))
        );
}

function listRuntimes(generator) {
    return Promise.resolve(require('./runtimes.json'));
}

exports.getCapabilityModule = getCapabilityModule;
exports.listCapabilities = listCapabilities;
exports.getGeneratorModule = getGeneratorModule;
exports.listGenerators = listGenerators;
exports.listRuntimes = listRuntimes;
