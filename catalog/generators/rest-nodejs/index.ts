
import { BaseGenerator } from 'core/catalog';

import PlatformNodejs from 'generators/platform-nodejs';
import { insertAfter } from 'core/template/transformers/insert';

import * as path from 'path';
import { readFile } from 'fs-extra';

export default class RestNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base nodejs platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'serviceName': props.serviceName,
                'version': props.version,
            };

            await this.applyGenerator(PlatformNodejs, resources, pprops);
            const mergeFile = path.resolve(RestNodejs.sourceDir, 'merge/app.merge.js');
            await this.transform('app.js',
                insertAfter('//TODO: Add routes', await readFile(mergeFile, 'utf8')));

            await this.copy();
        }
        return resources;
    }
}
