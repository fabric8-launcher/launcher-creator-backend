import {BaseGenerator} from 'core/catalog/types';
import PlatformQuarkus, { PlatformQuarkusProps } from 'generators/platform-quarkus';

export interface RestQuarkusProps extends PlatformQuarkusProps {
}

export default class RestQuarkus extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: RestQuarkusProps, extra: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base Vert.x platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'subFolderName': props.subFolderName,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'runtime': props.runtime,
                'maven': props.maven,
            } as PlatformQuarkusProps;
            await this.generator(PlatformQuarkus).apply(resources, pprops, extra);
            await this.copy();
        }
        extra['sourceMapping'] = {
            'greetingEndpoint': this.join(props.subFolderName, 'src/main/java/io/openshift/booster/http/GreetingEndpoint.java')
        };
        return resources;
    }
}
