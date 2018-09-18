// @ts-ignore
import { spawn } from 'child-process-promise';
import { join } from 'path';

const jar = join(__dirname, 'maven-model-helper.jar');

export function mergePoms(targetPath, sourcePath) {
    const proc = spawn('java', ['-DsourceDominant=true','-jar', jar, targetPath, sourcePath])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
    return proc;
}
