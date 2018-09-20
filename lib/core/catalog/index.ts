
import { readdir, statSync } from 'fs-extra';

export function getCapabilityModule(capability) {
    return require('../../../catalog/capabilities/' + capability);
}

export function listCapabilities() {
    return readdir('./catalog/capabilities')
        .then(files => files
            .filter(f => statSync('./catalog/capabilities/' + f).isDirectory())
            .map(f => ({'module': f, ...getCapabilityModule(f).info()}))
        );
}

export function getGeneratorModule(generator) {
    return require('../../../catalog/generators/' + generator);
}

export function listGenerators() {
    return readdir('./catalog/generators')
        .then(files => files
            .filter(f => statSync('./catalog/generators/' + f).isDirectory())
            .map(f => ({'module': f, ...getGeneratorModule(f).info()}))
        );
}

export function listRuntimes(generator?: any) {
    return Promise.resolve(require('./runtimes.json'));
}
