
import { join } from 'path';
import { pathExistsSync } from 'fs-extra';
import * as _ from 'lodash';

import { readResources, writeResources } from 'core/deploy';
import { BaseGenerator, BaseGeneratorProps, DeploymentDescriptor } from 'core/catalog/types';
import { Resources } from 'core/resources';
import { cases } from 'core/template/transformers/cases';

import PlatformBaseSupport from 'generators/platform-base-support';

const WELCOME_APP_REPO_URL = 'https://github.com/fabric8-launcher/launcher-creator-welcome-app';

const buildTriggers = [{
    'type': 'ConfigChange'
}, {
    'type': 'ImageChange',
    'imageChange': {}
}];

export interface WelcomeAppProps extends BaseGeneratorProps {
    deployment: DeploymentDescriptor;
}

export default class WelcomeApp extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources: Resources, props: WelcomeAppProps, extra: any = {}): Promise<Resources> {
        _.set(extra, 'shared.welcomeService', props.serviceName);
        _.set(extra, 'shared.welcomeRoute', props.routeName);

        // We're not really a platform, but the setup it does for tiered applications is useful to us
        await this.generator(PlatformBaseSupport).apply(resources, props, extra);

        // This is here in case we get applied in a tier of our own
        // (meaning there's no runtime/framework so there's no gap or README)
        if (!await this.filesCopied()) {
            await this.copy();
            await this.transform('gap', cases(props));
        }

        // Check if the Welcome App service already exists, so we don't create it twice
        const fileName = join(this.targetDir, '.openshiftio', 'service.welcome.yaml');
        let res;
        if (!pathExistsSync(fileName)) {
            const template = join(this.sourceDir, 'templates', 'welcome-app.yaml');
            res = await readResources(template);
            res.parameter('APP_NAME')['value'] = props.application;
        } else {
            res = await readResources(fileName);
        }

        res.parameter('FRONTEND_SERVICE_NAME')['value'] = !props.tier ? props.application : this.name(props.application, 'frontend');
        res.parameter('BACKEND_SERVICE_NAME')['value'] = !props.tier ? props.application : this.name(props.application, 'backend');
        res.parameter('WELCOME_IMAGE_NAME')['value'] = process.env['WELCOME_IMAGE_NAME'] || 'fabric8/launcher-creator-welcome-app';
        res.parameter('WELCOME_IMAGE_TAG')['value'] = process.env['WELCOME_IMAGE_TAG'] || 'latest';
        res.parameter('WELCOME_APP_CONFIG')['value'] = JSON.stringify(props.deployment.applications[0]);

        await writeResources(fileName, res);
        return resources;
    }
}
