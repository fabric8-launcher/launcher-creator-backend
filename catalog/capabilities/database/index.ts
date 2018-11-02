
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

export async function apply(applyGenerator, resources, targetDir, props) {
    const dbprops = {
        'application': props.application,
        'databaseUri': props.application + '-database',
        'databaseName': 'my_data',
        'secretName': props.application + '-database-bind',
    };
    const rtprops = {
        'application': props.application,
        'groupId': props.groupId,
        'artifactId': props.artifactId,
        'version': props.version,
        'databaseType': props.databaseType,
        'secretName': props.application + '-database-bind',
    };
    await applyGenerator('database-secret', resources, targetDir, dbprops);
    await applyGenerator(databaseByType(props.databaseType), resources, targetDir, dbprops);
    return await applyGenerator(runtimeByType(props.runtime), resources, targetDir, rtprops);
}

export function info() {
    return require('./info.json');
}
