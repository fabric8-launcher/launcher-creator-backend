
import * as tmp from 'tmp-promise';
import * as git from 'simple-git/promise';

import { determineBuilderImage } from 'core/analysis';

const args = process.argv.slice(2);

if (args.length !== 1) {
    console.error('Missing argument');
    console.log(`Usage: yarn run -s analyze <git_repo>`);
    console.log(`    git_repo     - URL or local file path to a Git repository.`);
    process.exit(1);
}

const GIT_DIR_OR_URL = args[0];

let p;
if (GIT_DIR_OR_URL.startsWith('http:') || GIT_DIR_OR_URL.startsWith('https:') || GIT_DIR_OR_URL.startsWith('git@')) {
    const url = GIT_DIR_OR_URL;
    // Create temp dir
    p = tmp.dir({ 'unsafeCleanup': true }).then(td => {
        // Shallow-clone the repository
        return git().clone(url, td.path, ['--depth', '1']).then(() => {
            // From the code we determine the builder image to use
            return determineBuilderImage(td.path).then(image => console.log(image));
        });
    });
} else {
    const dir = GIT_DIR_OR_URL;
    p = determineBuilderImage(dir)
        .then(image => console.log(image));
}
p.catch(err => console.error(`Zip Error: ${err}`));
