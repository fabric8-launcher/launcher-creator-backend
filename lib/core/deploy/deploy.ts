import { deploy } from '.';

const args = process.argv.slice(2);

if (args.length !== 1) {
    console.error('Missing argument');
    console.log(`Usage: yarn run -s deploy <project_dir>`);
    console.log(`    project_dir     - The project directory. Will be created if it doesn't exist.`);
    process.exit(1);
}

const TARGET_DIR = args[0];

deploy(TARGET_DIR).catch(err => console.error(`Deployment Error: ${err}`));
