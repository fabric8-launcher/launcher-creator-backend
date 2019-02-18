
import { pathExists } from 'fs-extra';
import { join } from 'path';
import * as tmp from 'tmp-promise';
import * as git from 'simple-git/promise';

import { BUILDER_JAVA, BUILDER_NODEJS_APP, builderById, BuilderImage, builderImages } from 'core/resources/images';

export function listBuilderImages(): BuilderImage[] {
    return builderImages;
}

export async function determineBuilderImage(dir: string): Promise<BuilderImage> {
    if (!pathExists(dir)) {
        throw new Error('Directory doesn\'t exist');
    }
    if (await pathExists(join(dir, 'pom.xml'))) {
        return builderById(BUILDER_JAVA);
    } else if (await pathExists(join(dir, 'package.json'))) {
        return builderById(BUILDER_NODEJS_APP);
    } else {
        return null;
    }
}

export async function determineBuilderImageFromGit(gitRepoUrl: string): Promise<BuilderImage> {
    // Create temp dir
    const td = await tmp.dir({ 'unsafeCleanup': true });
    // Shallow-clone the repository
    await git()
        .env('GIT_TERMINAL_PROMPT', '0')
        .clone(gitRepoUrl, td.path, ['--depth', '1']);
    // From the code we determine the builder image to use
    return await determineBuilderImage(td.path);
}
