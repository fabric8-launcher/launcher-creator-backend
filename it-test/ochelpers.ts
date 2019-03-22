import { getServiceName, isDryRun, Part, run } from './functions';
import * as sleep from 'system-sleep';

export function waitForFirstBuild(part: Part) {
    // First we wait for the first build to appear
    // (if we try to start our build sooner it will silently fail)
    process.stdout.write('      Waiting for build system to ready up');
    for (let i = 0; i < 60; i++) {
        try {
            process.stdout.write('.');
            run('oc', 'get', 'build/' + getServiceName(part) + '-1', '--template={{.status.phase}}');
            process.stdout.write(' ok\n');
            break;
        } catch (e) {
            if (e.toString().toLowerCase().indexOf('notfound') < 0) {
                process.stdout.write(' failed\n');
                throw e;
            }
            if (!isDryRun()) {
                sleep(5000);
            }
        }
    }
    // Then we cancel that first build which will fail anyway
    try {
        run('oc', 'cancel-build', getServiceName(part) + '-1');
    } catch (e) {
        // Ignore any errors
    }
}

export function waitForProject(part: Part) {
    // We wait for the deployment to spin up our application
    waitForDeployment(part);
    // And finally we wait a bit longer because if we don't we still often fail *sigh*
    if (!isDryRun()) {
        sleep(5000);
    }
}

function waitForDeployment(part: Part) {
    process.stdout.write('      Waiting for application to start');
    for (let i = 0; i < 60; i++) {
        try {
            process.stdout.write('.');
            run('oc', 'wait', 'dc/' + getServiceName(part), '--timeout=15s', '--for', 'condition=available');
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
