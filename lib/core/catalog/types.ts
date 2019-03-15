import { Resources } from 'core/resources';
import * as path from 'path';
import { copy, move } from 'fs-extra';
import { accessSync } from 'fs';

import { appendFile as _appendFile, walk } from 'core/utils';
import { transformFiles } from 'core/template';
import { mergePoms, updateGav, updateMetadata } from 'core/maven';
import { mergePackageJson } from 'core/nodejs';

export interface CapabilityDescriptor {
    module: string;             // The name of the applied capability
    props?: object;             // The properties to pass to the capability
    extra?: object;             // Any properties the capability might return
}

export interface PartDescriptor {
    subFolderName?: string;               // The name of the subFolderName
    shared?: object;            // Any shared properties that will be passed to all capabilities
    extra?: object;             // Any shared properties returned by capabilities
    capabilities: CapabilityDescriptor[];   // All capabilities that are part of the subFolderName
}

export interface ApplicationDescriptor {
    application: string;        // The name of the application
    extra?: object;             // Any application properties unused by the creator itself
    parts: PartDescriptor[];    // Parts are groups of capabilities that make up the application
}

export interface DeploymentDescriptor {
    applications: ApplicationDescriptor[];  // All applications that are part of the deployment
}

export interface Enums {
    [key: string]: Enum[];
}

export interface Enum {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    metadata?: object;
}

export interface Runtime {
    name: string;
    version?: string;
}

export interface DotNetCoords {
    namespace: string;
    version: string;
}

export interface MavenCoords {
    groupId: string;
    artifactId: string;
    version: string;
}

export interface NodejsCoords {
    name: string;
    version: string;
}

export function toRuntime(arg: string) {
    const parts = arg.split('/', 2);
    const runtime: Runtime = { 'name': parts[0] };
    if (parts.length > 1) {
        runtime.version = parts[1];
    }
    return runtime;
}

interface CatalogItem {
    readonly sourceDir: string;

    apply(resources: Resources, props?: object, extra?: object): Promise<Resources>;
}

abstract class BaseCatalogItem implements CatalogItem {
    private readonly _sourceDir;

    constructor(public readonly generator: (genConst) => Generator, public readonly targetDir) {
        this._sourceDir = this.constructor['sourceDir'];
        if (!this._sourceDir) {
            throw new Error(`Class ${this.constructor.name} is missing static field "sourceDir"!`);
        }
    }

    public get sourceDir(): string {
        return this._sourceDir;
    }

    public abstract async apply(resources: Resources, props?: object, extra?: object): Promise<Resources>;

    protected name(...parts: string[]) {
        return parts.filter(p => !!p).join('-');
    }

    protected join(...parts: string[]) {
        return path.join(...parts.filter(p => !!p));
    }

    protected copy(from: string = 'files', to?: string): Promise<void> {
        const from2 = path.join(this.sourceDir, from);
        const to2 = !!to ? path.join(this.targetDir, to) : this.targetDir;
        return copy(from2, to2);
    }

    protected filesCopied(from: string = 'files', to?: string): Promise<boolean> {
        const from2 = path.join(this.sourceDir, from);
        const to2 = !!to ? path.join(this.targetDir, to) : this.targetDir;
        return new Promise<boolean>((resolve, reject) => {
            resolve(walk(from2, f => {
                try {
                    accessSync(path.join(to2, f.path));
                } catch (ex) {
                    return false;
                }
            }));
        });
    }

    protected move(original: string, to: string): Promise<void> {
        const original2 = path.join(this.targetDir, original);
        const to2 = path.join(this.targetDir, to);
        return move(original2, to2, { overwrite: true});
    }

    protected transform(pattern: string | string[], transformLine: (line: string) => string | string[]): Promise<number> {
        let pattern2;
        if (typeof pattern === 'string') {
            pattern2 = path.join(this.targetDir, pattern);
        } else {
            pattern2 = pattern.map(p => path.join(this.targetDir, p));
        }
        return transformFiles(pattern2, transformLine);
    }

    protected appendFile(targetFile: string, sourceFile?: string) {
        const srcFile = !!sourceFile ? sourceFile : path.join('merge', sourceFile);
        return _appendFile(path.join(this.targetDir, targetFile), path.join(this.sourceDir, srcFile));
    }

    protected updatePom(appName, groupId, artifactId, version, pomFile = 'pom.xml') {
        return updateMetadata(path.join(this.targetDir, pomFile), appName, `Generated Application '${appName}'`)
            .then(() => updateGav(path.join(this.targetDir, pomFile), groupId, artifactId, version));
    }

    protected mergePoms(sourcePom = 'merge/pom.xml', targetPom = 'pom.xml') {
        return mergePoms(path.join(this.targetDir, targetPom), path.join(this.sourceDir, sourcePom));
    }

    protected updateMetadata(name, description = 'A new application generated by the Red Hat Application Launcher', pomFile = 'pom.xml') {
        return updateMetadata(path.join(this.targetDir, pomFile), name, description);
    }

    protected mergePackageJson(source = 'merge/package.json', target = 'package.json') {
        return mergePackageJson(path.join(this.targetDir, target), path.join(this.sourceDir, source));
    }
}

interface Capability extends CatalogItem {
    postApply(resources: Resources, props?: any, deployment?: any): Promise<Resources>;
}

export interface BaseGeneratorProps {
    application: string;
    subFolderName?: string;
    serviceName: string;
    routeName: string;
}

export interface BaseGeneratorExtra {
    image: string;
    service: string;
}

export interface BasePlatformExtra extends BaseGeneratorExtra {
    route: string;
    enumInfo: Enum;
}

interface Generator extends CatalogItem {
}

export abstract class BaseGenerator extends BaseCatalogItem implements Generator {
}

export abstract class BaseCapability extends BaseCatalogItem implements Capability {
    public async postApply(resources: Resources, props?: object, deployment?: DeploymentDescriptor): Promise<Resources> {
        return resources;
    }
}
