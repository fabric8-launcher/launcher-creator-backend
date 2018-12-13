
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
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BaseGeneratorProps, BasePlatformExtra, Runtime } from 'core/catalog/types';

import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';
import PlatformBaseSupport from 'generators/platform-base-support';

export interface PlatformVertxProps extends BaseGeneratorProps, MavenSetupProps {
    runtime: Runtime;
    env?: object;
}

export interface PlatformVertxExtra extends BasePlatformExtra {
}

export default class PlatformVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformVertxProps, extra: any = {}) {
        const rtImage = 'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift';
        const exProps: PlatformVertxExtra = {
            'image': rtImage,
            'enumInfo': enumItem('runtime.name', 'vertx'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

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
            setBuildContextDir(res, props.subFolderName);
            setMemoryResources(res, { 'limit': '2G' });
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
