
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';
import { builderById, builderByLanguage, BuilderImage } from 'core/resources/images';
import { cloneGitRepo, determineBuilderImage, determineBuilderImageFromGit, removeGitFolder } from 'core/analysis';

import LanguageJava from 'generators/language-java';
import LanguageNodejs from 'generators/language-nodejs';
import LanguageCSharp from 'generators/language-csharp';

// Returns the corresponding language generator depending on the given builder image
function languageByBuilder(builder: BuilderImage) {
    if (builder && builder.metadata.language === 'java') {
        return LanguageJava;
    } else if (builder && builder.metadata.language === 'nodejs') {
        return LanguageNodejs;
    } else if (builder && builder.metadata.language === 'csharp') {
        return LanguageCSharp;
    } else {
        throw new Error(`Unsupported builder: ${builder}`);
    }
}

export interface ImportCodebaseProps extends BaseGeneratorProps {
    gitImportUrl: string;
    builderImage?: string;
    builderLanguage?: string;
    overlayOnly: boolean;
    keepGitFolder: boolean;
}

export default class ImportCodebase extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: ImportCodebaseProps, extra: any = {}) {
        let image = builderById(props.builderImage)
            || builderByLanguage(props.builderLanguage);
        if (props.overlayOnly) {
            if (!image) {
                image = await determineBuilderImageFromGit(props.gitImportUrl);
            }
        } else {
            await cloneGitRepo(props.gitImportUrl, this.targetDir);
            if (!image) {
                image = await determineBuilderImage(this.targetDir);
            }
            if (!props.keepGitFolder) {
                await removeGitFolder(this.targetDir);
            }
        }
        const lprops = {
            ...props,
            'builderImage': image.id,
            'binaryExt': image.metadata.binaryExt
        };
        const res = await this.generator(languageByBuilder(image)).apply(resources, lprops, extra);
        const param = res.parameter('SOURCE_REPOSITORY_URL');
        if (!!param) {
            param.value = props.gitImportUrl;
        }
        return res;
    }
}
