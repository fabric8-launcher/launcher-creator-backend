'use strict';

const { getGeneratorModule } = require('../../core/catalog');

// Returns the corresponding database generator depending on the given database type
function databaseByType(type) {
    if (type === 'postgresql') {
        return getGeneratorModule('database-postgresql');
    } else if (type === 'mysql') {
        return getGeneratorModule('database-mysql');
    } else {
        throw `Unsupported database type: ${type}`;
    }
}

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return getGeneratorModule('database-crud-vertx');
    } else {
        throw `Unsupported runtime type: ${type}`;
    }
}

exports.apply = function(capName, resources, targetDir, props) {
    const dbprops = {
        appName: capName,
        databaseUri: capName,
        databaseName: 'my_data',
        secretName: capName + '-bind',
    };
    const rtprops = {
        appName: capName,
        databaseType: props.databaseType
    };
    return getGeneratorModule('database-secret').apply(resources, targetDir, dbprops)
        .then(res => databaseByType(props.databaseType).apply(res, targetDir, dbprops))
        .then(res => runtimeByType(props.runtime).apply(res, targetDir, rtprops));
};

exports.info = function() {
    return require('./info.json');
};
