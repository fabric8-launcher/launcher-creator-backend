'use strict';

const getGeneratorModule = require("launcher-creator-catalog").getGeneratorModule;

// Returns the corresponding database generator depending on the given database type
function databaseByType(type) {
    if (type === "postgresql") {
        return getGeneratorModule("database-postgresql");
    } else if (type === "mysql") {
        return getGeneratorModule("database-mysql");
    } else {
        throw `Unsupported database type: ${type}`;
    }
}

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === "vertx") {
        return getGeneratorModule("database-crud-vertx");
    } else {
        throw `Unsupported runtime type: ${type}`;
    }
}

exports.apply = function(capName, targetDir, props) {
    const dbprops = {
        databaseUri: capName,
        databaseName: "my_data",
        secretName: capName + "-bind",
    };
    const rtprops = {};
    return getGeneratorModule("database-secret").apply(targetDir, dbprops)
        .then(() => databaseByType(props.databaseType).apply(targetDir, dbprops))
        .then(() => runtimeByType(props.runtime).apply(targetDir, rtprops));
};

exports.generate = function(capName, resources, targetDir, props) {
    const dbprops = {
        databaseUri: capName,
        databaseName: "my_data",
        secretName: capName + "-bind",
    };
    const rtprops = {};
    return getGeneratorModule("database-secret").generate(resources, targetDir, dbprops)
        .then((res) => databaseByType(props.databaseType).generate(res, targetDir, dbprops))
        .then((res) => runtimeByType(props.runtime).generate(res, targetDir, rtprops));
};

exports.info = function() {
    return require("./info.json");
};
