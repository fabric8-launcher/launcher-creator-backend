
import * as _ from 'lodash';
import { newApp, newRoute, setDeploymentEnv } from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BaseGeneratorProps, Runtime } from 'core/catalog/types';

export interface NodejsCoords {
    groupId: string;
    artifactId: string;
    version: string;
}

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

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform('gap', cases(props));
            await this.transform('package.json', cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                rtImage,
                null,
                props.env || {});
            resources.add(res);
            return await newRoute(resources, props.application + '-route', props.application, props.serviceName);
        } else {
            return setDeploymentEnv(resources, props.env, props.serviceName);
        }
    }
}
