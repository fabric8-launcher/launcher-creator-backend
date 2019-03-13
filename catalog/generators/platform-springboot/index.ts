
import * as _ from 'lodash';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BasePlatformExtra } from 'core/catalog/types';
import { BUILDER_JAVA } from 'core/resources/images';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageJava, { LanguageJavaProps } from 'generators/language-java';
import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';

export interface PlatformSpringBootProps extends LanguageJavaProps, MavenSetupProps {
}

export interface PlatformSpringBootExtra extends BasePlatformExtra {
}

export default class PlatformSpringBoot extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformSpringBootProps, extra: any = {}) {
        const exProps: PlatformSpringBootExtra = {
            'image': BUILDER_JAVA,
            'enumInfo': enumItem('runtime.name', 'springboot'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        const jarName = props.maven.artifactId + '-' + props.maven.version + '.jar';
        const lprops: LanguageJavaProps = { ...props, jarName, 'builderImage': BUILDER_JAVA };

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
        }
        await this.generator(LanguageJava).apply(resources, lprops, extra);
        return await this.generator(MavenSetup).apply(resources, props, extra);
    }
}
