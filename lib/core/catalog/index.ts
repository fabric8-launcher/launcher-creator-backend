
import { readdirSync, statSync, pathExistsSync } from 'fs-extra';
import { join } from 'path';
import { Enum, Enums, Runtime } from 'core/catalog/types';
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

function listCapabilities() {
    const files = readdirSync(join(catalogFileFolder(), 'capabilities'));
    return files
        .filter(f => statSync(join(catalogFileFolder(), 'capabilities', f)).isDirectory())
        .map(f => [f, getCapabilityModule(f)]);
}

export function listCapabilityInfos() {
    const caps = listCapabilities();
    const cis: ModuleInfoDef[] = caps
        .map(([f, c]) => ({ 'module': f, ...info(c) }));
    return cis;
}

export function getGeneratorModule(generator) {
    return require(join(catalogModuleFolder(), 'generators', generator)).default;
}

function listGenerators() {
    const files = readdirSync(join(catalogFileFolder(), 'generators'));
    return files
        .filter(f => statSync(join(catalogFileFolder(), 'generators', f)).isDirectory())
        .map(f => [f, getGeneratorModule(f)]);
}

export function listGeneratorInfos() {
    const gens = listGenerators();
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

export function validRuntime(runtime: Runtime): Runtime {
    const rt = listEnums()['runtime.name'].find(rt => rt.id === runtime.name);
    if (!rt) {
        throw new Error(`Unknown runtime '${runtime.name}'`)
    }
    const versions = listEnums()[`runtime.version.${runtime.name}`];
    if (!versions || versions.length == 0) {
        throw new Error(`Missing versions for runtime '${runtime.name}'`)
    }
    const v = versions.find(v => v.id === runtime.version);
    if (v) {
        return runtime;
    } else {
        return { 'name': runtime.name, 'version': versions[0].id } as Runtime
    }
}
