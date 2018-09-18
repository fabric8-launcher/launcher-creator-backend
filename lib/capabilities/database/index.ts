
// Returns the corresponding database generator depending on the given database type
function databaseByType(type) {
    if (type === 'postgresql') {
        return 'database-postgresql';
    } else if (type === 'mysql') {
        return 'database-mysql';
    } else {
        throw new Error(`Unsupported database type: ${type}`);
    }
}

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return 'database-crud-vertx';
    } else {
        throw new Error(`Unsupported runtime type: ${type}`);
    }
}

export function apply(applyGenerator, resources, targetDir, props) {
    const dbprops = {
        'application': props.application,
        'databaseUri': props.name,
        'databaseName': 'my_data',
        'secretName': props.name + '-bind',
    };
    const rtprops = {
        'application': props.application,
        'databaseType': props.databaseType
    };
    return applyGenerator('database-secret', resources, targetDir, dbprops)
        .then(res => applyGenerator(databaseByType(props.databaseType), res, targetDir, dbprops))
        .then(res => applyGenerator(runtimeByType(props.runtime), res, targetDir, rtprops));
}

export function info() {
    return require('./info.json');
}
