
import { ensureFile, writeFile, readFile } from 'fs-extra';
import { join } from 'path';

import { newApp } from '../oc';

const dummyName = 'placeholder-app-name-730040e0c873453f877c10cd07912d1f';
const dummyLabel = 'placeholder-app-label-d46881878f594a2dadfd963843452aab';
const dummyNameRe = new RegExp(dummyName, 'g');
const dummyLabelRe = new RegExp(dummyLabel, 'g');

function normalizeImageName(img: string) {
    return img.replace(/\//g, '_');
}

function templateFileName(img: string) {
    return join(__dirname, 'templates', normalizeImageName(img) + '.json');
}

export function generate() {
    const images = require('./images.json');
    images.forEach(({image, isBuilder}) => {
        const srcUri = isBuilder ? 'https://github.com/dummy/dummy' : null;
        return newApp(dummyName, dummyLabel, image, srcUri,{})
            .then((res) => {
                const name = templateFileName(image);
                return ensureFile(name)
                    .then(() => writeFile(name, JSON.stringify(res.json, null, 2)))
                    .then(() => console.log('Created image', image));
            })
            .catch(err => console.error(`Couldn't generate template for image ${image}: ${err}`));
    });
}

export function readTemplate(img: string, appName: string, appLabel: string): Promise<object> {
    const name = templateFileName(img);
    return readFile(name, 'utf8')
        .then(text => text.replace(dummyNameRe, appName).replace(dummyLabelRe, appLabel))
        .then(text => JSON.parse(text));
}
