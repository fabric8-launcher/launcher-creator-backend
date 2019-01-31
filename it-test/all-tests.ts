import 'mocha';
import * as path from 'path';
import { dirSync } from 'tmp';
import { existsSync, readdirSync } from 'fs';
import { applyDeployment } from 'core/deploy';
import { getRouteHost, waitForProject } from './ochelpers';
import { findPropertyWithValue, ModuleInfoDef } from 'core/info';
import { listEnums } from 'core/catalog';
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
    getServiceName,
    getCapabilities,
    CapabilityOptions, getCapabilityOverrides
} from './functions';

// Put any capabilities here that need special options for testing.
// Each set of options in the array will be used in a separate test run
const capabilityOptions: CapabilityOptions = {
    'database': [
        { 'databaseType': 'postgresql' },
        { 'databaseType': 'mysql' }
    ]
};

let currProject;

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
    testRuntimesCaps(getRuntimes('backend'), getCapabilities('backend'));
});

describe('Frontends', function() {
    testRuntimesCaps(getRuntimes('frontend'), getCapabilities('frontend'));
});

function testRuntimesCaps(runtimes: string[], capInfos: ModuleInfoDef[]) {
    runtimes.forEach(function(runtime) {
        const parts = listParts(runtime, capInfos);
        if (parts.length > 0) {
            testParts(parts);
        }
    });
}

function listParts(runtime: string, capInfos: ModuleInfoDef[]): Part[] {
    const parts: Part[] = [];
    const rtCaps = capInfos.filter(d => !!findPropertyWithValue(d, 'runtime.name', runtime, listEnums()));
    const caps = rtCaps.map(c => c.module);
    const cOverrides = getCapabilityOverrides();

    function actualCaps(idx: number) {
        return caps.map(c => {
            const co = capabilityOptions[c];
            if (!!co) {
                return { 'name': c, 'opts': co[idx % co.length] };
            } else {
                return c;
            }
        });
    }

    const maxAlt = Object.values(capabilityOptions).reduce((acc, cur) => Math.max(acc, cur.length), 0);
    for (let i = 0; i < maxAlt; i++) {
        if (!cOverrides || cOverrides.includes('welcome')) {
            parts.push({ runtime, 'capabilities': [...actualCaps(i), 'welcome'] });
        } else {
            parts.push({ runtime, 'capabilities': actualCaps(i) });
        }
    }
    parts.push({ runtime, 'folder': 'test', 'capabilities': actualCaps(0) });
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
