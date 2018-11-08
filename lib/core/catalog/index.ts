
import { readdir, statSync, copy } from 'fs-extra';
import { join } from 'path';

import { Resources } from 'core/resources';
import { transformFiles } from 'core/template';
import { mergePoms, updateGav } from 'core/maven';

interface CatalogItem {
    readonly sourceDir: string;
    apply(resources: Resources, props?: any): Promise<Resources>;
}

type applyFunc = (genConst: any, resources: Resources, props?: any) => Resources;

abstract class BaseCatalogItem implements CatalogItem {
    private readonly _sourceDir;

    constructor(public readonly applyGenerator: applyFunc, public readonly targetDir) {
        this._sourceDir = this.constructor['sourceDir'];
        if (!this._sourceDir) {
            throw new Error(`Class ${this.constructor.name} is missing static field "sourceDir"!`);
        }
    }

    public get sourceDir(): string {
        return this._sourceDir;
    }

    public abstract async apply(resources: Resources, props?: any): Promise<Resources>;

    protected copy(from: string = 'files', to?: string): Promise<void> {
        const from2 = join(this.sourceDir, from);
        const to2 = !!to ? join(this.targetDir, to) : this.targetDir;
        return copy(from2, to2);
    }

    protected transform(pattern: string | string[], transformLine: (line: string) => string): Promise<number> {
        let pattern2;
        if (typeof pattern === 'string') {
            pattern2 = join(this.targetDir, pattern);
        } else {
            // TODO fix array elements too
            pattern2 = pattern;
        }
        return transformFiles(pattern2, transformLine);
    }

    protected updateGav(groupId, artifactId, version, pomFile = 'pom.xml') {
        return updateGav(join(this.targetDir, 'pom.xml'), groupId, artifactId, version);
    }

    protected mergePoms(sourcePom = 'merge/pom.xml', targetPom = 'pom.xml') {
        return mergePoms(join(this.targetDir, targetPom), join(this.sourceDir, sourcePom));
    }
}

export function info(itemConst) {
    return require(join(itemConst.sourceDir, 'info.json'));
}

interface Capability extends CatalogItem {
}

interface Generator extends CatalogItem {
}

export abstract class BaseGenerator extends BaseCatalogItem implements Generator {
}

export abstract class BaseCapability extends BaseCatalogItem implements Capability {
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
