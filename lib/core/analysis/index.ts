
import {pathExists, readFile} from 'fs-extra';
import { join } from 'path';
import * as tmp from 'tmp-promise';
import { spawn } from 'child-process-promise';

import {
    BUILDER_JAVA,
    BUILDER_JAVAEE,
    BUILDER_NODEJS_APP,
    builderById,
    BuilderImage,
    builderImages
} from 'core/resources/images';

export function listBuilderImages(): BuilderImage[] {
    return builderImages;
}

export async function determineBuilderImage(dir: string): Promise<BuilderImage> {
    if (!pathExists(dir)) {
        throw new Error('Directory doesn\'t exist');
    }
    if (await pathExists(join(dir, 'pom.xml'))) {
        if(isJavaee(await readFile(join(dir, 'pom.xml'), 'utf8')) ) {
            return builderById(BUILDER_JAVAEE);
        }
        return builderById(BUILDER_JAVA);
    } else if (await pathExists(join(dir, 'package.json'))) {
        return builderById(BUILDER_NODEJS_APP);
    } else {
        return null;
    }
}
export function isJavaee(pom: string): Boolean {
    return pom.indexOf('<packaging>war</packaging>') >= 0 && pom.indexOf('thorntail') < 0;
}


export async function determineBuilderImageFromGit(gitRepoUrl: string): Promise<BuilderImage> {
    // Create temp dir
    const td = await tmp.dir({ 'unsafeCleanup': true });
    // Shallow-clone the repository
    await spawn('git', ['clone', gitRepoUrl, '--depth=1', td.path.toString()])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
    // From the code we determine the builder image to use
    return await determineBuilderImage(td.path);
}
