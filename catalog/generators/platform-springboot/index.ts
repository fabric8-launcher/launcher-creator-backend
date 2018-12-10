
import * as _ from 'lodash';

import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv,
    setDefaultHealthChecks,
    setDeploymentEnv
} from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';

import PlatformBaseSupport from 'generators/platform-base-support';
import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';

export interface PlatformSpringBootProps extends BaseGeneratorProps, MavenSetupProps {
    env?: object;
}

export default class PlatformSpringBoot extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformSpringBootProps, extra: any = {}) {
        const rtImage = 'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift';
        _.set(extra, 'shared.runtimeImage', rtImage);
        _.set(extra, 'shared.runtimeInfo', enumItem('runtime.name', 'springboot'));
        _.set(extra, 'shared.runtimeService', props.serviceName);
        _.set(extra, 'shared.runtimeRoute', props.routeName);

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
            await this.transform('gap', cases(props));
            await this.generator(MavenSetup).apply(resources, props, extra);
            const res = await newApp(
                props.serviceName,
                props.application,
                rtImage,
                null,
                props.env || {});
            setBuildContextDir(res, props.tier);
            setDefaultHealthChecks(res);
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
