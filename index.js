'use strict';

function getCapabilityModule(capability) {
    return require("@capabilities/" + capability);
}

function listCapabilities() {
    const deps = require("./package.json").dependencies;
    if (deps) {
        return Object.entries(deps)
            .filter(([name,path]) => name.startsWith("@capabilities/"))
            .map(([name, path]) => ({ module: name, ...getCapabilityModule(name.slice(14)).info() }))
    } else {
        return [];
    }
}

function getGeneratorModule(generator) {
    return require("@generators/" + generator);
}

function listGenerators() {
    const deps = require("./package.json").dependencies;
    if (deps) {
        return Object.entries(deps)
            .filter(([name, path]) => name.startsWith("@generators/"))
            .map(([name, path]) => ({module: name, ...getGeneratorModule(name.slice(14)).info()}))
    } else {
        return [];
    }
}

exports.getCapabilityModule = getCapabilityModule;
exports.listCapabilities = listCapabilities;
exports.getGeneratorModule = getGeneratorModule;
exports.listGenerators = listGenerators;
