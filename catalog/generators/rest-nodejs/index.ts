
import { BaseGenerator } from 'core/catalog';

import PlatformNodejs from 'generators/platform-nodejs';

export default class RestVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base nodejs platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'serviceName': props.serviceName,
                'version': props.version,
            };

            await this.applyGenerator(PlatformNodejs, resources, pprops);
            await this.copy();
        }
        return resources;
    }
}
