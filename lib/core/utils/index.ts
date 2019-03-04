
import * as path from 'path';
import * as Archiver from 'archiver';
import { readdir, statSync, Stats } from 'fs-extra';

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

export function zipFolder(out, dir, archiveFolderName) {
    const archive = Archiver('zip');
    // Send the file to the output.
    archive.pipe(out);
    // append files from tempDir, making the appName as root
    archive.directory(dir, archiveFolderName);
    archive.finalize();
    return Promise.resolve(archive);
}

// Function composition in regular way from right to left (in reverse order of the arguments)
export const compose = (...funcs) => value =>
    funcs.reduceRight((acc, func) => func(acc), value);

// Function composition like `compose()` with short-circuit if the value becomes null/undefined
export const compose2 = (...funcs) => value =>
    funcs.reduceRight((acc, func) => (acc !== null && acc !== undefined) ? func(acc) : acc, value);

// Function composition in reverse way from left to right (in order of the arguments)
export const pipe = (...funcs) => value =>
    funcs.reduce((acc, func) => func(acc), value);

// Function composition like 'pipe()' with short-circuit if the value becomes null/undefined
export const pipe2 = (...funcs) => value =>
    funcs.reduce((acc, func) => (acc !== null && acc !== undefined) ? func(acc) : acc, value);

// Returns an object with only those key/value pairs that matched the filter
export function filterObject(obj: object, filter: (key: string, value: any) => boolean): any {
    const res = {};
    if (!!obj) {
        Object.entries(obj).forEach(([key, value]) => {
            if (filter(key, value)) {
                res[key] = value;
            }
        });
    }
    return res;
}

// Directory walking

interface FileInfo {
    name: string;
    path: string;
    fullPath: string;
    stat: Stats;
}

async function _walk(start: string, dir: string, callback: (info: FileInfo) => any): Promise<boolean> {
    const full = !dir ? start : path.join(start, dir);
    const files = await readdir(full);
    const infos: FileInfo[] = files
        .map(f => ({
            'name': f,
            'path': !dir ? f : path.join(dir, f),
            'fullPath': path.join(full, f),
            'stat': statSync(path.join(full, f))
        } as FileInfo));
    for (const i of infos) {
        let res;
        if (i.stat.isDirectory()) {
            res = await _walk(start, i.path, callback);
        } else {
            res = callback(i);
        }
        if (res === false) {
            return false;
        }
    }
    return true;
}

export function walk(start: string, callback: (info: FileInfo) => void): Promise<boolean> {
    return _walk(start, null, callback);
}
