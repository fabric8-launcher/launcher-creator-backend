import { spawnSync, SpawnSyncOptions } from 'child_process';
import { listEnums } from 'core/catalog';
import { toRuntime } from 'core/catalog/types';
import * as _ from 'lodash';

export interface Context {
    routeHost?: string;
}

export interface CapabilityDef {
    name: string;
    opts: object;
}

export type Capability = string | CapabilityDef;

export function capName(cap: Capability): string {
    if (typeof cap === 'string') {
        return cap as string;
    } else {
        return (cap as CapabilityDef).name;
    }
}

export function capOpts(cap: Capability): object {
    if (typeof cap === 'string') {
        return {};
    } else {
        return (cap as CapabilityDef).opts;
    }
}

export function deployment(runtime: string, capabilities: Capability[]) {
    const caps = capabilities.map(cap => {
        if (typeof cap === 'string') {
            return { 'module': cap };
        } else {
            const cd = cap as CapabilityDef;
            return { 'module': cd.name, 'props': cd.opts };
        }
    });
    return {
        'applications': [{
            'application': 'ittest',
            'parts': [{
                'shared': {
                    'runtime': toRuntime(runtime)
                },
                'capabilities': caps
            }]
        }]
    };
}

function args() {
    return _.takeRightWhile(process.argv, i => i.startsWith('--'));
}

export function isDryRun() {
    return args().includes('--dry-run');
}

export function getRuntimeOverrides() {
    const runtimesArg = args().find(i => i.startsWith('--runtimes='));
    if (!!runtimesArg) {
        const runtimes = runtimesArg.substr(11).split(',');
        return runtimes;
    } else {
        return null;
    }
}

export function run(cmd, ...args: string[]) {
    return runAt(null, cmd, ...args);
}

export function runAt(cwd, cmd, ...args: string[]) {
    const opts: SpawnSyncOptions = {};
    if (!!cwd) {
        opts.cwd = cwd;
    }
    // const opts = { 'stdio': [ 'ignore', 1, 2 ] } as SpawnSyncOptions;
    if (!isDryRun()) {
        const proc = spawnSync(cmd, args, opts);
        if (!!proc.error) {
            console.log(proc.error);
        } else if (proc.status !== 0) {
            throw new Error(`Command '${cmd} ${args.join()}' failed with error code: ${proc.status}`);
        }
        return proc.stdout.toString();
    } else {
        console.log(`      Run '${cmd} ${args.join(' ')}'`);
        return '';
    }
}

export function getRuntimes(tier: string) {
    const rtOverrides = getRuntimeOverrides();
    return listEnums()['runtime.name']
        .filter(e => _.get(e, 'metadata.categories', []).includes(tier))
        .map(e => e.id)
        .filter(r => !rtOverrides || rtOverrides.includes(r));
}
