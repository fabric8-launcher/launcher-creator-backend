import { push } from '.';

const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('Missing argument');
    console.log(`Usage: yarn push -s zip <project_dir> [ --source | --binary ]`);
    console.log(`    project_dir     - The project directory.`);
    console.log(`    --source        - Pushes sources and builds the application on OpenShift.`);
    console.log(`    --binary        - Pushes a locally built application to OpenShift.`);
    process.exit(1);
}

const TARGET_DIR = args[0];
const PUSH_TYPE = args[1];

push(TARGET_DIR, PUSH_TYPE).catch(err => console.error(`Push Error: ${err}`));
