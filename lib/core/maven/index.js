'use strict';

const { execSync } = require('child_process');
const EXECUTABLE = 'java -jar '+__dirname+'/maven-model-helper.jar';

function mergePoms(targetPath, sourcePath) {
    execSync(EXECUTABLE + ' ' + targetPath + ' ' + sourcePath);
}

exports.mergePoms = mergePoms;