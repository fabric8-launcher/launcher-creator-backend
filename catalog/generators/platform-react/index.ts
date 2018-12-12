
import * as _ from 'lodash';

import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv,
    setDeploymentEnv,
    setMemoryResources, setPathHealthChecks
} from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BaseGeneratorProps, BasePlatformExtra, NodejsCoords } from 'core/catalog/types';

import PlatformBaseSupport from 'generators/platform-base-support';

export interface PlatformReactProps extends BaseGeneratorProps {
    nodejs: NodejsCoords;
    env?: object;
}

export interface PlatformReactExtra extends BasePlatformExtra {
}

export default class PlatformReact extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformReactProps, extra: any = {}) {
        const rtImage = 'nodeshift/centos7-s2i-web-app';
        const exProps: PlatformReactExtra = {
            'image': rtImage,
            'enumInfo': enumItem('framework.name', 'react'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.frameworkInfo', exProps);

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
            setBuildContextDir(res, props.subFolderName);
            setMemoryResources(res, { 'limit': '512Mi' });
            setPathHealthChecks(res, '/', '/');
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
