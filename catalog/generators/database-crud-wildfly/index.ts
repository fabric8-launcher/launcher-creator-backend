import {cases} from 'core/template/transformers/cases';
import {Resources, setHealthProbe} from 'core/resources';
import {BaseGenerator} from 'core/catalog/types';

import {DatabaseSecretRef} from 'generators/database-secret';
import PlatformWildfly, {PlatformWildflyProps, isEAP} from 'generators/platform-wildfly';

export interface DatabaseCrudWildflyProps extends PlatformWildflyProps, DatabaseSecretRef {
    databaseType: string;
}

export default class DatabaseCrudWildfly extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: DatabaseCrudWildflyProps, extra?: object): Promise<Resources> {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            var pprops;
            if(isEAP()) {
                if('mysql' === props.databaseType) {
                    pprops = {
                        'application': props.application,
                        'subFolderName': props.subFolderName,
                        'serviceName': props.serviceName,
                        'routeName': props.routeName,
                        'maven': props.maven,
                        'env': {
                            'DB_SERVICE_PREFIX_MAPPING': props.application + '_DATABASE=DB',
                            'DB_DRIVER': 'mysql',
                            'DB_JNDI': 'java:/jboss/datasources/MyDS',
                            'DB_DATASOURCE': 'MyDS',
                            'DB_XA_CONNECTION_PROPERTY_ServerName': {
                                'secret': props.secretName,
                                'key': 'uri'
                            },
                            'DB_XA_CONNECTION_PROPERTY_PortNumber': 3306,
                            'DB_XA_CONNECTION_PROPERTY_DatabaseName': 'my_data',
                            'DB_USERNAME': {
                                'secret': props.secretName,
                                'key': 'user'
                            },
                            'DB_PASSWORD': {
                                'secret': props.secretName,
                                'key': 'password'
                            },
                            'GC_MAX_METASPACE_SIZE': '150',
                            'KUBERNETES_NAMESPACE' : {
                                'field': 'metadata.namespace'
                            }
                        }
                    } as PlatformWildflyProps;
                } else {
                    pprops = {
                        'application': props.application,
                        'subFolderName': props.subFolderName,
                        'serviceName': props.serviceName,
                        'routeName': props.routeName,
                        'maven': props.maven,
                        'env': {
                            'DB_SERVICE_PREFIX_MAPPING': props.application + '_DATABASE=DB',
                            'DB_DRIVER': 'postgresql',
                            'DB_JNDI': 'java:/jboss/datasources/MyDS',
                            'DB_DATASOURCE': 'MyDS',
                            'DB_XA_CONNECTION_PROPERTY_ServerName': {
                                'secret': props.secretName,
                                'key': 'uri'
                            },
                            'DB_XA_CONNECTION_PROPERTY_PortNumber': 5432,
                            'DB_XA_CONNECTION_PROPERTY_DatabaseName': 'my_data',
                            'DB_USERNAME': {
                                'secret': props.secretName,
                                'key': 'user'
                            },
                            'DB_PASSWORD': {
                                'secret': props.secretName,
                                'key': 'password'
                            },
                            'GC_MAX_METASPACE_SIZE': '150',
                            'KUBERNETES_NAMESPACE' : {
                                'field': 'metadata.namespace'
                            }
                        }
                    } as PlatformWildflyProps;
                }
            } else {
                if('mysql' === props.databaseType) {
                    pprops = {
                        'application': props.application,
                        'subFolderName': props.subFolderName,
                        'serviceName': props.serviceName,
                        'routeName': props.routeName,
                        'maven': props.maven,
                        'env': {
                            'MYSQL_DATABASE': 'my_data',
                            'MYSQL_SERVICE_HOST': {
                                'secret': props.secretName,
                                'key': 'uri'
                            },
                            'MYSQL_SERVICE_PORT': 3306,
                            'MYSQL_DATASOURCE': 'MyDS',
                            'MYSQL_USER': {
                                'secret': props.secretName,
                                'key': 'user'
                            },
                            'MYSQL_PASSWORD': {
                                'secret': props.secretName,
                                'key': 'password'
                            },
                            'GC_MAX_METASPACE_SIZE': '150',
                            'KUBERNETES_NAMESPACE' : {
                                'field': 'metadata.namespace'
                            }
                        }
                    } as PlatformWildflyProps;
                } else {
                    pprops = {
                        'application': props.application,
                        'subFolderName': props.subFolderName,
                        'serviceName': props.serviceName,
                        'routeName': props.routeName,
                        'maven': props.maven,
                        'env': {
                            'POSTGRESQL_DATABASE': 'my_data',
                            'POSTGRESQL_SERVICE_HOST': {
                                'secret': props.secretName,
                                'key': 'uri'
                            },
                            'POSTGRESQL_SERVICE_PORT': 5432,
                            'POSTGRESQL_DATASOURCE': 'MyDS',
                            'POSTGRESQL_USER': {
                                'secret': props.secretName,
                                'key': 'user'
                            },
                            'POSTGRESQL_PASSWORD': {
                                'secret': props.secretName,
                                'key': 'password'
                            },
                            'GC_MAX_METASPACE_SIZE': '150',
                            'KUBERNETES_NAMESPACE' : {
                                'field': 'metadata.namespace'
                            }
                        }
                    } as PlatformWildflyProps;
                }
            }
            await this.generator(PlatformWildfly).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms(`merge/pom.xml`);
            await this.transform('src/**/*.java', cases(props));
        }
        extra['sourceMapping'] = { 'dbEndpoint': this.join(props.subFolderName, 'src/main/java/io/openshift/booster/database/FruitResource.java') };
        return resources;
    }
}
