
import * as _ from 'lodash';
import { readTemplate } from './templates';

interface Metadata {
    name?: string;
    annotations?: {
        [key: string]: string;
    };
    [key: string]: any;
}

interface Resource {
    apiVersion?: string;
    kind: string;
    items?: Resource[];
    objects?: Resource[];
    metadata?: Metadata;
    [key: string]: any;
}

// Wrapper class for an object containing OpenShift/K8s resources.
// It intends to make it easier to query and update the resources
export class Resources {

    private res: Resource;

    constructor(res) {
        this.res = res;
    }

    // Returns an array of all the resources found in the given object.
    // Will return the items of a List or the objects contained in a
    // Template. It will return an array of one if there's just a single
    // item that's neither a List nor a Template. Will return an empty
    // array if no resources were found at all. And finally if the argument
    // already is an array it will return that as-is.
    public static asList(res) {
        if (res instanceof Resources) {
            return Resources.asList(res.json);
        } else if (Array.isArray(res)) {
            return res;
        } else if (typeof res === 'object') {
            if (res.kind && res.kind.toLowerCase() === 'list') {
                return res.items || [];
            } else if (res.kind && res.kind.toLowerCase() === 'template') {
                return res.objects || [];
            } else if (res.kind) {
                return [res];
            } else {
                return [];
            }
        } else {
            throw new Error(`Unsupported resource type '${typeof res}', should be object or array`);
        }
    }

    // Takes an array of resources and turns them into a List
    public static makeList(items) {
        return {
            'apiVersion': 'v1',
            'kind': 'List',
            'items': [...items]
        };
    }

    // Selects resources by their 'kind' property
    public static selectByKind(res, kind) {
        return Resources.asList(res).filter(r => r.kind && r.kind.toLowerCase() === kind.toLowerCase());
    }

    // Selects resources by their 'metadata/name' property
    public static selectByName(res, name) {
        return Resources.asList(res).filter(r => r.metadata && r.metadata.name === name);
    }

    // Returns an array of the separate resource items
    get items() {
        return Resources.asList(this.res);
    }

    // Returns true if no resources were found in the given argument
    public isEmpty() {
        return this.items.length === 0;
    }

    // Returns the wrapped object
    get json() {
        return this.res;
    }

    // Adds new resources from 'newres' to the wrapped object.
    // If the current wrapped object is a List the new resources will be added
    // to its items. If it's a Template they will be added to its objects. If
    // it's a single resource a List will be created containing that resource
    // plus all the new ones. If the current wrapped object is empty a new List
    // will be created if 'newres' has multiple resources or it will be set to
    // contain the single 'newres' item if there's only one.
    public add(newres) {
        const items = Resources.asList(newres);
        if (this.res.kind && this.res.kind.toLowerCase() === 'list') {
            this.res.items = [...this.res.items, ...items];
        } else if (this.res.kind && this.res.kind.toLowerCase() === 'template') {
            this.res.objects = [...this.res.objects, ...items];
        } else if (this.res.kind) {
            this.res = Resources.makeList([this.res, ...items]);
        } else {
            if (items.length > 1) {
                this.res = Resources.makeList(items);
            } else if (items.length === 1) {
                this.res = items[0];
            }
        }
        return this;
    }

    get builds() {
        return Resources.selectByKind(this.res, 'build');
    }

    public build(name) {
        return Resources.selectByName(this.builds, name);
    }

    get buildConfigs() {
        return Resources.selectByKind(this.res, 'buildconfig');
    }

    public buildConfig(name) {
        return Resources.selectByName(this.buildConfigs, name);
    }

    get configMaps() {
        return Resources.selectByKind(this.res, 'configmap');
    }

    public configMap(name) {
        return Resources.selectByName(this.configMaps, name);
    }

    get deployments() {
        return Resources.selectByKind(this.res, 'deployment');
    }

    public deployment(name) {
        return Resources.selectByName(this.deployments, name);
    }

    get deploymentConfigs() {
        return Resources.selectByKind(this.res, 'deploymentconfig');
    }

    public deploymentConfig(name) {
        return Resources.selectByName(this.deploymentConfigs, name);
    }

    get imageStreamImages() {
        return Resources.selectByKind(this.res, 'imagestreamimage');
    }

    public imageStreamImage(name) {
        return Resources.selectByName(this.imageStreamImages, name);
    }

    get imageStreams() {
        return Resources.selectByKind(this.res, 'imagestream');
    }

    public imageStream(name) {
        return Resources.selectByName(this.imageStreams, name);
    }

    get imageStreamTags() {
        return Resources.selectByKind(this.res, 'imagestreamtag');
    }

    public imageStreamTag(name) {
        return Resources.selectByName(this.imageStreamTags, name);
    }

    get persistentVolumes() {
        return Resources.selectByKind(this.res, 'persistentvolume');
    }

    public persistentVolume(name) {
        return Resources.selectByName(this.persistentVolumes, name);
    }

    get persistentVolumeClaims() {
        return Resources.selectByKind(this.res, 'persistentvolumeclaim');
    }

    public persistentVolumeClaim(name) {
        return Resources.selectByName(this.persistentVolumeClaims, name);
    }

    get roles() {
        return Resources.selectByKind(this.res, 'role');
    }

    public role(name) {
        return Resources.selectByName(this.roles, name);
    }

    get roleBindings() {
        return Resources.selectByKind(this.res, 'rolebinding');
    }

    public roleBinding(name) {
        return Resources.selectByName(this.roleBindings, name);
    }

    get routes() {
        return Resources.selectByKind(this.res, 'route');
    }

    public route(name) {
        return Resources.selectByName(this.routes, name);
    }

    get secrets() {
        return Resources.selectByKind(this.res, 'secret');
    }

    public secret(name) {
        return Resources.selectByName(this.secrets, name);
    }

    get services() {
        return Resources.selectByKind(this.res, 'service');
    }

    public service(name) {
        return Resources.selectByName(this.services, name);
    }
}

// Wraps the given 'res' object in a instance of Resources.
// If 'res' is already of type Resources it will be returned as-is
export function resources(res): Resources {
    return (res instanceof Resources) ? res : new Resources(res);
}

function mergeEnv(targetEnv, env, resFunc) {
    let result = targetEnv || [];
    Object.entries(env).forEach(([key, val]) => {
        result = [...result.filter(e => e.name !== key), resFunc(key, val)];
    });
    return result;
}

function mergeEnvWithRefs(targetEnv, complexEnv) {
    return mergeEnv(targetEnv, complexEnv, (envKey, envValue) => {
        if (typeof envValue === 'object') {
            let from, name;
            if (envValue.secret) {
                from = 'secretKeyRef';
                name = envValue.secret;
            } else if (envValue.configMap) {
                from = 'configMapKeyRef';
                name = envValue.configMap;
            } else {
                throw new Error("Missing ENV value 'secret' or 'configMap' property");
            }
            const envVar = {
                'name': envKey,
                'valueFrom': {}
            };
            envVar.valueFrom[from] = {
                'name': name,
                'key': envValue.key
            };
            return envVar;
        } else {
            return {
                'name': envKey,
                'value': envValue.toString()
            };
        }
    });
}

// Updates the environment variables for the DeploymentConfig selected
// by 'dcName' with the given variables in 'env'
function setDeploymentEnv(res: Resources, env, dcName?: any): Resources {
    if (res.deploymentConfigs.length > 0) {
        const dc = (dcName) ? res.deploymentConfig(dcName) : res.deploymentConfigs[0];
        const dcc = _.get(dc, 'spec.template.spec.containers[0]');
        if (dcc) {
            dcc.env = mergeEnvWithRefs(dcc.env, env);
        }
    }
    return res;
}

function setAppLabel(res: Resources, label?: string): Resources {
    res.items.forEach(r => {
        _.set(r, 'metadata.labels.app', label);
    });
    return res;
}

// Returns a list of resources that when applied will create
// an instance of the given image or template.
export function newApp(appName: string, appLabel: string, imageName: string, sourceUri: string, env = {}): Promise<Resources> {
    return readTemplate(imageName, appName, appLabel)
        .then(json => resources(json))
        .then((appRes) => setAppLabel(appRes, appLabel))
        .then((appRes) => setDeploymentEnv(appRes, env));
}

// Helper function that creates a database using the given 'dbImageName'
// and the given environment variables from 'env' and 'secretEnv' (the
// latter being taken from a previously created Secret indicated by
// 'secretName').
export function newDatabaseUsingSecret(res: Resources, appName: string, dbImageName: string, env) {
    const dbName = appName + '-database';
    if (res.service(dbName).length === 0) {
        // Create the database resource definitions
        return newApp(dbName, appName, dbImageName, null, env)
            .then((appRes) => {
                const resNew = res.add(appRes);
                // console.log(`Database ${dbServiceName} added`);
                return resNew;
            });
    } else {
        // console.log(`Database ${dbServiceName} already exists`);
        return Promise.resolve(res);
    }
}
