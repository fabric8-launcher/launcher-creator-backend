
import { newDatabaseUsingSecret } from 'core/resources';

export async function apply(applyGenerator, resources, targetDir, props: any = {}) {
    return await newDatabaseUsingSecret(resources, props.application, 'postgresql', {
        'POSTGRESQL_DATABASE': {'secret': props.secretName, 'key': 'database'},
        'POSTGRESQL_USER': {'secret': props.secretName, 'key': 'user'},
        'POSTGRESQL_PASSWORD': {'secret': props.secretName, 'key': 'password'}
    });
}

export function info() {
    return require('./info.json');
}
