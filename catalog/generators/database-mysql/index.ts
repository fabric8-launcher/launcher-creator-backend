
import { newDatabaseUsingSecret } from 'core/resources';
import { BaseGenerator } from 'core/catalog';

export default class DatabaseMysql extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        return await newDatabaseUsingSecret(resources, props.application, 'mysql', {
            'MYSQL_ROOT_PASSWORD': 'verysecretrootpassword',
            'MYSQL_DATABASE': { 'secret': props.secretName, 'key': 'database' },
            'MYSQL_USER': { 'secret': props.secretName, 'key': 'user'},
            'MYSQL_PASSWORD': { 'secret': props.secretName, 'key': 'password'}
        });
    }
}
