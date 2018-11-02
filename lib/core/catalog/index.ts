
import { readdir, statSync } from 'fs-extra';

export function getCapabilityModule(capability) {
    return require('../../../catalog/capabilities/' + capability);
}

export async function listCapabilities() {
    const files = await readdir('./catalog/capabilities');
    return files
        .filter(f => statSync('./catalog/capabilities/' + f).isDirectory())
        .map(f => ({'module': f, ...getCapabilityModule(f).info()}));
}

export function getGeneratorModule(generator) {
    return require('../../../catalog/generators/' + generator);
}

export async function listGenerators() {
    const files = await readdir('./catalog/generators');
    return files
        .filter(f => statSync('./catalog/generators/' + f).isDirectory())
        .map(f => ({'module': f, ...getGeneratorModule(f).info()}));
}

export function listRuntimes(generator?: any) {
    return Promise.resolve(require('./runtimes.json'));
}
