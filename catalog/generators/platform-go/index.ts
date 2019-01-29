
import * as _ from 'lodash';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BasePlatformExtra } from 'core/catalog/types';
import { BUILDER_GOLANG } from 'core/resources/images';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageGo, { LanguageGoProps } from 'generators/language-go';

export interface PlatformGoProps extends LanguageGoProps {
    env?: object;
}

export interface PlatformGoExtra extends BasePlatformExtra {
}

export default class PlatformGo extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformGoProps, extra: any = {}) {
        const exProps: PlatformGoExtra = {
            'image': BUILDER_GOLANG,
            'enumInfo': enumItem('runtime.name', 'go'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        const lprops: LanguageGoProps = { ...props, 'builderImage': BUILDER_GOLANG };

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
        }
        return await this.generator(LanguageGo).apply(resources, lprops, extra);
    }
}
