
import { BaseCapability } from 'core/catalog/types';

import RestVertx from 'generators/rest-vertx';
import RestNodejs from 'generators/rest-nodejs';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return RestVertx;
    } else if (type === 'nodejs') {
        return RestNodejs;
    } else {
        throw new Error(`Unsupported runtime type: ${type}`);
    }
}

export default class Rest extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        const rtServiceName = props.application + '-service';
        const rtprops = {
            'application': props.application,
            'serviceName': rtServiceName,
            'maven': props.maven,
            'nodejs': props.nodejs
        };
        return await this.generator(runtimeByType(props.runtime)).apply(resources, rtprops, extra);
    }
}
