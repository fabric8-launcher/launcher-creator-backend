
import { newApp, newRoute, setDeploymentEnv } from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { BaseGenerator } from 'core/catalog';

import WelcomeApp from 'generators/welcome-app';

export default class PlatformVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}, extra: any = {}) {
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform('package.json', cases(props));
            await this.transform('gap', cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                'nodeshift/centos7-s2i-nodejs',
                null,
                props.env || {});
            resources.add(res);
            return await newRoute(resources, props.application + '-route', props.application, props.serviceName);
        } else {
            return setDeploymentEnv(resources, props.env, props.serviceName);
        }
    }
}
