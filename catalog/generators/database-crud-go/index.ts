
import { Resources } from 'core/resources';
import { BaseGenerator } from 'core/catalog/types';

import PlatformGo, { PlatformGoProps } from 'generators/platform-go';
import { insertAfter } from 'core/template/transformers/insert';

import { DatabaseSecretRef } from 'generators/database-secret';
import { cases } from 'core/template/transformers/cases';

export interface DatabaseCrudGoProps extends PlatformGoProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudGo extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudGoProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
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
            } as PlatformGoProps;
            // First copy the files from the base Go platform module
            // and then copy our own over that
            await this.generator(PlatformGo).apply(resources, pprops, extra);
            await this.copy();
            await this.transform('**/*.go', cases(props));
            await this.transform('main.go',
                insertAfter('//TODO: Add imports', '\t"./crud"'));
            await this.transform('main.go',
                insertAfter('//TODO: Add routes', '\tcrud.RegisterEndpoints()'));
        }
        extra['sourceMapping'] = { 'dbEndpoint': this.join(props.subFolderName, 'crud/crud.go') };
        return resources;
    }
}
