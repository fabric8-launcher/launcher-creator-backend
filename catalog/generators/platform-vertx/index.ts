
import { newApp, newRoute } from 'core/resources';
import { cases } from 'core/template/transformers';
import { BaseGenerator } from 'core/catalog';

import WelcomeApp from 'generators/welcome-app';
import MavenSetup from 'generators/maven-setup';

export default class PlatformVertx extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        const serviceName = props.application + '-vertx';
        const tprops = {
            ...props,
            'serviceName': serviceName
        };
        await this.copy();
        await this.transform('gap', cases(tprops));
        await this.applyGenerator(WelcomeApp, resources, props);
        await this.applyGenerator(MavenSetup, resources, props);
        const res = await newApp(
            serviceName,
            props.application,
            'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift',
            null,
            props.env || {});
        resources.add(res);
        return await newRoute(resources, props.application + '-route', props.application, serviceName);
    }
}
