
import * as path from 'path';
import * as Archiver from 'archiver';

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
    const promise = new Promise((resolve, reject) => {
        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', err => {
            if (err.code === 'ENOENT') {
                // log warning
                console.log(err);
            } else {
                reject(err);
            }
        });
        // good practice to catch this error explicitly
        archive.on('error', err => {
            reject(err);
        });
        // Perform an action after closing
        archive.on('close', () => {
            resolve();
        });
    });
    // Send the file to the output.
    archive.pipe(out);
    // append files from tempDir, making the appName as root
    archive.directory(dir, archiveFolderName);
    archive.finalize();
    return promise;
}
