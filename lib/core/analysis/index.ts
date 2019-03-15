
import { pathExists, readFile, remove } from 'fs-extra';
import { join } from 'path';
import * as tmp from 'tmp-promise';
import { spawn } from 'child-process-promise';
import * as fg from 'fast-glob';

import {
    BUILDER_DOTNET,
    BUILDER_JAVA,
    BUILDER_JAVAEE,
    BUILDER_NODEJS_APP,
    builderById,
    BuilderImage
} from 'core/resources/images';

export async function determineBuilderImage(dir: string): Promise<BuilderImage> {
    if (!pathExists(dir)) {
        throw new Error('Directory doesn\'t exist');
    }
    if (await pathExists(join(dir, 'pom.xml'))) {
        if (isJavaee(await readFile(join(dir, 'pom.xml'), 'utf8')) ) {
            return builderById(BUILDER_JAVAEE);
        }
        return builderById(BUILDER_JAVA);
    } else if (await pathExists(join(dir, 'package.json'))) {
        return builderById(BUILDER_NODEJS_APP);
    } else if (await fg(['*.csproj'], { cwd: dir })) {
        // TODO: support sln files and other project formats (fsproj, vbproj)
        return builderById(BUILDER_DOTNET);
    } else {
        return null;
    }
}

export function isJavaee(pom: string): boolean {
    return pom.indexOf('<packaging>war</packaging>') >= 0 && pom.indexOf('thorntail') < 0;
}

export async function cloneGitRepo(gitRepoUrl: string, targetDir: string): Promise<any> {
    // Shallow-clone the repository
    return await spawn('git',
        [
            'clone',
            // Work-around for problem in older Gits
            // https://github.com/git/git/commit/92bcbb9b338dd27f0fd4245525093c4bce867f3d
            '-cuser.name=dummy',
            '-cuser.email=dummy',
            // Work-around to force Git never to ask for passwords
            '-ccore.askPass',
            gitRepoUrl,
            '--depth=1',
            targetDir
        ])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
}

export async function removeGitFolder(targetDir: string): Promise<void> {
    await remove(join(targetDir, '.git'));
}

export async function determineBuilderImageFromGit(gitRepoUrl: string): Promise<BuilderImage> {
    // Create temp dir
    const td = await tmp.dir({ 'unsafeCleanup': true });
    // Shallow-clone the repository
    await cloneGitRepo(gitRepoUrl, td.path.toString());
    // From the code we determine the builder image to use
    const bi = await determineBuilderImage(td.path);
    td.cleanup();
    return bi;
}
