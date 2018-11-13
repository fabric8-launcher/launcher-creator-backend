
import { BaseGenerator } from 'core/catalog';

export default class DatabaseSecret extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        // Check if the service already exists, so we don't create it twice
        if (!resources.secret(props.secretName)) {
            // Create Secret holding Database connection/authentication information
            const secret = {
                'kind': 'Secret',
                'apiVersion': 'v1',
                'metadata': {
                    'name': props.secretName,
                    'labels': {
                        'app': props.application,
                    }
                },
                'stringData': {
                    'uri': props.databaseUri,
                    'database': props.databaseName,
                    'user': 'dbuser',
                    'password': 'secret',  // TODO generate pwd
                }
            };
            resources.add(secret);
            // console.log(`Secret ${props.secretName} added`);
        } else {
            // console.log(`Secret ${props.secretName} already exists`);
        }
        return resources;
    }
}
