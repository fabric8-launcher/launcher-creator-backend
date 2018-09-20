
import { newDatabaseUsingSecret } from '../../../lib/core/resources/index';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    return newDatabaseUsingSecret(resources, props.application, 'postgresql', props.databaseUri, props.secretName, {}, {
        'POSTGRESQL_DATABASE': 'database',
        'POSTGRESQL_USER': 'user',
        'POSTGRESQL_PASSWORD': 'password'
    });
}

export function info() {
    return require('./info.json');
}
