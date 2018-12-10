
import { newApp, setHealthProbe, setMemoryResources } from 'core/resources';
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabaseMysqlProps extends BaseGeneratorProps, DatabaseSecretRef {
}

const livenessProbe = {
    'initialDelaySeconds': 30,
    'tcpSocket': {
        'port': 3306
    }
};

const readinessProbe = {
    'initialDelaySeconds': 5,
    'exec': {
        'command': [
            '/bin/sh',
            '-i',
            '-c',
            'MYSQL_PWD="$MYSQL_PASSWORD" mysql -h 127.0.0.1 -u $MYSQL_USER -D $MYSQL_DATABASE -e \'SELECT 1\''
        ]
    }
};

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
            setMemoryResources(res, { 'limit': '512Mi' });
            setHealthProbe(res, 'livenessProbe', livenessProbe);
            setHealthProbe(res, 'readinessProbe', readinessProbe);
            resources.add(res);
        }
        return resources;
    }
}
