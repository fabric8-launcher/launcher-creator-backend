
import { cases } from 'core/template/transformers/cases';
import { Resources, setDeploymentEnv } from 'core/resources';
import { BaseGenerator } from 'core/catalog';

import PlatformVertx from 'generators/platform-vertx';
import {insertAfter} from "core/template/transformers/insert";

export default class DatabaseCrudVertx extends BaseGenerator {
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
            await this.applyGenerator(PlatformVertx, resources, pprops, extra);
            await this.copy();
            await this.mergePoms(`merge/pom.${props.databaseType}.xml`);
            await this.transform('src/**/*.java', cases(props));
            await this.transform('src/main/java/io/openshift/booster/MainApplication.java',
                insertAfter('//TODO: Add Router Consumers', '      new io.openshift.booster.database.CrudApplication(vertx),'));

            // TODO Don't just blindly copy all files, we need to _patch_ some of
            // them instead (eg. pom.xml and arquillian.xml and Java code)
        }
        extra['sourceMapping'] = { 'dbEndpoint': 'src/main/java/io/openshift/booster/database/CrudApplication.java' };
        return resources;
    }
}
