
import { cases } from 'core/template/transformers/cases';
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';

export default class LanguageJava extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: BaseGeneratorProps, extra: any = {}) {
        // Check if the gap file already exists, so we don't copy it twice
        if (!await this.filesCopied()) {
            await this.copy();
            await this.transform('gap', cases(props));
        }
        return resources;
    }
}
