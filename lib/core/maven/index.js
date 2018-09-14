'use strict';

const { spawn } = require('child-process-promise');
const { join } =  require('path');

const jar = join(__dirname, 'maven-model-helper.jar');

function mergePoms(targetPath, sourcePath) {
    const proc = spawn('java', ['-jar', jar, targetPath, sourcePath])
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
    return proc;
}

exports.mergePoms = mergePoms;