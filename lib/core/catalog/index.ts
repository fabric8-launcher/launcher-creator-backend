
import { readdir, statSync, pathExistsSync } from 'fs-extra';
import { join } from 'path';
import { Enum, Enums } from 'core/catalog/types';
import { InfoDef, ModuleInfoDef } from 'core/info';

function catalogModuleFolder() {
    if (!!process.env['LAUNCHER_CREATOR_CATALOG']) {
        return process.env['LAUNCHER_CREATOR_CATALOG'];
    } else if (pathExistsSync('./catalog') || pathExistsSync('./dist/catalog')) {
        return '../../../catalog';
    } else {
        throw new Error(`No Catalog found in ${process.cwd()}/catalog or ${process.cwd()}/dist/catalog`);
    }
}

function catalogFileFolder() {
    if (!!process.env['LAUNCHER_CREATOR_CATALOG']) {
        return process.env['LAUNCHER_CREATOR_CATALOG'];
    } else if (pathExistsSync('./catalog')) {
        return './catalog';
    } else if (pathExistsSync('./dist/catalog')) {
        return './dist/catalog';
    } else {
        throw new Error(`No Catalog found in ${process.cwd()}/catalog or ${process.cwd()}/dist/catalog`);
    }
}

export function info(itemConst): InfoDef {
    return require(join(itemConst.sourceDir, 'info.json'));
}

export function getCapabilityModule(capability) {
    return require(join(catalogModuleFolder(), 'capabilities', capability)).default;
}

async function listCapabilities() {
    const files = await readdir(join(catalogFileFolder(), 'capabilities'));
    return files
        .filter(f => statSync(join(catalogFileFolder(), 'capabilities', f)).isDirectory())
        .map(f => [f, getCapabilityModule(f)]);
}

export async function listCapabilityInfos() {
    const caps = await listCapabilities();
    const cis: ModuleInfoDef[] = caps
        .map(([f, c]) => ({ 'module': f, ...info(c) }));
    return cis;
}

export function getGeneratorModule(generator) {
    return require(join(catalogModuleFolder(), 'generators', generator)).default;
}

async function listGenerators() {
    const files = await readdir(join(catalogFileFolder(), 'generators'));
    return files
        .filter(f => statSync(join(catalogFileFolder(), 'generators', f)).isDirectory())
        .map(f => [f, getGeneratorModule(f)]);
}

export async function listGeneratorInfos() {
    const gens = await listGenerators();
    return gens
        .map(([f, g]) => ({'module': f, ...info(g)}));
}

export function listEnums(): Enums {
    return require('./enums.json') as Enums;
}

export function enumItem(enumId, itemId: string): Enum {
    const items: Enum[] = listEnums()[enumId] || [];
    return items.find(e => e.id === itemId);
}
