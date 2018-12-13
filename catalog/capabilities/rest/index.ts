
import { BaseCapability, Runtime } from 'core/catalog/types';

import RestVertx from 'generators/rest-vertx';
import RestSpring from 'generators/rest-springboot';
import RestNodejs from 'generators/rest-nodejs';
import RestThorntail from 'generators/rest-thorntail';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(rt: Runtime) {
    if (rt.name === 'vertx') {
        return RestVertx;
    } else if (rt.name === 'nodejs') {
        return RestNodejs;
    } else if (rt.name === 'springboot') {
        return RestSpring;
    } else if (rt.name === 'thorntail') {
        return RestThorntail;
    } else {
        throw new Error(`Unsupported runtime type: ${rt.name}`);
    }
}

export default class Rest extends BaseCapability {
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
