
import { ensureFile, writeFile, readFile } from 'fs-extra';
import { join } from 'path';
import * as _ from 'lodash';

import { newApp } from 'core/oc';
import { resources, Resources } from 'core/resources';
import { filterObject } from 'core/utils';
import { images } from 'core/resources/images';

const dummyName = 'placeholder-app-name-730040e0c873453f877c10cd07912d1f';
const dummyLabel = 'placeholder-app-label-d46881878f594a2dadfd963843452aab';
const dummyNameRe = new RegExp(dummyName, 'g');
const dummyLabelRe = new RegExp(dummyLabel, 'g');
const dummyGitUrl = 'https://github.com/dummy_org/dummy_repo';

const sourceRepoUrlParam = {
    'name': 'SOURCE_REPOSITORY_URL',
    'description': 'The source URL for the application',
    'displayName': 'Source URL',
    'value': dummyGitUrl,
    'required': true
};

const githubWebhookSecretParam = {
    'name': 'GITHUB_WEBHOOK_SECRET',
    'description': 'The secret used to configure a GitHub webhook',
    'displayName': 'GitHub Webhook Secret',
    'required': true,
    'from': '[a-zA-Z0-9]{40}',
    'generate': 'expression'
};

const buildTriggers = [{
    'type': 'GitHub',
    'github': {
        'secret': '${GITHUB_WEBHOOK_SECRET}'
    }
}, {
    'type': 'ConfigChange'
}, {
    'type': 'ImageChange',
    'imageChange': {}
}];

function normalizeImageName(img: string) {
    return img.replace(/\//g, '_');
}

function templateFileName(img: string) {
    return join(__dirname, 'templates', normalizeImageName(img) + '.json');
}

export function generate() {
    images.forEach(async ({id, metadata}) => {
        const image = id;
        const isBuilder = (metadata && metadata['isBuilder']) || false;
        try {
            const srcUri = isBuilder ? dummyGitUrl : null;
            const res = await newApp(dummyName, dummyLabel, image, srcUri, {});
            res.toTemplate();
            // Remove all openshift.io annotations
            res.items.forEach(i => {
                filterAnnotations(i.metadata);
                if (!!i.spec && !!i.spec.template) {
                    filterAnnotations(i.spec.template.metadata);
                }
                if (!!i.spec && !!i.spec.tags && Array.isArray(i.spec.tags)) {
                    i.spec.tags.forEach(t => filterAnnotations(t));
                }
            });
            if (isBuilder) {
                // Turn the resources into a template and add parameters
                res
                    .addParam(sourceRepoUrlParam)
                    .addParam(githubWebhookSecretParam);
                // Make sure incremental builds are enabled
                const bc = res.buildConfig(dummyName);
                _.set(bc, 'spec.strategy.sourceStrategy.incremental', true);
                // Set the Git repo URL to use the template parameter
                _.set(bc, 'spec.source.git.uri', '${SOURCE_REPOSITORY_URL}');
                // Set the GitHub webhook trigger to use the template parameter
                _.set(bc, 'spec.triggers', buildTriggers);
            }
            // Write the resources to a file
            const name = templateFileName(image);
            await ensureFile(name);
            await writeFile(name, JSON.stringify(res.json, null, 2));
            console.log('Created image', image);
        } catch (ex) {
            console.error(`Couldn't generate template for image ${image}: ${ex}`);
        }
    });
}

function filterAnnotations(container) {
    if (!!container && !!container.annotations) {
        const filteredAnnotations = filterObject(container.annotations, (key, value) => !key.startsWith('openshift.io/'));
        if (Object.entries(filteredAnnotations).length === 0) {
            delete container.annotations;
        } else {
            container.annotations = filteredAnnotations;
        }
    }
}

export async function readTemplate(img: string, appName: string, appLabel?: string, gitUrl?: string): Promise<Resources> {
    const name = templateFileName(img);
    const text = await readFile(name, 'utf8');
    const newText = text
        .replace(dummyNameRe, appName)
        .replace(dummyLabelRe, appLabel || dummyLabel)
        .replace(dummyGitUrl, gitUrl || dummyGitUrl);
    return resources(JSON.parse(newText));
}
