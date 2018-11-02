
import { copy } from 'fs-extra';
import { join } from 'path';
import { mergePoms } from 'core/maven';
import { transformFiles } from 'core/template';
import { cases } from 'core/template/transformers';
import { setDeploymentEnv } from 'core/resources';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    const pprops = {
        'application': props.application,
        'groupId': props.groupId,
        'artifactId': props.artifactId,
        'version': props.version
    };
    const env = {
        'MY_DATABASE_SERVICE_HOST': {
            'secret': props.secretName,
            'key': 'uri'
        },
        'DB_USERNAME': {
            'secret': props.secretName,
            'key': 'user'
        },
        'DB_PASSWORD': {
            'secret': props.secretName,
            'key': 'password'
        }
    };
    // First copy the files from the base Vert.x platform module
    // and then copy our own over that
    return applyGenerator('platform-vertx', resources, targetDir, pprops)
        .then(() => setDeploymentEnv(resources, env))
        .then(() => copy(join(__dirname, 'files'), targetDir))
        .then(() => mergePoms(join(targetDir, 'pom.xml'), join(__dirname, 'merge', `pom.${props.databaseType}.xml`)))
        .then(() => transformFiles(join(targetDir, 'src/**/*.java'), cases(props)))
        .then(() => resources);
    // TODO Don't just blindly copy all files, we need to _patch_ some of
    // them instead (eg. pom.xml and arquillian.xml and Java code)
}

export function info() {
    return require('./info.json');
}
