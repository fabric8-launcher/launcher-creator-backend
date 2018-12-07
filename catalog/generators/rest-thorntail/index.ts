import {BaseGenerator} from 'core/catalog/types';
import PlatformThorntail, {PlatformThorntailProps} from 'generators/platform-thorntail';

export interface RestThorntailProps extends PlatformThorntailProps {
}

export default class RestThorntail extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: RestThorntailProps, extra: any = {}) {
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
            } as PlatformThorntailProps;
            await this.generator(PlatformThorntail).apply(resources, pprops, extra);
            await this.copy();
            await this.mergePoms();
        }
        extra['sourceMapping'] = {
            'greetingEndpoint': this.join(props.tier, 'src/main/java/io/openshift/booster/http/GreetingEndpoint.java')
        };
        return resources;
    }
}
