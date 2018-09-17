
import { copy } from 'fs-extra' ;
import { join } from 'path';
import { newApp } from '../../core/resources';

export function apply(resources, targetDir, props?: any = {}) {
    return copy(join(__dirname, 'files'), targetDir)
        .then(() => newApp(
            props.appName + '-vertx',
            props.appName,
            'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift~.',
            {},
            targetDir))
        .then(res => resources.add(res));
}

export function info() {
    return require('./info.json');
}
