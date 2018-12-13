
import { cases } from 'core/template/transformers/cases';

import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';

export interface PlatformBaseSupportProps extends BaseGeneratorProps {
}

export default class PlatformBaseSupport extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformBaseSupportProps, extra: any = {}) {
        // This is here in case we get applied in a subFolderName of our own
        // (meaning there's no runtime/framework so there's no gap or README)
        if (!!props.subFolderName && !await this.filesCopied('files', '..')) {
            await this.copy('files', '..');
            await this.transform('../gap', cases(props));
        }
        return resources;
    }
}
