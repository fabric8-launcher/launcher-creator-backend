import * as path from 'path';
import { readFile } from 'fs-extra';

import { Resources } from 'core/resources';
import { BaseGenerator } from 'core/catalog/types';

import PlatformDotNet, { PlatformDotNetProps } from 'generators/platform-dotnet';
import { insertAfter, insertBefore } from 'core/template/transformers/insert';

import { cases } from 'core/template/transformers/cases';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabaseCrudDotNetProps extends PlatformDotNetProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudDotNet extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudDotNetProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'subFolderName': props.subFolderName,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'dotnet': props.dotnet,
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
            } as PlatformDotNetProps;
            // First copy the files from the base .NET Core platform module
            // and then copy our own over that
            await this.generator(PlatformDotNet).apply(resources, pprops, extra);
            await this.copy();
            var csprojFile = props.application + '.csproj'
            var mergeFile: string;

            // Update csproj file
            if (props.databaseType == 'postgresql') {
                mergeFile = path.resolve(DatabaseCrudDotNet.sourceDir, 'merge/dbproject-postgresql');
            } else if (props.databaseType == 'mysql') {
                mergeFile = path.resolve(DatabaseCrudDotNet.sourceDir, 'merge/dbproject-mysql');
            }
            await this.transform(csprojFile,
                insertAfter('<!-- Add additional package references here -->', await readFile(mergeFile, 'utf8')));

            // Update Startup.cs
            mergeFile = path.resolve(DatabaseCrudDotNet.sourceDir, 'merge/efcore');
            await this.transform('Startup.cs',
                insertBefore('using ' + props.dotnet.namespace + '.Models;', await readFile(mergeFile, 'utf8')));

            mergeFile = path.resolve(DatabaseCrudDotNet.sourceDir, 'merge/dbcontext');
            await this.transform('Startup.cs',
                insertAfter('// Add any DbContext here', await readFile(mergeFile, 'utf8')));

            mergeFile = path.resolve(DatabaseCrudDotNet.sourceDir, 'merge/dbinitialize');
            await this.transform('Startup.cs',
                insertAfter('// Optionally, initialize Db with data here', await readFile(mergeFile, 'utf8')));



            await this.transform('**/*.cs', cases(props));
        }
        // TODO what is sourceMapping for?
        // extra['sourceMapping'] = { 'dbEndpoint': this.join(props.subFolderName, 'lib/routes/fruits.js') };
        return resources;
    }
}
