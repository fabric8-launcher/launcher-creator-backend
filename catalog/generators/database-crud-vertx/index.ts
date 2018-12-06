
import { cases } from 'core/template/transformers/cases';
import { Resources } from 'core/resources';
import { BaseGenerator } from 'core/catalog/types';
import { blocks, insertAtEnd } from 'core/template/transformers/blocks';

import PlatformVertx, { PlatformVertxProps } from 'generators/platform-vertx';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabaseCrudVertxProps extends PlatformVertxProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudVertxProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'tier': props.tier,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'runtime': props.runtime,
                'maven': props.maven,
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
            } as PlatformVertxProps;
            // First copy the files from the base Vert.x platform module
            // and then copy our own over that
            await this.generator(PlatformVertx).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms(`merge/pom.${props.databaseType}.xml`);
            await this.transform('src/**/*.java', cases(props));
            await this.transform('src/main/java/io/openshift/booster/MainApplication.java',
                blocks('return new RouterConsumer[]{', '}',
                    insertAtEnd('      new io.openshift.booster.database.CrudApplication(vertx),')));
        }
        extra['sourceMapping'] = {
            'dbEndpoint': this.join(props.tier, 'src/main/java/io/openshift/booster/database/CrudApplication.java')
        };
        return resources;
    }
}
