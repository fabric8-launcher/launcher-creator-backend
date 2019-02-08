import * as _ from 'lodash';
import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv,
    setDefaultHealthChecks,
    setDeploymentEnv,
    setMemoryResources
} from 'core/resources';
import {cases} from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BaseGeneratorProps, BasePlatformExtra } from 'core/catalog/types';

import MavenSetup, {MavenSetupProps} from 'generators/maven-setup';
import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageJava from 'generators/language-java';

export interface PlatformThorntailProps extends BaseGeneratorProps, MavenSetupProps {
    env?: object;
}

export interface PlatformThorntailExtra extends BasePlatformExtra {
}

export default class PlatformThorntail extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformThorntailProps, extra: any = {}) {
        const rtImage = 'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift';
        const exProps: PlatformThorntailExtra = {
            'image': rtImage,
            'enumInfo': enumItem('runtime.name', 'thorntail'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
            await this.generator(LanguageJava).apply(resources, props, extra);
            await this.generator(MavenSetup).apply(resources, props, extra);
            const res = await newApp(
                props.serviceName,
                props.application,
                rtImage,
                null,
                props.env || {});
            setBuildContextDir(res, props.subFolderName);
            setDefaultHealthChecks(res);
            setMemoryResources(res, { 'limit': '2G' });
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
