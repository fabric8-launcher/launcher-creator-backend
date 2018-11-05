
import { readdir, statSync } from 'fs-extra';

export function getCapabilityModule(capability) {
    return require('../../../catalog/capabilities/' + capability);
}

export async function listCapabilities() {
    const files = await readdir('./catalog/capabilities');
    return files
        .filter(f => statSync('./catalog/capabilities/' + f).isDirectory())
        .map(f => getCapabilityModule(f));
}

export async function listCapabilityInfos() {
    const caps = await listCapabilities();
    return caps
        .map(c => ({ 'module': c.id, ...c.info() }));
}

export function getGeneratorModule(generator) {
    return require('../../../catalog/generators/' + generator);
}

export async function listGenerators() {
    const files = await readdir('./catalog/generators');
    return files
        .filter(f => statSync('./catalog/generators/' + f).isDirectory())
        .map(f => getGeneratorModule(f));
}

export async function listGeneratorInfos() {
    const gens = await listGenerators();
    return gens
        .map(g => ({'module': g.id, ...g.info()}));
}

export function listRuntimes(generator?: any) {
    return Promise.resolve(require('./runtimes.json'));
}
