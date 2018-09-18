
import { newDatabaseUsingSecret } from '../../core/resources';

export function apply(resources, targetDir, props: any = {}) {
    return newDatabaseUsingSecret(resources, props.application, 'postgresql', props.databaseUri, props.secretName, {}, {
        'POSTGRESQL_DATABASE': 'database',
        'POSTGRESQL_USER': 'user',
        'POSTGRESQL_PASSWORD': 'password'
    });
}

export function info() {
    return require('./info.json');
}
