import {BaseGenerator} from 'core/catalog/types';
import PlatformWildfly, {PlatformWildflyProps} from 'generators/platform-wildfly';

export interface RestWildflyProps extends PlatformWildflyProps {
}

export default class RestWildfly extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: RestWildflyProps, extra: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base Vert.x platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'subFolderName': props.subFolderName,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'maven': props.maven,
            } as PlatformWildflyProps;
            await this.generator(PlatformWildfly).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms();
        }
        extra['sourceMapping'] = {
            'greetingEndpoint': this.join(props.subFolderName, 'src/main/java/io/openshift/booster/http/GreetingEndpoint.java')
        };
        return resources;
    }
}
