
import { BaseCapability, Runtime } from 'core/catalog/types';

import DatabaseSecret from 'generators/database-secret';
import DatabasePostgresql from 'generators/database-postgresql';
import DatabaseMysql from 'generators/database-mysql';
import DatabaseCrudVertx from 'generators/database-crud-vertx';
import DatabaseCrudSpringBoot from 'generators/database-crud-springboot';
import DatabaseCrudNodejs from 'generators/database-crud-nodejs';
import DatabaseCrudThorntail from 'generators/database-crud-thorntail';
import DatabaseCrudWildfly from 'generators/database-crud-wildfly';
import DatabaseCrudQuarkus from 'generators/database-crud-quarkus';
import PlatformNodejs from 'generators/platform-nodejs';
import PlatformQuarkus from 'generators/platform-quarkus';
import PlatformSpringBoot from 'generators/platform-springboot';
import PlatformThorntail from 'generators/platform-thorntail';
import PlatformVertx from 'generators/platform-vertx';
import PlatformWildfly from 'generators/platform-wildfly';

// Returns the corresponding database generator depending on the given database type
function databaseByType(type) {
    switch (type) {
        case 'postgresql': return DatabasePostgresql;
        case 'mysql': return DatabaseMysql;
        default:
            throw new Error(`Unsupported database type: ${type}`);
    }
}

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(rt: Runtime) {
    switch (rt.name) {
        case 'nodejs': return DatabaseCrudNodejs;
        // case 'quarkus': return DatabaseCrudQuarkus;
        case 'springboot': return DatabaseCrudSpringBoot;
        case 'thorntail' :  return DatabaseCrudThorntail;
        case 'vertx': return DatabaseCrudVertx;
        case 'wildfly' : return DatabaseCrudWildfly;
        default:
            throw new Error(`Unsupported runtime type: ${rt.name}`);
    }
}

export default class Database extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        const appName = this.name(props.application, props.subFolderName);
        const dbServiceName = this.name(appName, 'database');
        const dbprops = {
            'application': props.application,
            'subFolderName': props.subFolderName,
            'serviceName': dbServiceName,
            'databaseUri': this.name(props.application, props.subFolderName, 'database'),
            'databaseName': 'my_data',
            'secretName': this.name(props.application, props.subFolderName, 'database-bind'),
        };
        const rtServiceName = appName;
        const rtRouteName = appName;
        const rtprops = {
            'application': props.application,
            'subFolderName': props.subFolderName,
            'serviceName': rtServiceName,
            'routeName': rtRouteName,
            'runtime': props.runtime,
            'maven': props.maven,
            'nodejs': props.nodejs,
            'databaseType': props.databaseType,
            'secretName': this.name(props.application, props.subFolderName, 'database-bind'),
        };
        await this.generator(DatabaseSecret).apply(resources, dbprops, extra);
        await this.generator(databaseByType(props.databaseType)).apply(resources, dbprops, extra);
        return await this.generator(runtimeByType(props.runtime)).apply(resources, rtprops, extra);
    }
}
