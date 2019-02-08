
import * as _ from 'lodash';

import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv,
    setDefaultHealthChecks,
    setDeploymentEnv, setMemoryResources
} from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BaseGeneratorProps, BasePlatformExtra, NodejsCoords, Runtime } from 'core/catalog/types';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageNodejs from 'generators/language-nodejs';

export interface PlatformNodejsProps extends BaseGeneratorProps {
    runtime: Runtime;
    nodejs: NodejsCoords;
    env?: object;
}

export interface PlatformNodejsExtra extends BasePlatformExtra {
}

export default class PlatformNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformNodejsProps, extra: any = {}) {
        const rtImage = 'nodeshift/centos7-s2i-nodejs';
        const exProps: PlatformNodejsExtra = {
            'image': rtImage,
            'enumInfo': enumItem('runtime.name', 'nodejs'),
            'service': props.serviceName,
            'route': props.routeName
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
            await this.transform(['package.json'], cases(props));
            await this.generator(LanguageNodejs).apply(resources, props, extra);
            const res = await newApp(
                props.serviceName,
                props.application,
                rtImage,
                null,
                props.env || {});
            setBuildContextDir(res, props.subFolderName);
            setDefaultHealthChecks(res);
            setMemoryResources(res, { 'limit': '1024Mi' });
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
