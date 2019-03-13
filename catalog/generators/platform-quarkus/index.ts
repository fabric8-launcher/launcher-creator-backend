import * as _ from 'lodash';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BasePlatformExtra } from 'core/catalog/types';
import { BUILDER_JAVA } from 'core/resources/images';
import { setMemoryResources } from 'core/resources';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageJava, { LanguageJavaProps } from 'generators/language-java';
import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';

export interface PlatformQuarkusProps extends LanguageJavaProps, MavenSetupProps {
}

export interface PlatformQuarkusExtra extends BasePlatformExtra {
}

export default class PlatformQuarkus extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformQuarkusProps, extra: any = {}) {
        const exProps: PlatformQuarkusExtra = {
            'image': BUILDER_JAVA,
            'enumInfo': enumItem('runtime.name', 'quarkus'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        const jarName = props.maven.artifactId + '-runner.jar';
        const env = { ...(props.env || {}), 'JAVA_APP_JAR': jarName, 'ARTIFACT_COPY_ARGS' : `-p -r lib/ ${jarName}`};
        const lprops: LanguageJavaProps = { ...props, env, jarName, 'builderImage': BUILDER_JAVA};
        
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
        }
        await this.generator(LanguageJava).apply(resources, lprops, extra);
        await this.generator(MavenSetup).apply(resources, props, extra);
        setMemoryResources(resources, { 'limit': '512Mi' });
        return resources;
    }
}
