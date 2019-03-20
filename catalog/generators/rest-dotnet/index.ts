
import { cases } from 'core/template/transformers/cases';
import { BaseGenerator } from 'core/catalog/types';

import PlatformDotNet, { PlatformDotNetProps } from 'generators/platform-dotnet';

export interface RestDotNetProps extends PlatformDotNetProps {
}

export default class RestDotNet extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: RestDotNetProps, extra: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base DoNet platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'subFolderName': props.subFolderName,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'dotnet': props.dotnet,
            } as PlatformDotNetProps;
            await this.generator(PlatformDotNet).apply(resources, pprops, extra);
            await this.copy();
            await this.transform('**/*.cs', cases(props));
        }
        extra['sourceMapping'] = { 'greetingEndpoint': this.join(props.subFolderName, 'Controllers/GreetingController.cs') };
        return resources;
    }

}
