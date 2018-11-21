import {readdir, statSync} from 'fs-extra';
import {join} from 'path';

export function info(itemConst) {
    return require(join(itemConst.sourceDir, 'info.json'));
}

export function getCapabilityModule(capability) {
    return require('../../../catalog/capabilities/' + capability).default;
}

async function listCapabilities() {
    const files = await readdir('./catalog/capabilities');
    return files
        .filter(f => statSync('./catalog/capabilities/' + f).isDirectory())
        .map(f => [f, getCapabilityModule(f)]);
}

export async function listCapabilityInfos() {
    const caps = await listCapabilities();
    return caps
        .map(([f, c]) => ({ 'module': f, ...info(c) }));
}

export function getGeneratorModule(generator) {
    return require('../../../catalog/generators/' + generator).default;
}

async function listGenerators() {
    const files = await readdir('./catalog/generators');
    return files
        .filter(f => statSync('./catalog/generators/' + f).isDirectory())
        .map(f => [f, getGeneratorModule(f)]);
}

export async function listGeneratorInfos() {
    const gens = await listGenerators();
    return gens
        .map(([f, g]) => ({'module': f, ...info(g)}));
}

export function listEnums(generator?: any) {
    return Promise.resolve(require('./enums.json'));
}
