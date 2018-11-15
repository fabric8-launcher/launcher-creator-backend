
import { join } from 'path';
import { pathExistsSync } from 'fs-extra';

import { readResources, writeResources } from 'core/deploy';
import { BaseGenerator } from 'core/catalog';
import { Resources } from 'core/resources';

const WELCOME_APP_REPO_URL = 'https://github.com/fabric8-launcher/launcher-creator-welcome-app';

const buildTriggers = [{
    'type': 'ConfigChange'
}, {
    'type': 'ImageChange',
    'imageChange': {}
}];

export default class WelcomeApp extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: any = {}, extra: any = {}): Promise<Resources> {
        // Check if the Welcome App service already exists, so we don't create it twice
        const fileName = join(this.targetDir, '.openshiftio', 'service.welcome.yaml');
        if (!pathExistsSync(fileName)) {
            const template = join(this.sourceDir, 'templates', 'welcome-app.yaml');
            const res = await readResources(template);
            res.parameter('APP_NAME')['value'] = props.deployment.applications[0].application;
            res.parameter('WELCOME_APP_CONFIG')['value'] = JSON.stringify(props.deployment.applications[0]);
            res.parameter('BACKEND_SERVICE_NAME')['value'] = props.serviceName;
            await writeResources(fileName, res);
        }
        return resources;
    }
}
