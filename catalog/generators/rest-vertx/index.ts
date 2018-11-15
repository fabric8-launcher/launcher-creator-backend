
import { BaseGenerator } from 'core/catalog';
import { blocks, insertAtEnd } from 'core/template/transformers/blocks';

import PlatformVertx from 'generators/platform-vertx';

export default class RestVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}, extra: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base Vert.x platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'serviceName': props.serviceName,
                'groupId': props.groupId,
                'artifactId': props.artifactId,
                'version': props.version,
            };
            await this.generator(PlatformVertx).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms();
            await this.transform('src/main/java/io/openshift/booster/MainApplication.java',
                blocks('return new RouterConsumer[]{', '}',
                    insertAtEnd('      new io.openshift.booster.http.HttpApplication(vertx)')));
        }
        extra['sourceMapping'] = { 'greetingEndpoint': 'src/main/java/io/openshift/booster/http/HttpApplication.java' };
        return resources;
    }
}
