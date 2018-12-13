
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
import { BaseGenerator, BaseGeneratorProps, NodejsCoords } from 'core/catalog/types';

import PlatformBaseSupport from 'generators/platform-base-support';

export interface PlatformAngularProps extends BaseGeneratorProps {
    nodejs: NodejsCoords;
    env?: object;
}

export default class PlatformAngular extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformAngularProps, extra: any = {}) {
        const rtImage = 'nodeshift/centos7-s2i-web-app';
        _.set(extra, 'shared.frameworkImage', rtImage);
        _.set(extra, 'shared.frameworkInfo', enumItem('framework.name', 'angular'));
        _.set(extra, 'shared.frameworkService', props.serviceName);
        _.set(extra, 'shared.frameworkRoute', props.routeName);

        const env = props.env || {};
        env['OUTPUT_DIR'] = 'dist';

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
            await this.transform(['angular.json', 'package.json', 'src/index.html', 'src/**/*.ts', 'e2e/**/*.ts', 'gap'], cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                rtImage,
                null,
                env);
            setBuildContextDir(res, props.subFolderName);
            setMemoryResources(res, { 'limit': '512Mi' });
            setPathHealthChecks(res, '/', '/');
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, env, props.serviceName);
            setDeploymentEnv(resources, env, props.serviceName);
            return resources;
        }
    }
}
