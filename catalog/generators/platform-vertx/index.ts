
import { copy } from 'fs-extra' ;
import { join } from 'path';
import { newApp, newRoute } from 'core/resources';
import { transformFiles } from 'core/template';
import { cases } from 'core/template/transformers';

import * as WelcomeApp from 'generators/welcome-app';
import * as MavenSetup from 'generators/maven-setup';

export const id = 'platform-vertx';

export async function apply(applyGenerator, resources, targetDir, props: any = {}) {
    const serviceName = props.application + '-vertx';
    const tprops = {
        ...props,
        'serviceName': serviceName
    };
    await copy(join(__dirname, 'files'), targetDir);
    await transformFiles(join(targetDir, 'gap'), cases(tprops));
    await applyGenerator(WelcomeApp, resources, targetDir, props);
    await applyGenerator(MavenSetup, resources, targetDir, props);
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
