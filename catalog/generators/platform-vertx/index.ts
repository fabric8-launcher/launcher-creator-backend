
import { newApp, newRoute, setDeploymentEnv } from 'core/resources';
import { cases } from 'core/template/transformers/cases';
import { BaseGenerator } from 'core/catalog';

import MavenSetup from 'generators/maven-setup';

export default class PlatformVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}, extra: any = {}) {
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform('gap', cases(props));
            await this.generator(MavenSetup).apply(resources, props, extra);
            const res = await newApp(
                props.serviceName,
                props.application,
                'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift',
                null,
                props.env || {});
            resources.add(res);
            return await newRoute(resources, props.application + '-route', props.application, props.serviceName);
        } else {
            return setDeploymentEnv(resources, props.env, props.serviceName);
        }
    }
}
