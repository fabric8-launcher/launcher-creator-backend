import { push } from '.';

const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('Missing argument');
    console.log(`Usage: yarn push -s zip <project_dir> [ --source | --binary ] [ --follow ]`);
    console.log(`    project_dir     - The project directory.`);
    console.log(`    --source        - Pushes sources and builds the application on OpenShift.`);
    console.log(`    --binary        - Pushes a locally built application to OpenShift.`);
    console.log(`    --follow        - Follow and output the entire build process.`);
    process.exit(1);
}

const TARGET_DIR = args[0];

let PUSH_TYPE;
let FOLLOW = false;
for (let i = 1; i < args.length; i++) {
    if (args[i] === '--follow') {
        FOLLOW = true;
    } else if (args[i] === '--source' || args[i] === '-s') {
        PUSH_TYPE = 'source';
    } else if (args[i] === '--binary' || args[i] === '-b') {
        PUSH_TYPE = 'binary';
    }
}

push(TARGET_DIR, PUSH_TYPE, FOLLOW).catch(err => console.error(`Push Error: ${err}`));
