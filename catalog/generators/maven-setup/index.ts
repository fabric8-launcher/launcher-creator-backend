
import { join } from 'path';
import { updateGav } from 'core/maven';

export async function apply(applyGenerator, resources, targetDir, props: any = {}) {
    return await updateGav(join(targetDir, 'pom.xml'), props.groupId, props.artifactId, props.version);
}

export function info() {
    return require('./info.json');
}
