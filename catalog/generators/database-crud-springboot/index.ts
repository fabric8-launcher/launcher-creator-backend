
import { Resources } from 'core/resources';
import { BaseGenerator } from 'core/catalog/types';

import PlatformSpringBoot, { PlatformSpringBootProps } from 'generators/platform-springboot';
import { DatabaseSecretRef } from 'generators/database-secret';
import { cases } from 'core/template/transformers/cases';

export interface DatabaseCrudSpringBootProps extends PlatformSpringBootProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudSpringBoot extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudSpringBootProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'serviceName': props.serviceName,
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
            } as PlatformSpringBootProps;
            // First copy the files from the base SpringBoot platform module
            // and then copy our own over that
            await this.generator(PlatformSpringBoot).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms(`merge/pom.${props.databaseType}.xml`);
            await this.transform('src/**/*.properties', cases(props));
        }
        extra['sourceMapping'] = { 'dbEndpoint': 'src/main/java/io/openshift/booster/database/service/FruitRepository.java' };
        return resources;
    }
}
