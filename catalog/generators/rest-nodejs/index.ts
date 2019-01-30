
import * as path from 'path';
import { readFile } from 'fs-extra';

import { BaseGenerator } from 'core/catalog/types';
import { insertAfter } from 'core/template/transformers/insert';

import PlatformNodejs, { PlatformNodejsProps } from 'generators/platform-nodejs';

export interface RestNodejsProps extends PlatformNodejsProps {
}

export default class RestNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: RestNodejsProps, extra: any = {}) {
        // Check if the generator was already applied, so we don't do it twice
        if (!await this.filesCopied()) {
            // First copy the files from the base nodejs platform module
            // and then copy our own over that
            const pprops = {
                'application': props.application,
                'subFolderName': props.subFolderName,
                'serviceName': props.serviceName,
                'routeName': props.routeName,
                'nodejs': props.nodejs,
            };

            await this.generator(PlatformNodejs).apply(resources, pprops, extra);
            const mergeFile = path.resolve(RestNodejs.sourceDir, 'merge/app.merge.js');
            await this.transform('app.js',
                insertAfter('//TODO: Add routes', await readFile(mergeFile, 'utf8')));

            await this.copy();
        }
        extra['sourceMapping'] = { 'greetingEndpoint': this.join(props.subFolderName, 'greeting.js') };
        return resources;
    }
}
