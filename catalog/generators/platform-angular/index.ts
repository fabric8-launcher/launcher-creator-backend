
import * as _ from 'lodash';
import { newApp, newRoute, setBuildEnv, setDeploymentEnv } from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, NodejsCoords } from 'core/catalog/types';

export interface PlatformAngularProps {
    application: string;
    serviceName: string;
    nodejs: NodejsCoords;
    env?: object;
}

export default class PlatformAngular extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformAngularProps, extra: any = {}) {
        const rtImage = 'nodeshift/centos7-s2i-web-app';
        _.set(extra, 'shared.frameworkImage', rtImage);
        _.set(extra, 'shared.frameworkInfo', enumItem('framework.name', 'react'));
        _.set(extra, 'shared.frameworkService', props.serviceName);

        const env = props.env || {};
        env['OUTPUT_DIR'] = 'dist';

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform(['angular.json', 'package.json', 'src/index.html', 'src/**/*.ts', 'e2e/**/*.ts', 'gap'], cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                rtImage,
                null,
                env);
            resources.add(res);
            return await newRoute(resources, props.application + '-route', props.application, props.serviceName);
        } else {
            setBuildEnv(resources, env, props.serviceName);
            setDeploymentEnv(resources, env, props.serviceName);
            return resources;
        }
    }
}
