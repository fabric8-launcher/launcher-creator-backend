
import { newApp, setComputeResources } from 'core/resources';
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabaseMysqlProps extends BaseGeneratorProps, DatabaseSecretRef {
}

export default class DatabaseMysql extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: DatabaseMysqlProps, extra: any = {}) {
        const dbImage = 'mysql';
        extra.databaseImage = dbImage;
        extra.databaseService = props.serviceName;

        // Check that the database doesn't already exist
        if (!resources.service(props.serviceName)) {
            // Create the database resource definitions
            const res = await newApp(props.serviceName, props.application, dbImage, null, {
                'MYSQL_ROOT_PASSWORD': 'verysecretrootpassword',
                'MYSQL_DATABASE': { 'secret': props.secretName, 'key': 'database' },
                'MYSQL_USER': { 'secret': props.secretName, 'key': 'user' },
                'MYSQL_PASSWORD': { 'secret': props.secretName, 'key': 'password' }
            });
            setComputeResources(res, null, { 'limit': '512Mi' });
            resources.add(res);
        }
        return resources;
    }
}
