
import { copy } from 'fs-extra' ;
import { join } from 'path';
import { newApp } from '../../core/resources';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    return copy(join(__dirname, 'files'), targetDir)
        .then(() => newApp(
            props.application + '-vertx',
            props.application,
            'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift~.',
            {},
            targetDir))
        .then(res => resources.add(res));
}

export function info() {
    return require('./info.json');
}
