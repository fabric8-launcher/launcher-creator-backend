'use strict';

const resources = require("../../core/resources").resources;

const args = process.argv.slice(2);

if (args.length !== 1) {
    console.error("Missing argument");
    console.log(`Usage: yarn run -s generate <project_dir>`);
    console.log(`    project_dir     - The project directory. Will be created if it doesn't exist.`);
    process.exit(1);
}

const TARGET_DIR = args[0];

require('.').generateDeployment(resources({}), TARGET_DIR)
    .then(res => {
        process.stdout.write(JSON.stringify(res.json, null, 4));
        process.stdout.write("\n");
    })
    .catch(err => console.error(`Generate Deployment Error: ${err}`));
