
import { copy } from 'fs-extra' ;
import { join } from 'path';
import { newApp, newRoute } from 'core/resources';
import { transformFiles } from 'core/template';
import { cases } from 'core/template/transformers';

export async function apply(applyGenerator, resources, targetDir, props: any = {}) {
    const serviceName = props.application + '-vertx';
    const tprops = {
        ...props,
        'serviceName': serviceName
    };
    await copy(join(__dirname, 'files'), targetDir);
    await transformFiles(join(targetDir, 'gap'), cases(tprops));
    await applyGenerator('welcome-app', resources, targetDir, props);
    await applyGenerator('maven-setup', resources, targetDir, props);
    const res = await newApp(
            serviceName,
            props.application,
            'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift',
            null,
            props.env || {});
    resources.add(res);
    return await newRoute(resources, props.application + '-route', props.application, serviceName);
}

export function info() {
    return require('./info.json');
}
