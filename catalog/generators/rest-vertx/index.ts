
import { BaseGenerator } from 'core/catalog/types';
import { blocks, insertAtEnd } from 'core/template/transformers/blocks';

import PlatformVertx, { PlatformVertxProps } from 'generators/platform-vertx';

export interface RestVertxProps extends PlatformVertxProps {
}

export default class RestVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: RestVertxProps, extra: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base Vert.x platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'tier': props.tier,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'maven': props.maven,
            } as PlatformVertxProps;
            await this.generator(PlatformVertx).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms();
            await this.transform('src/main/java/io/openshift/booster/MainApplication.java',
                blocks('return new RouterConsumer[]{', '}',
                    insertAtEnd('      new io.openshift.booster.http.HttpApplication(vertx)')));
        }
        extra['sourceMapping'] = {
            'greetingEndpoint': this.join(props.tier, 'src/main/java/io/openshift/booster/http/HttpApplication.java')
        };
        return resources;
    }
}
