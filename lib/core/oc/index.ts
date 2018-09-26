
import { spawn } from 'child-process-promise';
import * as streamToString from 'stream-to-string';
import { Readable } from 'stream';

import { resources, Resources } from '../resources';

// Returns a list of resources that when applied will create
// an instance of the given image or template.
export function newApp(name: string, appName: string, imageName: string, sourceUri?: string, env = {}): Promise<Resources> {
    const img = sourceUri ? imageName + '~' + sourceUri : imageName;
    const envStr = Object.entries(env).map(([key, val]) => `-e${key}=${val}`);
    const opts = {};
    const proc = spawn('oc', ['new-app',
        `--name=${name}`,
        `--labels=app=${appName}`,
        ...envStr,
        img,
        '--dry-run',
        '-o', 'json'], opts);
    proc.catch((error) => {
        console.error(`Spawn error: ${error}`);
        return Promise.reject(error);
    });
    return streamToString(proc.childProcess.stdout).then(json => resources(JSON.parse(json)));
}

// Applies the given resources to the active OpenShift instance
export function apply(res) {
    // Run 'oc apply' using the given resources
    const proc = spawn('oc', ['apply', '-f', '-'], {'stdio': ['pipe', 1, 2]})
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            return Promise.reject(error);
        });
    // Create a Stream containing the resource's json as text and pipe it to the oc command
    const ins = new Readable();
    ins.push(JSON.stringify(res.json));
    ins.push(null);
    ins.pipe(proc.childProcess.stdin);
    return proc;
}

// Applies the given resources to the active OpenShift instance
export function applyFromFile(resourcesFile) {
    // Run 'oc apply' using the given resources
    const proc = spawn('oc', ['apply', '-f', resourcesFile])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            return Promise.reject(error);
        });
    return proc;
}
