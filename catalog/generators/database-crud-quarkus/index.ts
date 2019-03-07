import {cases} from 'core/template/transformers/cases';
import {Resources} from 'core/resources';
import {BaseGenerator} from 'core/catalog/types';

import {DatabaseSecretRef} from 'generators/database-secret';
import PlatformQuarkus, {PlatformQuarkusProps} from 'generators/platform-quarkus';

export interface DatabaseCrudQuarkusProps extends PlatformQuarkusProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudQuarkus extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudQuarkusProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'subFolderName': props.subFolderName,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
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
                    },
                    'JAVA_OPTIONS': `-Dquarkus.datasource.url=jdbc:${props.databaseType}://$(DB_HOST)/my_data
                     -Dquarkus.datasource.username=$(DB_USERNAME)
                     -Dquarkus.datasource.password=$(DB_PASSWORD)`
                    ,
                   'GC_MAX_METASPACE_SIZE': '150',
                   'KUBERNETES_NAMESPACE' : {
                        'field': 'metadata.namespace'
                   }
                }
            } as PlatformQuarkusProps;
            await this.generator(PlatformQuarkus).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms(`merge/pom.${props.databaseType}.xml`);
            // TODO: Merge properties

            await this.transform('src/**/*.java', cases(props));
        }
        extra['sourceMapping'] = { 'dbEndpoint': this.join(props.subFolderName,
                'src/main/java/io/openshift/booster/database/FruitResource.java') };
        return resources;
    }
}
