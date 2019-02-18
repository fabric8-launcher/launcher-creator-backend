
import { BaseCapability } from 'core/catalog/types';

import ImportCodebase from 'generators/import-codebase';

export default class Import extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        const appName = this.name(props.application, props.subFolderName);
        const rtServiceName = appName;
        const rtRouteName = appName;
        const icprops = {
            'application': props.application,
            'subFolderName': props.subFolderName,
            'serviceName': rtServiceName,
            'routeName': rtRouteName,
            'gitImportUrl': props.gitImportUrl,
            'builderImage': props.builderImage,
            'builderLanguage': props.builderLanguage
        };
        return await this.generator(ImportCodebase).apply(resources, icprops, extra);
    }
}
