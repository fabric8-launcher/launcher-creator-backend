
import { Resources } from 'core/resources';
import { BaseGenerator } from 'core/catalog';

import PlatformNodejs from 'generators/platform-nodejs';
import {insertAfter} from 'core/template/transformers/insert';

import * as path from 'path';
import { readFile } from 'fs-extra';

export default class DatabaseCrudNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props?: any, extra?: any): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'serviceName': props.serviceName,
                'groupId': props.groupId,
                'artifactId': props.artifactId,
                'version': props.version,
                'env': {
                    'DB_HOST': {
                        'secret': props.secretName,
                        'key': 'uri'
                    },
                    'DB_USERNAME': {
                        'secret': props.secretName,
                        'key': 'user'
                    },
                    'DB_PASSWORD': {
                        'secret': props.secretName,
                        'key': 'password'
                    }
                }
            };
            // First copy the files from the base Vert.x platform module
            // and then copy our own over that
            await this.applyGenerator(PlatformNodejs, resources, pprops, extra);
            await this.copy();
            const mergeFile = path.resolve(DatabaseCrudNodejs.sourceDir, 'merge/app.merge.js');
            await this.transform('app.js',
                insertAfter('//TODO: Add routes', await readFile(mergeFile, 'utf8')));

            // TODO Don't just blindly copy all files, we need to _patch_ some of
            // them instead (eg. pom.xml and arquillian.xml and Java code)
        }
        extra['sourceMapping'] = { 'dbEndpoint': 'lib/db/index.js' };
        return resources;
    }
}
