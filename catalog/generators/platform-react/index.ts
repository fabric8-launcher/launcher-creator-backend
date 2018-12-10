
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
import { BaseGenerator, BaseGeneratorProps, NodejsCoords } from 'core/catalog/types';

import PlatformBaseSupport from 'generators/platform-base-support';

export interface PlatformReactProps extends BaseGeneratorProps {
    nodejs: NodejsCoords;
    env?: object;
}

export default class PlatformReact extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformReactProps, extra: any = {}) {
        const rtImage = 'nodeshift/centos7-s2i-web-app';
        _.set(extra, 'shared.frameworkImage', rtImage);
        _.set(extra, 'shared.frameworkInfo', enumItem('framework.name', 'react'));
        _.set(extra, 'shared.frameworkService', props.serviceName);
        _.set(extra, 'shared.frameworkRoute', props.routeName);

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
            setMemoryResources(res, { 'limit': '512Mi' });
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
