
import * as DatabaseSecret from 'generators/database-secret';
import * as DatabasePostgresql from 'generators/database-postgresql';
import * as DatabaseMysql from 'generators/database-mysql';
import * as DatabaseCrudVertx from 'generators/database-crud-vertx';

// Returns the corresponding database generator depending on the given database type
function databaseByType(type) {
    if (type === 'postgresql') {
        return DatabasePostgresql;
    } else if (type === 'mysql') {
        return DatabaseMysql;
    } else {
        throw new Error(`Unsupported database type: ${type}`);
    }
}

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    if (type === 'vertx') {
        return DatabaseCrudVertx;
    } else {
        throw new Error(`Unsupported runtime type: ${type}`);
    }
}

export const id = 'database';

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
    await applyGenerator(DatabaseSecret, resources, targetDir, dbprops);
    await applyGenerator(databaseByType(props.databaseType), resources, targetDir, dbprops);
    return await applyGenerator(runtimeByType(props.runtime), resources, targetDir, rtprops);
}

export function info() {
    return require('./info.json');
}
