
import { BaseCapability } from 'core/catalog';

import RestVertx from 'generators/rest-vertx';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return RestVertx;
    } else {
        throw new Error(`Unsupported runtime type: ${type}`);
    }
}

export default class Rest extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props) {
        const rtServiceName = props.application + '-service';
        const rtprops = {
            'application': props.application,
            'serviceName': rtServiceName,
            'groupId': props.groupId,
            'artifactId': props.artifactId,
            'version': props.version
        };
        return await this.applyGenerator(runtimeByType(props.runtime), resources, rtprops);
    }
}
