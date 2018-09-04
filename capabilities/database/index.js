'use strict';

// Returns the corresponding database generator depending on the given database type
function databaseByType(type) {
    if (type === "postgresql") {
        return require("@generators/database-postgresql");
    } else if (type === "mysql") {
        return require("@generators/database-mysql");
    } else {
        throw `Unknown database type: ${type}`;
    }
}

exports.apply = function(targetDir, capName, props) {
    const dbprops = {
        databaseUri: capName,
        databaseName: "my_data",
        secretName: capName + "-bind",
    };
    return require("@generators/database-secret").apply(targetDir, dbprops)
        .then(() => databaseByType(props.databaseType).apply(targetDir, dbprops));
};

exports.generate = function(resources, targetDir, capName, props) {
    const dbprops = {
        databaseUri: capName,
        databaseName: "my_data",
        secretName: capName + "-bind",
    };
    return require("@generators/database-secret").generate(resources, targetDir, dbprops)
        .then((res) => databaseByType(props.databaseType).generate(res, targetDir, dbprops));
};

exports.info = function() {
    return require("./info.json");
};
