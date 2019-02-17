
import { pathExists } from 'fs-extra';
import { join } from 'path';

import { BUILDER_JAVA, BUILDER_NODEJS_APP, builderImages } from 'core/resources/images';
import { Enum } from 'core/catalog/types';

export function listBuilderImages(): Enum[] {
    return builderImages;
}

export async function determineBuilderImage(dir: string): Promise<Enum> {
    if (!pathExists(dir)) {
        throw new Error('Directory doesn\'t exist');
    }
    if (await pathExists(join(dir, 'pom.xml'))) {
        return builderImages.find(e => e.id === BUILDER_JAVA);
    } else if (await pathExists(join(dir, 'package.json'))) {
        return builderImages.find(e => e.id === BUILDER_NODEJS_APP);
    } else {
        return null;
    }
}