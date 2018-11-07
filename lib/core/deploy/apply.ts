
import { printUsage } from 'core/info';
import { listCapabilityInfos, getCapabilityModule, info } from 'core/catalog';
import { resources } from 'core/resources';
import { apply } from '.';

const args = process.argv.slice(2);

if (args.length === 1 && args[0] === '--list') {
    process.stdout.write('Available capabilities:\n');
    listCapabilityInfos().then(caps => caps.forEach(c => process.stdout.write(`    ${c.module.padEnd(15)} - ${c.description}\n`)));
} else if (args.length === 2 && args[1] === '--help') {
    const CAP = args[0];
    console.log(`yarn run -s apply <project_dir> <app_name> ${CAP} [<json_props>] ...`);
    console.log(`    project_dir     - The project directory. Will be created if it doesn't exist.`);
    console.log(`    app_name        - The name of the application.`);
    console.log(`    ${CAP.padEnd(15)} - The name of the Capability to apply.`);
    console.log(`    json_props      - These will be passed to the Capability:`);
    printUsage(info(getCapabilityModule(CAP)).props);
    process.exit(0);
} else if (args.length < 4) {
    console.error(`Missing arguments`);
    console.log(`Usage: yarn run -s apply <project_dir> <app_name> <capability> [<json_props>] ...`);
    console.log(`                         <capability> --help`);
    console.log(`                         --list`);
    console.log(`    project_dir     - The project directory. Will be created if it doesn't exist.`);
    console.log(`    app_name        - The name of the application.`);
    console.log(`    runtime         - The runtime to use for the application.`);
    console.log(`    capability      - The name of the Capability to apply.`);
    console.log(`    json_props      - The properties that will be passed to the Capability.`);
    console.log(``);
    console.log(`Use 'yarn run -s apply --list' for a list of available capabilities.`);
    console.log(`Use 'yarn run -s apply <capability> --help' for more information.`);
    process.exit(1);
} else {
    const TARGET_DIR = args[0];
    const APP_NAME = args[1];
    const RUNTIME = args[2];

    let CAPS = [];
    let i = 3;
    while (i < args.length) {
        const CAP = args[i];
        const PROPS = args[i + 1] || '';
        const props = { 'module': CAP };
        if (i === args.length - 1 || !PROPS.trim().startsWith('{')) {
            CAPS = [ ...CAPS, props ];
            i += 1;
        } else {
            CAPS = [...CAPS, { ...JSON.parse(PROPS), ...props }];
            i += 2;
        }
    }

    apply(resources({}), TARGET_DIR, APP_NAME, RUNTIME, CAPS)
        .then(() => {
            console.log(`Applied capability to "${TARGET_DIR}"`);
            console.log('Go into that folder and type "./gap deploy" while logged into OpenShift to create the application');
            console.log('in the currently active project. Afterwards type "./gap push" at any time to push the current');
            console.log('application code to the project.');
        })
        .catch((err) => console.error(`Application Error: ${err}`));
}
