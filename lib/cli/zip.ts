import { zip } from 'core/deploy';

const args = process.argv.slice(2);

if (args.length !== 2) {
    console.error('Missing argument');
    console.log(`Usage: yarn run -s zip <project_dir> <zip_file>`);
    console.log(`    project_dir     - The project directory.`);
    console.log(`    zip_file        - The zip file to create.`);
    process.exit(1);
}

const TARGET_DIR = args[0];
const ZIP_FILE = args[1];

zip(TARGET_DIR, ZIP_FILE).catch(err => console.error(`Zip Error: ${err}`));
