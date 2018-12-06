import {cases} from 'core/template/transformers/cases';
import {Resources} from 'core/resources';
import {BaseGenerator} from 'core/catalog/types';

import {DatabaseSecretRef} from 'generators/database-secret';
import PlatformThorntail, {PlatformThorntailProps} from 'generators/platform-thorntail';

export interface DatabaseCrudThorntailProps extends PlatformThorntailProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudThorntail extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudThorntailProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            const pprops = {
                'application': props.application,
                'tier': props.tier,
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
                    'JAVA_OPTIONS': `-Dswarm.datasources.data-sources.MyDS.connection-url=jdbc:${props.databaseType}://$(DB_HOST)/my_data
                     -Dswarm.datasources.data-sources.MyDS.user-name=$(DB_USERNAME)
                     -Dswarm.datasources.data-sources.MyDS.password=$(DB_PASSWORD)
                     -Dswarm.datasources.data-sources.MyDS.driver-name=${props.databaseType}`
                    ,
                   'GC_MAX_METASPACE_SIZE': '150',
                   'KUBERNETES_NAMESPACE' : {
                        'field': 'metadata.namespace'
                   }
                }
            } as PlatformThorntailProps;
            await this.generator(PlatformThorntail).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms(`merge/pom.${props.databaseType}.xml`);
            await this.transform('src/**/*.java', cases(props));
        }
        extra['sourceMapping'] = { 'dbEndpoint': this.join(props.tier, 'src/main/java/io/openshift/booster/database/FruitResource.java') };
        return resources;
    }
}
