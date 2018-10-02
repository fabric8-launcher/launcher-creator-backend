
import { copy } from 'fs-extra';
import { join } from 'path';
import { mergePoms } from '../../../lib/core/maven/index';
import { transformFiles } from '../../../lib/core/template/index';
import { cases } from '../../../lib/core/template/transformers';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    // First copy the files from the base Vert.x platform module
    // and then copy our own over that
    const pprops = {
        'application': props.application,
        'groupId': props.groupId,
        'artifactId': props.artifactId,
        'version': props.version,
    };
    const tprops = {
        ...props,
        'serviceName': props.application + '-vertx'
    };
    return applyGenerator('platform-vertx', resources, targetDir, pprops)
        .then(() => copy(join(__dirname, 'files'), targetDir))
        .then(() => mergePoms(join(targetDir, 'pom.xml'), join(__dirname, 'merge', `pom.${props.databaseType}.xml`)))
        .then(() => transformFiles([join(targetDir, 'src/**/*.java'), join(targetDir, 'gap')], cases(tprops)))
        .then(() => resources);
    // TODO Don't just blindly copy all files, we need to _patch_ some of
    // them instead (eg. pom.xml and arquillian.xml and Java code)
}

export function info() {
    return require('./info.json');
}
