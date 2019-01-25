import 'mocha';
import * as path from 'path';
import { dirSync } from 'tmp';
import { existsSync, readdirSync } from 'fs';
import { applyDeployment } from 'core/deploy';
import { run, isDryRun, getRuntimes, Capability, capName, deployment, Context, runAt } from './functions';
import { getRouteHost, waitForProject } from './ochelpers';

const backendcaps: Capability[][] = [
    [ 'rest', 'database', 'welcome' ],
    [ 'rest', { 'name': 'database', 'opts': { 'databaseType': 'mysql' } }, 'welcome' ],
];

const frontendcaps: Capability[][] = [
    [ 'web-app' ]
];

before(function() {
    try {
        run('oc', 'whoami');
    } catch (e) {
        throw new Error('You must be logged in to an OpenShift server to run the tests');
    }
});

describe('Backends', function() {
    testRuntimesCapsSet(getRuntimes('backend'), backendcaps);
});

describe('Frontends', function() {
    testRuntimesCapsSet(getRuntimes('frontend'), frontendcaps);
});

function testRuntimesCapsSet(runtimes: string[], capsset: Capability[][]) {
    runtimes.forEach(function(runtime) {
        testRuntimeCapsSet(runtime, capsset);
    });
}

function testRuntimeCapsSet(runtimes: string, capsset: Capability[][]) {
    capsset.forEach(function(caps) {
        testRuntimeCaps(runtimes, caps);
    });
}

function testRuntimeCaps(runtime: string, capabilities: Capability[]) {
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

    describe(`Runtime ${runtime} with ${capabilities.map(capName)}`, function() {
        const context: Context = {};
        before('setup', async function() {
            this.timeout(0);
            console.log('      Creating project...');
            targetDir = dirSync({ 'unsafeCleanup': true });
            if (!isDryRun()) {
                await applyDeployment(targetDir.name, deployment(runtime, capabilities));
                projectName = path.basename(targetDir.name).toLowerCase();
            }
            run('oc', 'new-project', projectName);
            console.log('      Deploying project...');
            runAt(targetDir.name, './gap', 'deploy');
            console.log('      Building project...');
            runAt(targetDir.name, './gap', 'build');
            console.log('      Pushing project...');
            runAt(targetDir.name, './gap', 'push');
            waitForProject();
            context.routeHost = getRouteHost('ittest');
        });
        describe('Testing capabilities...', function() {
            capabilities.forEach(function(cap) {
                testRuntimeCap(runtime, cap, context);
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
