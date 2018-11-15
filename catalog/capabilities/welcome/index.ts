
import { BaseCapability } from 'core/catalog';

import WelcomeApp from 'generators/welcome-app';

export default class Rest extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        return resources;
    }

    public async postApply(resources, props, deployment) {
        const rtServiceName = props.application + '-service';
        const waprops = {
            'serviceName': rtServiceName,
            deployment
        };
        return await this.generator(WelcomeApp).apply(resources, waprops);
    }
}
