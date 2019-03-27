
import * as _ from 'lodash';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BasePlatformExtra } from 'core/catalog/types';
import { BUILDER_JAVAEE_PRO } from 'core/resources/images';
import { BUILDER_JAVAEE } from 'core/resources/images';
import { setDefaultHealthChecks, setMemoryResources } from 'core/resources';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageJava, { LanguageJavaProps } from 'generators/language-java';
import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';

export interface PlatformWildflyProps extends LanguageJavaProps, MavenSetupProps {
    runtime; string;
}

export interface PlatformWildflyExtra extends BasePlatformExtra {
}

export default class PlatformWildfly extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformWildflyProps, extra: any = {}) {
        if(isEAP()) {
            const exProps: PlatformWildflyExtra = {
                'image': BUILDER_JAVAEE_PRO,
                'enumInfo': enumItem('runtime.name', 'eap'),
                'service': props.serviceName,
                'route': props.routeName
            };
            _.set(extra, 'shared.runtimeInfo', exProps);
        } else {
            const exProps: PlatformWildflyExtra = {
                'image': BUILDER_JAVAEE,
                'enumInfo': enumItem('runtime.name', 'wildfly'),
                'service': props.serviceName,
                'route': props.routeName
            };
            _.set(extra, 'shared.runtimeInfo', exProps);
        }

        const jarName = 'ROOT.war';
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            if(isEAP()) {
                await this.mergePoms(`merge/pom.eap.xml`);
                const lprops: LanguageJavaProps = { ...props, jarName, 'builderImage': BUILDER_JAVAEE_PRO };
                await this.generator(LanguageJava).apply(resources, lprops, extra);
            } else {
                await this.mergePoms(`merge/pom.wildfly.xml`);  const lprops: LanguageJavaProps = { ...props, jarName, 'builderImage': BUILDER_JAVAEE };
                await this.generator(LanguageJava).apply(resources, lprops, extra);
            }
            await this.generator(MavenSetup).apply(resources, props, extra);
            await this.copy();
        }
        setMemoryResources(resources, { 'limit': '1G' }, props.serviceName);
        setDefaultHealthChecks(resources, props.serviceName);
        return resources;
    }
}

export function isEAP() {
    return false;
}