
import { copy } from 'fs-extra' ;
import { join } from 'path';
import { newApp, newRoute } from 'core/resources';
import { transformFiles } from 'core/template';
import { cases } from 'core/template/transformers';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    const serviceName = props.application + '-vertx';
    const tprops = {
        ...props,
        'serviceName': serviceName
    };
    return copy(join(__dirname, 'files'), targetDir)
        .then(() => transformFiles(join(targetDir, 'gap'), cases(tprops)))
        .then(() => applyGenerator('maven-setup', resources, targetDir, props))
        .then(() => newApp(
            serviceName,
            props.application,
            'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift',
            null,
            {}))
        .then(res => resources.add(res))
        .then(res => newRoute(res, props.application + '-route', props.application, serviceName));
}

export function info() {
    return require('./info.json');
}
