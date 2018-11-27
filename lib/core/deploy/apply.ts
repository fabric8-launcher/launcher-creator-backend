
import { printUsage } from 'core/info';
import { listCapabilityInfos, getCapabilityModule, info, listEnums } from 'core/catalog';
import { toRuntime } from 'core/catalog/types';
import { resourcesFileName, readOrCreateResources, apply } from '.';

const args = process.argv.slice(2);

if (args.length === 1 && args[0] === 'runtimes') {
    process.stdout.write('Available runtimes/versions:\n');
    listEnums()['runtime.name'].forEach(r => {
        process.stdout.write(`    ${r.id.padEnd(15)} - ${r.name}\n`);
        const versions = listEnums()['runtime.version.' + r.id];
        if (!!versions && versions.length > 0) {
            versions.forEach(v => process.stdout.write(`        ${v.id.padEnd(15)} - ${v.name}\n`));
        }
    });
} else if (args.length === 1 && args[0] === 'capabilities') {
    process.stdout.write('Available capabilities:\n');
    listCapabilityInfos().then(caps => caps.forEach(c => process.stdout.write(`    ${c.module.padEnd(15)} - ${c.description}\n`)));
} else if (args.length === 2 && args[1] === '--help') {
    const CAP = args[0];
    console.log(`yarn run -s apply <project_dir> <app_name> ${CAP} [<json_props>] ...`);
    console.log(`    project_dir     - The project directory. Will be created if it doesn't exist.`);
    console.log(`    app_name        - The name of the application.`);
    console.log(`    ${CAP.padEnd(15)} - The name of the Capability to apply.`);
    console.log(`    json_props      - These will be passed to the Capability:`);
    printUsage(info(getCapabilityModule(CAP)).props, listEnums());
    process.exit(0);
} else if (args.length < 4) {
    console.error(`Missing arguments`);
    console.log(`Usage: yarn run -s apply <project_dir> <app_name> <runtime>[/<version>]</version><capability> [<json_props>] ...`);
    console.log(`                         <capability> --help`);
    console.log(`                         capabilities`);
    console.log(`                         runtimes`);
    console.log(`    project_dir     - The project directory. Will be created if it doesn't exist.`);
    console.log(`    app_name        - The name of the application.`);
    console.log(`    runtime         - The runtime to use for the application.`);
    console.log(`    version         - The runtime version to use for the application (optional).`);
    console.log(`    capability      - The name of the Capability to apply.`);
    console.log(`    json_props      - The properties that will be passed to the Capability.`);
    console.log(``);
    console.log(`Use 'yarn run -s apply runtimes' for a list of available runtimes.`);
    console.log(`Use 'yarn run -s apply capabilities' for a list of available capabilities.`);
    console.log(`Use 'yarn run -s apply <capability> --help' for more information.`);
    process.exit(1);
} else {
    const TARGET_DIR = args[0];
    const APP_NAME = args[1];
    const SHARED = { 'runtime': toRuntime(args[2]) };

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

    readOrCreateResources(resourcesFileName(TARGET_DIR))
        .then((res) => {
            apply(res, TARGET_DIR, APP_NAME, SHARED, CAPS)
                .then(() => {
                    console.log(`Applied capability to "${TARGET_DIR}"`);
                    console.log('Go into that folder and type "./gap deploy" while logged into OpenShift to create the application');
                    console.log('in the currently active project. Afterwards type "./gap push" at any time to push the current');
                    console.log('application code to the project.');
                })
                .catch((err) => console.error(`Application Error: ${err}`));
        });
}
