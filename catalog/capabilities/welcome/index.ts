
import { BaseCapability } from 'core/catalog/types';

import WelcomeApp from 'generators/welcome-app';

export default class Rest extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        return resources;
    }

    public async postApply(resources, props, deployment) {
        const waprops = {
            'application': props.application,
            'subFolderName': props.subFolderName,
            'serviceName': 'welcome',
            'routeName': 'welcome',
            deployment
        };
        return await this.generator(WelcomeApp).apply(resources, waprops);
    }
}
