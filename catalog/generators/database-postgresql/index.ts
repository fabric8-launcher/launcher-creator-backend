
import { newDatabaseUsingSecret } from 'core/resources';
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabasePostgresqlProps extends BaseGeneratorProps, DatabaseSecretRef {
}

export default class DatabasePostgresql extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply( resources, props: DatabasePostgresqlProps, extra: any = {}) {
        const dbImage = 'postgresql';
        extra.databaseImage = dbImage;
        extra.databaseService = props.serviceName;

        return await newDatabaseUsingSecret(resources, props.serviceName, props.application, dbImage, {
            'POSTGRESQL_DATABASE': { 'secret': props.secretName, 'key': 'database' },
            'POSTGRESQL_USER': { 'secret': props.secretName, 'key': 'user' },
            'POSTGRESQL_PASSWORD': { 'secret': props.secretName, 'key': 'password' }
        });
    }
}
