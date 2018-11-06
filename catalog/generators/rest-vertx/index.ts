
import { BaseGenerator } from 'core/catalog';

import PlatformVertx from 'generators/platform-vertx';

export default class RestVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        // First copy the files from the base Vert.x platform module
        // and then copy our own over that
        const pprops = {
            'application': props.application,
            'groupId': props.groupId,
            'artifactId': props.artifactId,
            'version': props.version,
        };
        await this.applyGenerator(PlatformVertx, resources, pprops);
        await this.copy();
        await this.mergePoms();
        return resources;
        // TODO Don't just blindly copy all files, we need to _patch_ some of
        // them instead (eg. pom.xml and arquillian.xml and Java code)
    }
}
