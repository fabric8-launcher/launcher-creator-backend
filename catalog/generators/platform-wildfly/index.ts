
import * as _ from 'lodash';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BasePlatformExtra, Runtime } from 'core/catalog/types';
import { BUILDER_JAVAEE } from 'core/resources/images';
import { setDefaultHealthChecks, setMemoryResources } from 'core/resources';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageJava, { LanguageJavaProps } from 'generators/language-java';
import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';

export interface PlatformWildflyProps extends LanguageJavaProps, MavenSetupProps {
    runtime: Runtime;
}

export interface PlatformWildflyExtra extends BasePlatformExtra {
}

export default class PlatformWildfly extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformWildflyProps, extra: any = {}) {
        const exProps: PlatformWildflyExtra = {
            'image': BUILDER_JAVAEE,
            'enumInfo': enumItem('runtime.name', 'wildfly'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        const jarName = 'ROOT.war';
        const lprops: LanguageJavaProps = { ...props, jarName, 'builderImage': BUILDER_JAVAEE };

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
        }
        await this.generator(LanguageJava).apply(resources, lprops, extra);
        setMemoryResources(resources, { 'limit': '1G' }, props.serviceName);
        setDefaultHealthChecks(resources, props.serviceName);
        await this.generator(MavenSetup).apply(resources, props, extra);
        return resources;
    }
}
