
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
import { BaseGenerator, BaseGeneratorProps, NodejsCoords, Runtime } from 'core/catalog/types';

import PlatformBaseSupport from 'generators/platform-base-support';

export interface PlatformNodejsProps extends BaseGeneratorProps {
    runtime: Runtime;
    nodejs: NodejsCoords;
    env?: object;
}

export default class PlatformNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformNodejsProps, extra: any = {}) {
        const rtImage = 'nodeshift/centos7-s2i-nodejs';
        _.set(extra, 'shared.runtimeImage', rtImage);
        _.set(extra, 'shared.runtimeInfo', enumItem('runtime.name', 'nodejs'));
        _.set(extra, 'shared.runtimeService', props.serviceName);
        _.set(extra, 'shared.runtimeRoute', props.routeName);

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
            await this.transform(['package.json', 'gap'], cases(props));
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
