
import { join } from 'path';
import * as _ from 'lodash';

import { newApp, newRoute } from 'core/resources';
import { writeResources } from 'core/deploy';
import { BaseGenerator } from 'core/catalog';

const WELCOME_APP_REPO_URL = 'https://github.com/fabric8-launcher/launcher-creator-welcome-app';

const buildTriggers = [{
    'type': 'ConfigChange'
}, {
    'type': 'ImageChange',
    'imageChange': {}
}];

export default class WelcomeApp extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        const fileName = join(this.targetDir, '.openshiftio', 'service.welcome.yaml');
        const serviceName = props.application + '-welcome';
        const lbls = {
            'app': props.application,
            'apptype': 'welcome'
        };
        const res = await newApp(
            serviceName,
            lbls,
            'bucharestgold/centos7-s2i-web-app',
            WELCOME_APP_REPO_URL,
            {});
        const bc = res.buildConfig(serviceName);
        // Set the Git repo URL to use the template parameter
        _.set(bc, 'spec.source.git.uri', WELCOME_APP_REPO_URL);
        // Remove GitHub webhook triggers
        _.set(bc, 'spec.triggers', buildTriggers);
        // Remove parameters
        res.json.parameters = [];
        // Adding Route
        await newRoute(res, props.application + '-welcome-route', lbls, serviceName);
        return await writeResources(fileName, res);
    }
}
