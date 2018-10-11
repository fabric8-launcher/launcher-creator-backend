
import { join } from 'path';
import * as _ from 'lodash';

import { newApp, newRoute } from 'core/resources';
import { writeResources } from 'core/deploy';

const WELCOME_APP_REPO_URL = 'https://github.com/fabric8-launcher/application-creator-landingpage';

const buildTriggers = [{
    'type': 'ConfigChange'
}, {
    'type': 'ImageChange',
    'imageChange': {}
}];

export function apply(applyGenerator, resources, targetDir, props: any = {}) {
    const fileName = join(targetDir, '.openshiftio', 'service-welcome.yaml');
    const serviceName = props.application + '-welcome';
    const lbls = {
        'app': props.application,
        'apptype': 'welcome'
    };
    return newApp(
        serviceName,
        lbls,
        'bucharestgold/centos7-s2i-web-app',
        WELCOME_APP_REPO_URL,
        {})
        .then(res => {
            const bc = res.buildConfig(serviceName);
            // Set the Git repo URL to use the template parameter
            _.set(bc, 'spec.source.git.uri', WELCOME_APP_REPO_URL);
            // Remove GitHub webhook triggers
            _.set(bc, 'spec.triggers', buildTriggers);
            // Adding Route
            newRoute(res, props.application + '-welcome-route', lbls, serviceName)
            writeResources(fileName, res);
        });
}

export function info() {
    return require('./info.json');
}
