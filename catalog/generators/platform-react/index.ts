
import * as _ from 'lodash';
import { newApp, newRoute, setBuildEnv, setDeploymentEnv } from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, NodejsCoords } from 'core/catalog/types';

export interface PlatformReactProps {
    application: string;
    serviceName: string;
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

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform(['package.json', 'gap'], cases(props));
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
