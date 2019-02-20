
import { newApp, setHealthProbe, setMemoryResources } from 'core/resources';
import { BaseGenerator, BaseGeneratorExtra, BaseGeneratorProps } from 'core/catalog/types';
import { DatabaseSecretRef } from 'generators/database-secret';
import { IMAGE_POSTGRESQL } from 'core/resources/images';

export interface DatabasePostgresqlProps extends BaseGeneratorProps, DatabaseSecretRef {
}

export interface DatabasePostgresqlExtra extends BaseGeneratorExtra {
}

const livenessProbe = {
    'initialDelaySeconds': 120,
    'exec': {
        'command': [
            '/usr/libexec/check-container',
            '--live'
        ]
    }
};

const readinessProbe = {
    'initialDelaySeconds': 5,
    'exec': {
        'command': [
            '/usr/libexec/check-container'
        ]
    }
};

export default class DatabasePostgresql extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: DatabasePostgresqlProps, extra: any = {}) {
        const exProps: DatabasePostgresqlExtra = {
            'image': IMAGE_POSTGRESQL,
            'service': props.secretName
        };
        extra.databaseInfo = exProps;

        // Check that the database doesn't already exist
        if (!resources.service(props.serviceName)) {
            // Create the database resource definitions
            const res = await newApp(props.serviceName, props.application, IMAGE_POSTGRESQL, null, {
                'POSTGRESQL_DATABASE': { 'secret': props.secretName, 'key': 'database' },
                'POSTGRESQL_USER': { 'secret': props.secretName, 'key': 'user' },
                'POSTGRESQL_PASSWORD': { 'secret': props.secretName, 'key': 'password' }
            });
            setMemoryResources(res, { 'limit': '512Mi' });
            setHealthProbe(res, 'livenessProbe', livenessProbe);
            setHealthProbe(res, 'readinessProbe', readinessProbe);
            resources.add(res);
        }
        return resources;
    }
}
