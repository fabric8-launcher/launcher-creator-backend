
import { BaseGenerator } from 'core/catalog/types';
import PlatformGo, { PlatformGoProps } from 'generators/platform-go';
import { insertAfter } from 'core/template/transformers/insert';

export interface RestGoProps extends PlatformGoProps {
}

export default class RestGo extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: RestGoProps, extra: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base Go platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'subFolderName': props.subFolderName,
                'serviceName': props.serviceName,
                'routeName': props.routeName
            };

            await this.generator(PlatformGo).apply(resources, pprops, extra);
            await this.transform('main.go',
                insertAfter('//TODO: Add imports', '\t"./rest"'));
            await this.transform('main.go',
                insertAfter('//TODO: Add routes', '\trest.RegisterEndpoints()'));
            await this.copy();
        }
        extra['sourceMapping'] = { 'greetingEndpoint': this.join(props.subFolderName, 'rest/greeting.go') };
        return resources;
    }
}
