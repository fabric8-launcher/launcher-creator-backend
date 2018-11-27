// @ts-ignore
import { spawn } from 'child-process-promise';
import { join } from 'path';

const jar = join(__dirname, 'maven-model-helper.jar');

export function mergePoms(targetPath, sourcePath) {
    return spawn('java', ['-jar', jar, 'merge', targetPath, sourcePath])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
}

export function updateGav(targetPath, groupId, artifactId, version) {
    return spawn('java', ['-jar', jar, 'update-gav', targetPath, groupId, artifactId, version])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
}

export function updateParentGav(targetPath, groupId, artifactId) {
    return spawn('java', ['-jar', jar, 'update-parent-gav', targetPath, groupId, artifactId])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
}
