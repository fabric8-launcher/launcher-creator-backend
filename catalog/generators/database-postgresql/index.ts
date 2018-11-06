
import { newDatabaseUsingSecret } from 'core/resources';
import { BaseGenerator } from 'core/catalog';

export default class DatabasePostgresql extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply( resources, props: any = {}) {
        return await newDatabaseUsingSecret(resources, props.application, 'postgresql', {
            'POSTGRESQL_DATABASE': { 'secret': props.secretName, 'key': 'database' },
            'POSTGRESQL_USER': { 'secret': props.secretName, 'key': 'user' },
            'POSTGRESQL_PASSWORD': { 'secret': props.secretName, 'key': 'password' }
        });
    }
}
