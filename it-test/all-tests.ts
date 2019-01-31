import 'mocha';
import * as path from 'path';
import { dirSync } from 'tmp';
import { existsSync, readdirSync } from 'fs';
import { applyDeployment } from 'core/deploy';
import {
    run,
    isDryRun,
    getRuntimes,
    Capability,
    capName,
    deployment,
    Context,
    runAt,
    Part,
    getServiceName
} from './functions';
import { getRouteHost, waitForProject } from './ochelpers';

// Array of all the backend capabilities to be tested
// Each entry is itself an array of all the different options to be tested for that particular capability
const backendcaps: Capability[][] = [
    ['rest'],
    ['database', { 'name': 'database', 'opts': { 'databaseType': 'mysql' } }],
];

// Array of all the frontend capabilities to be tested
// Each entry is itself an array of all the different options to be tested for that particular capability
const frontendcaps: Capability[][] = [
    ['web-app']
];

before(function() {
    try {
        run('oc', 'whoami');
    } catch (e) {
        throw new Error('You must be logged in to an OpenShift server to run the tests');
    }
    try {
        currProject = run('oc', 'project', '-q').trim();
    } catch (e) {
        // Ignore any errors
    }
});

let currProject;

after(function() {
    if (!!currProject) {
        // Try to restore the original project
        try {
            run('oc', 'project', currProject);
        } catch (e) {
            // Ignore any errors
        }
    }
});

describe('Backends', function() {
    testRuntimesCaps(getRuntimes('backend'), backendcaps);
});

describe('Frontends', function() {
    testRuntimesCaps(getRuntimes('frontend'), frontendcaps);
});

function testRuntimesCaps(runtimes: string[], caps: Capability[][]) {
    runtimes.forEach(function(runtime) {
        const parts = listParts(runtime, caps);
        if (parts.length > 0) {
            testParts(parts);
        }
    });
}

function listParts(runtime: string, caps: Capability[][]): Part[] {
    const parts: Part[] = [];
    const maxAlt = caps.reduce((acc, cur) => Math.max(acc, cur.length), 0);
    for (let i = 0; i < maxAlt; i++) {
        parts.push({ runtime, 'capabilities': [ ...caps.map(cap => cap[i % cap.length]), 'welcome' ] });
    }
    parts.push({ runtime, 'folder': 'test', 'capabilities': caps.map(cap => cap[0])});
    return parts;
}

function testParts(parts: Part[]) {
    parts.forEach(function(part) {
        testPart(part);
    });
}

function testPart(part: Part) {
    let targetDir, projectName;

    function cleanup() {
        if (!!targetDir) {
            console.log('      Removing temporary folder...');
            targetDir.removeCallback();
        }
        if (!!projectName) {
            console.log('      Deleting project...');
            run('oc', 'delete', 'project', projectName);
        }
    }

    describe(`Runtime ${part.runtime} with ${part.capabilities.map(capName)}${!!part.folder ? ' in folder ' + part.folder : ''}`, function() {
        const context: Context = {};
        before('setup', async function() {
            this.timeout(0);
            console.log('      Creating project...');
            targetDir = dirSync({ 'unsafeCleanup': true });
            if (!isDryRun()) {
                await applyDeployment(targetDir.name, deployment(part));
                projectName = path.basename(targetDir.name).toLowerCase().replace(/[^A-Za-z0-9]/g, '');
            }
            run('oc', 'new-project', projectName);
            console.log('      Deploying project...');
            runAt(targetDir.name, './gap', 'deploy');
            console.log('      Building project...');
            runAt(targetDir.name, './gap', 'build');
            console.log('      Pushing project...');
            runAt(targetDir.name, './gap', 'push');
            waitForProject(part);
            context.routeHost = getRouteHost(getServiceName(part));
        });
        describe('Testing capabilities...', function() {
            part.capabilities.forEach(function(cap) {
                testRuntimeCap(part.runtime, cap, context);
            });
        });
        after('cleanup', function() {
            this.timeout(0);
            cleanup();
        });
    });
}

function testRuntimeCap(runtime: string, capability: Capability, context: Context) {
    const name = capName(capability);
    describe(`Capability ${name}`, function() {
        const capDir = `./it-test/${name}`;
        if (existsSync(capDir)) {
            const files = readdirSync(capDir);
            files.forEach(function(file) {
                const mod = require(`./${name}/${file}`);
                Object.keys(mod)
                    .filter(funcName => funcName.startsWith('test'))
                    .forEach(function(funcName) {
                        if (!isDryRun()) {
                            mod[funcName](context);
                        } else {
                            it('dummy test', () => true);
                        }
                    });
            });
        }
    });
}
