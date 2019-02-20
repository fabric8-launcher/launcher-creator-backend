
import { BaseCapability, Runtime } from 'core/catalog/types';

import PlatformNodejs from 'generators/platform-nodejs';
import PlatformSpringBoot from 'generators/platform-springboot';
import PlatformThorntail from 'generators/platform-thorntail';
import PlatformVertx from 'generators/platform-vertx';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(rt: Runtime) {
    if (rt.name === 'nodejs') {
        return PlatformNodejs;
    } else if (rt.name === 'springboot') {
        return PlatformSpringBoot;
    } else if (rt.name === 'thorntail') {
        return PlatformThorntail;
    } else if (rt.name === 'vertx') {
        return PlatformVertx;
    } else {
        throw new Error(`Unsupported runtime type: ${rt.name}`);
    }
}

export default class Health extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        const appName = this.name(props.application, props.subFolderName);
        const rtServiceName = appName;
        const rtRouteName = appName;
        const rtprops = {
            'application': props.application,
            'subFolderName': props.subFolderName,
            'serviceName': rtServiceName,
            'routeName': rtRouteName,
            'runtime': props.runtime,
            'maven': props.maven,
            'nodejs': props.nodejs
        };
        return await this.generator(runtimeByType(props.runtime)).apply(resources, rtprops, extra);
    }
}
