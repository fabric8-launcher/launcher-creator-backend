
import { cases } from 'core/template/transformers';
import { Resources, setDeploymentEnv } from 'core/resources';
import { BaseGenerator } from 'core/catalog';

import PlatformVertx from 'generators/platform-vertx';

export default class DatabaseCrudVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props?: any): Promise<Resources> {
        const pprops = {
            'application': props.application,
            'groupId': props.groupId,
            'artifactId': props.artifactId,
            'version': props.version
        };
        const env = {
            'MY_DATABASE_SERVICE_HOST': {
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
        };
        // First copy the files from the base Vert.x platform module
        // and then copy our own over that
        await this.applyGenerator(PlatformVertx, resources, pprops);
        setDeploymentEnv(resources, env);
        await this.copy();
        await this.mergePoms(`merge/pom.${props.databaseType}.xml`);
        await this.transform('src/**/*.java', cases(props));
        return resources;
        // TODO Don't just blindly copy all files, we need to _patch_ some of
        // them instead (eg. pom.xml and arquillian.xml and Java code)
    }
}
