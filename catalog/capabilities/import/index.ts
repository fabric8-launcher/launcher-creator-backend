
import { BaseCapability } from 'core/catalog/types';

import ImportCodebase, { ImportCodebaseProps } from 'generators/import-codebase';

export default class Import extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        const appName = this.name(props.application, props.subFolderName);
        const rtServiceName = appName;
        const rtRouteName = appName;
        const icprops: ImportCodebaseProps = {
            'application': props.application,
            'subFolderName': props.subFolderName,
            'serviceName': rtServiceName,
            'routeName': rtRouteName,
            'maven': props.maven,
            'nodejs': props.nodejs,
            'dotnet': props.dotnet,
            'gitImportUrl': props.gitImportUrl,
            'builderImage': props.builderImage,
            'builderLanguage': props.builderLanguage,
            'env': props.env,
            'overlayOnly': props.overlayOnly,
            'keepGitFolder': props.keepGitFolder
        };
        return await this.generator(ImportCodebase).apply(resources, icprops, extra);
    }
}
