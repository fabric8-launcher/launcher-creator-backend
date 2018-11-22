
import { newDatabaseUsingSecret } from 'core/resources';
import { BaseGenerator } from 'core/catalog/types';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabaseMysqlProps extends DatabaseSecretRef {
    application: string;
    serviceName: string;
}

export default class DatabaseMysql extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: DatabaseMysqlProps, extra: any = {}) {
        const dbImage = 'mysql';
        extra.databaseImage = dbImage;
        extra.databaseService = props.serviceName;

        return await newDatabaseUsingSecret(resources, props.serviceName, props.application, dbImage, {
            'MYSQL_ROOT_PASSWORD': 'verysecretrootpassword',
            'MYSQL_DATABASE': { 'secret': props.secretName, 'key': 'database' },
            'MYSQL_USER': { 'secret': props.secretName, 'key': 'user'},
            'MYSQL_PASSWORD': { 'secret': props.secretName, 'key': 'password'}
        });
    }
}
