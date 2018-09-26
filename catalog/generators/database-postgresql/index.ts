
import { newDatabaseUsingSecret } from '../../../lib/core/resources/index';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    return newDatabaseUsingSecret(resources, props.application, 'postgresql', {
        'POSTGRESQL_DATABASE': {'secret': props.secretName, 'key': 'database'},
        'POSTGRESQL_USER': {'secret': props.secretName, 'key': 'user'},
        'POSTGRESQL_PASSWORD': {'secret': props.secretName, 'key': 'password'}
    });
}

export function info() {
    return require('./info.json');
}
