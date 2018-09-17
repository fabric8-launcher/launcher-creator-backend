import * as path from 'path';

function log(res, ...args) {
    console.log(...args);
    return res;
}

export function moduleInfo(module) {
    const pkg = path.join(path.dirname(module.filename), 'package.json');
    return require(pkg);
}

export function moduleName(module) {
    return path.basename(moduleInfo(module).name);
}
