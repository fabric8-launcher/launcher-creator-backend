
import { newDatabaseUsingSecret } from '../../core/resources';

export function apply(resources, targetDir, props: any = {}) {
    return newDatabaseUsingSecret(resources, props.application, 'mysql', props.databaseUri, props.secretName, {
        'MYSQL_ROOT_PASSWORD': 'verysecretrootpassword'
    }, {
        'MYSQL_DATABASE': 'database',
        'MYSQL_USER': 'user',
        'MYSQL_PASSWORD': 'password'
    });
}

export function info() {
    return require('./info.json');
}
