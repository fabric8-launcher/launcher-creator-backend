
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';
import { builderById, builderByLanguage, BuilderImage } from 'core/resources/images';
import { determineBuilderImageFromGit } from 'core/analysis';

import LanguageJava from 'generators/language-java';
import LanguageNodejs from 'generators/language-nodejs';

// Returns the corresponding language generator depending on the given builder image
function languageByBuilder(builder: BuilderImage) {
    if (builder && builder.metadata.language === 'java') {
        return LanguageJava;
    } else if (builder && builder.metadata.language === 'nodejs') {
        return LanguageNodejs;
    } else {
        throw new Error(`Unsupported builder: ${builder}`);
    }
}

export interface ImportCodebaseProps extends BaseGeneratorProps {
    gitImportUrl: string;
    builderImage?: string;
    builderLanguage?: string;
}

export default class ImportCodebase extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: ImportCodebaseProps, extra: any = {}) {
        const image = builderById(props.builderImage)
            || builderByLanguage(props.builderLanguage)
            || await determineBuilderImageFromGit(props.gitImportUrl);
        const lprops = {
            ...props,
            'builderImage': image.id,
        };
        const res = await this.generator(languageByBuilder(image)).apply(resources, lprops, extra);
        const param = res.parameter('SOURCE_REPOSITORY_URL');
        if (!!param) {
            param.value = props.gitImportUrl;
        }
        return res;
    }
}
