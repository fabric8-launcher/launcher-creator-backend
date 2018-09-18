
import { join } from 'path';
import { updateGav } from '../../core/maven';

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    return updateGav(join(targetDir, 'pom.xml'), props.groupId, props.artifactId, props.version);
}

export function info() {
    return require('./info.json');
}
