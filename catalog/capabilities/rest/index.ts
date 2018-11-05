
import * as RestVertx from 'generators/rest-vertx';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return RestVertx;
    } else {
        throw new Error(`Unsupported runtime type: ${type}`);
    }
}

export const id = 'rest';

export async function apply(applyGenerator, resources, targetDir, props) {
    const rtprops = {
        'application': props.application,
        'groupId': props.groupId,
        'artifactId': props.artifactId,
        'version': props.version
    };
    return await applyGenerator(runtimeByType(props.runtime), resources, targetDir, rtprops);
}

export function info() {
    return require('./info.json');
}
