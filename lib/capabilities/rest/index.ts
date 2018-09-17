
import { getGeneratorModule } from '../../core/catalog';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return getGeneratorModule('rest-vertx');
    } else {
        throw new Error(`Unsupported runtime type: ${type}`);
    }
}

export function apply(capName, resources, targetDir, props) {
    const rtprops = {
        'appName': capName
    };
    return runtimeByType(props.runtime).apply(resources, targetDir, rtprops);
}

export function info() {
    return require('./info.json');
}
