
import { getGeneratorModule } from '../../core/catalog';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return getGeneratorModule('rest-vertx');
    } else {
        throw new Error(`Unsupported runtime type: ${type}`);
    }
}

export function apply(resources, targetDir, props) {
    const rtprops = {
        'application': props.application
    };
    return runtimeByType(props.runtime).apply(resources, targetDir, rtprops);
}

export function info() {
    return require('./info.json');
}
