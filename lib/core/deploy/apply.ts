
import { printUsage } from 'core/info';
import { listCapabilityInfos, getCapabilityModule, info, listEnums } from 'core/catalog';
import { resourcesFileName, readOrCreateResources, applyDeployment, readDeployment } from '.';
import {
    ApplicationDescriptor,
    CapabilityDescriptor,
    DeploymentDescriptor,
    TierDescriptor,
    toRuntime
} from 'core/catalog/types';

async function apply(targetDir: string, deployment: DeploymentDescriptor) {
    const res = await readOrCreateResources(resourcesFileName(targetDir));
    await applyDeployment(res, targetDir, deployment);
    console.log(`Applied capability to "${targetDir}"`);
    console.log('Go into that folder and type "./gap deploy" while logged into OpenShift to create the application');
    console.log('in the currently active project. Afterwards type "./gap push" at any time to push the current');
    console.log('application code to the project.');
}

async function main() {
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
    } else if (args.length === 3 && args[1] === '--descriptor') {
        const deployment = await readDeployment(args[2]);
        const TARGET_DIR = args[0];
        await apply(TARGET_DIR, deployment);
    } else if (args.length < 3) {
        console.error(`Missing arguments`);
        console.log(`Usage: yarn run -s apply <project_dir> [--tier <tier>] [--runtime <runtime>[/<version>]] <app_name> <capability> [<json_props>] ...`);
        console.log(`                         <project_dir> --descriptor <descriptor_file>`);
        console.log(`                         <capability> --help`);
        console.log(`                         capabilities`);
        console.log(`                         runtimes`);
        console.log(`    project_dir     - The project directory. Will be created if it doesn't exist.`);
        console.log(`    tier            - Optional tier to use for the capability.`);
        console.log(`    app_name        - The name of the application.`);
        console.log(`    runtime         - The runtime to use for the application.`);
        console.log(`    version         - The runtime version to use for the application (optional).`);
        console.log(`    capability      - The name of the Capability to apply.`);
        console.log(`    json_props      - The properties that will be passed to the Capability.`);
        console.log(`    descriptor_file - The path to a JSON file containing a deployment descriptor.`);
        console.log(``);
        console.log(`Use 'yarn run -s apply runtimes' for a list of available runtimes.`);
        console.log(`Use 'yarn run -s apply capabilities' for a list of available capabilities.`);
        console.log(`Use 'yarn run -s apply <capability> --help' for more information.`);
        process.exit(1);
    } else {
        let i = 0;

        const TARGET_DIR = args[i++];

        const tier: TierDescriptor = {
            'shared': {},
            'capabilities': []
        };

        if (args[i] === '--tier') {
            tier.tier = args[i + 1];
            i += 2;
        }

        const SHARED = {};
        if (args[i] === '--runtime') {
            SHARED['runtime'] = toRuntime(args[i + 1]);
            i += 2;
        } else if (args[i] === '--framework') {
            SHARED['runtime'] = { 'name': args[i + 1] };
            i += 2;
        }

        const APP_NAME = args[i++];

        tier.shared = SHARED;

        const app: ApplicationDescriptor = {
            'application': APP_NAME,
            'tiers': [tier]
        };

        const deployment: DeploymentDescriptor = {
            'applications': [app]
        };

        while (i < args.length) {
            const cap: CapabilityDescriptor = {
                'module': args[i]
            };
            const PROPS = args[i + 1] || '';
            if (i < args.length - 1 && PROPS.trim().startsWith('{')) {
                cap.props = JSON.parse(PROPS);
                i++;
            }
            tier.capabilities = [...tier.capabilities, cap];
            i++;
        }

        await apply(TARGET_DIR, deployment);
    }
}

main()
    .catch((err) => console.error(`Application Error: ${err}`));
