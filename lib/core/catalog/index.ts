
import { readdir, statSync } from 'fs-extra';

export function getCapabilityModule(capability) {
    return require('../../capabilities/' + capability);
}

export function listCapabilities() {
    return readdir('./lib/capabilities')
        .then(files => files
            .filter(f => statSync('./lib/capabilities/' + f).isDirectory())
            .map(f => ({'module': f, ...getCapabilityModule(f).info()}))
        );
}

export function getGeneratorModule(generator) {
    return require('../../generators/' + generator);
}

export function listGenerators() {
    return readdir('./lib/generators')
        .then(files => files
            .filter(f => statSync('./lib/generators/' + f).isDirectory())
            .map(f => ({'module': f, ...getGeneratorModule(f).info()}))
        );
}

export function listRuntimes(generator?: any) {
    return Promise.resolve(require('./runtimes.json'));
}
