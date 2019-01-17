import { isDryRun, run } from './functions';
import * as sleep from 'system-sleep';

export function waitForProject() {
    // First we cancel the first build which will fail anyway
    run('oc', 'cancel-build', 'ittest-1');
    // Then we wait for the second build to complete or fail
    waitForBuild();
    // Then we wait for the deployment to spin up our application
    waitForDeployment();
    // And finally we wait a bit longer because if we don't we still often fail *sigh*
    sleep(5000);
}

function waitForBuild() {
    process.stdout.write('      Waiting for build');
    for (let i = 0; i < 60; i++) {
        const out = run('oc', 'get', 'build', 'ittest-2', '--template', '{{.status.phase}}').toLowerCase();
        if (out.startsWith('new')) {
            process.stdout.write('N');
            sleep(15000);
        } else if (out.startsWith('pending')) {
            process.stdout.write('P');
            sleep(15000);
        } else if (out.startsWith('running')) {
            process.stdout.write('.');
            sleep(15000);
        } else if (out.startsWith('complete') || isDryRun()) {
            process.stdout.write(' ok\n');
            break;
        } else {
            process.stdout.write(' failed\n');
            throw new Error('Unexpected status while waiting for build');
        }
    }
}

function waitForDeployment() {
    process.stdout.write('      Waiting for deployment');
    for (let i = 0; i < 60; i++) {
        try {
            process.stdout.write('.');
            run('oc', 'wait', 'dc/ittest', '--timeout=15s', '--for', 'condition=available');
            process.stdout.write(' ok\n');
            break;
        } catch (e) {
            if (e.toString().toLowerCase().indexOf('timeout') < 0) {
                process.stdout.write(' failed\n');
                throw e;
            }
        }
    }
}

export function getRouteHost(name: string): string {
    return run('oc', 'get', 'route', name, '--template', '{{.spec.host}}');
}
