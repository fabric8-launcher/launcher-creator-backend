'use strict';

const { getGeneratorModule } = require('../../core/catalog');

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return getGeneratorModule('rest-vertx');
    } else {
        throw `Unsupported runtime type: ${type}`;
    }
}

exports.apply = function(capName, resources, targetDir, props) {
    const rtprops = {
        appName: capName
    };
    return runtimeByType(props.runtime).apply(resources, targetDir, rtprops);
};

exports.info = function() {
    return require('./info.json');
};
