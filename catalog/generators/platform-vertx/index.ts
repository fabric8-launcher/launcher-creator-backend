
import { copy } from 'fs-extra' ;
import { join } from 'path';
import { newApp, newRoute } from '../../../lib/core/resources/index';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    return copy(join(__dirname, 'files'), targetDir)
        .then(() => applyGenerator('maven-setup', resources, targetDir, props))
        .then(() => newApp(
            props.application + '-vertx',
            props.application,
            'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift',
            targetDir,
            {}))
        .then(res => resources.add(res))
        .then(res => newRoute(res, props.application, props.application + '-vertx'));
}

export function info() {
    return require('./info.json');
}
