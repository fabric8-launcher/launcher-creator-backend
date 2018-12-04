
import * as _ from 'lodash';
import { newApp, newRoute, setBuildEnv, setDeploymentEnv } from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BaseGeneratorProps, Runtime } from 'core/catalog/types';

import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';

export interface PlatformVertxProps extends BaseGeneratorProps, MavenSetupProps {
    runtime: Runtime;
    env?: object;
}

export default class PlatformVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformVertxProps, extra: any = {}) {
        const rtImage = 'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift';
        _.set(extra, 'shared.runtimeImage', rtImage);
        _.set(extra, 'shared.runtimeInfo', enumItem('runtime.name', 'vertx'));
        _.set(extra, 'shared.runtimeService', props.serviceName);

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform('gap', cases(props));
            await this.generator(MavenSetup).apply(resources, props, extra);
            const res = await newApp(
                props.serviceName,
                props.application,
                rtImage,
                null,
                props.env || {});
            resources.add(res);
            return await newRoute(resources, props.application + '-route', props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
