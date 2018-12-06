
import { Resources } from 'core/resources';
import { BaseGenerator } from 'core/catalog/types';

import PlatformNodejs, { PlatformNodejsProps } from 'generators/platform-nodejs';
import { insertAfter } from 'core/template/transformers/insert';

import * as path from 'path';
import { readFile } from 'fs-extra';
import { cases } from 'core/template/transformers/cases';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabaseCrudNodejsProps extends PlatformNodejsProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudNodejsProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'runtime': props.runtime,
                'nodejs': props.nodejs,
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
            } as PlatformNodejsProps;
            // First copy the files from the base Vert.x platform module
            // and then copy our own over that
            await this.generator(PlatformNodejs).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePackageJson();
            await this.transform('lib/**/*.js', cases(props));
            const mergeFile = path.resolve(DatabaseCrudNodejs.sourceDir, 'merge/app.merge.js');
            await this.transform('app.js',
                insertAfter('//TODO: Add routes', await readFile(mergeFile, 'utf8')));
        }
        extra['sourceMapping'] = { 'dbEndpoint': this.join(props.tier, 'lib/routes/fruits.js') };
        return resources;
    }
}
