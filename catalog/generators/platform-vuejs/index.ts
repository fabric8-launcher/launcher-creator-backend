
import * as _ from 'lodash';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, NodejsCoords } from 'core/catalog/types';
import { BUILDER_NODEJS_WEB } from 'core/resources/images';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageNodejs, { LanguageNodejsExtra, LanguageNodejsProps } from 'generators/language-nodejs';

export interface PlatformVueJSProps extends LanguageNodejsProps {
    nodejs: NodejsCoords;
}

export interface PlatformVueJSExtra extends LanguageNodejsExtra {
}

export default class PlatformVueJS extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformVueJSProps, extra: any = {}) {
        const exProps: PlatformVueJSExtra = {
            'image': BUILDER_NODEJS_WEB,
            'enumInfo': enumItem('runtime.name', 'vuejs'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        const env = { ...(props.env || {}), 'OUTPUT_DIR': 'dist'};
        const lprops: LanguageNodejsProps = { ...props, env, 'builderImage': BUILDER_NODEJS_WEB };

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
            await this.transform(['package.json'], cases(props));
        }
        return await this.generator(LanguageNodejs).apply(resources, lprops, extra);
    }
}
