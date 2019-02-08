
import * as _ from 'lodash';
import { setBuildEnv, setDeploymentEnv } from 'core/resources';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BasePlatformExtra, Runtime } from 'core/catalog/types';
import { BUILDER_JAVA } from 'core/resources/images';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageJava, { JavaLanguageProps } from 'generators/language-java';

export interface PlatformVertxProps extends JavaLanguageProps {
}

export interface PlatformVertxExtra extends BasePlatformExtra {
}

export default class PlatformVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformVertxProps, extra: any = {}) {
        const exProps: PlatformVertxExtra = {
            'image': BUILDER_JAVA,
            'enumInfo': enumItem('runtime.name', 'vertx'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        const lprops: JavaLanguageProps = { ...props, 'image': BUILDER_JAVA };

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
        }
        return await this.generator(LanguageJava).apply(resources, lprops, extra);
    }
}
