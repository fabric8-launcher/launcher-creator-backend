
import { BaseCapability } from 'core/catalog';

import DatabaseSecret from 'generators/database-secret';
import DatabasePostgresql from 'generators/database-postgresql';
import DatabaseMysql from 'generators/database-mysql';
import DatabaseCrudVertx from 'generators/database-crud-vertx';

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

export default class Database extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props) {
        const dbServiceName = props.application + '-database';
        const dbprops = {
            'application': props.application,
            'serviceName': dbServiceName,
            'databaseUri': props.application + '-database',
            'databaseName': 'my_data',
            'secretName': props.application + '-database-bind',
        };
        const rtServiceName = props.application + '-service';
        const rtprops = {
            'application': props.application,
            'serviceName': rtServiceName,
            'groupId': props.groupId,
            'artifactId': props.artifactId,
            'version': props.version,
            'databaseType': props.databaseType,
            'secretName': props.application + '-database-bind',
        };
        await this.applyGenerator(DatabaseSecret, resources, dbprops);
        await this.applyGenerator(databaseByType(props.databaseType), resources, dbprops);
        return await this.applyGenerator(runtimeByType(props.runtime), resources, rtprops);
    }
}
