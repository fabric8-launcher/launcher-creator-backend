
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
    public static asList(res): Resource[] {
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

    // Takes an array of resources and turns them into a Template
    public static makeTemplate(objects, params = []) {
        const ps = params || [];
        return {
            'apiVersion': 'v1',
            'kind': 'Template',
            'parameters': [...ps],
            'objects': [...objects]
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

    // Selects the first resource that matches the given 'metadata/name' property
    public static findByName(res, name) {
        return Resources.asList(res).find(r => r.metadata && r.metadata.name === name);
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

    // Returns the parameters (if any)
    get parameters() {
        return this.res.parameters || [];
    }

    // Finds a parameter by name
    public parameter(name) {
        return this.parameters.find(p => p.name === name);
    }

    // Turns the current resources into a List
    public toList() {
        if (this.res.kind && this.res.kind.toLowerCase() !== 'list') {
            this.res = Resources.makeList(this.items);
        }
        return this;
    }

    // Turns the current resources into a Template
    public toTemplate(params = []) {
        if (this.res.kind && this.res.kind.toLowerCase() !== 'template') {
            this.res = Resources.makeTemplate(this.items, params);
        }
        return this;
    }

    // Adds new resources from 'newres' to the wrapped object.
    // If the current wrapped object is a List the new resources will be added
    // to its items. If it's a Template they will be added to its objects. If
    // it's a single resource a List will be created containing that resource
    // plus all the new ones. If the current wrapped object is empty a new List
    // will be created if 'newres' has multiple resources or it will be set to
    // contain the single 'newres' item if there's only one.
    public add(newres) {
        const params = this.res.parameters;
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

        // If there are any parameters merge them
        if (params || newres.parameters) {
            const newparams = [ ...(params || []), ...(newres.parameters || []) ];
            this.toTemplate().json.parameters = newparams;
        }

        return this;
    }

    // Adds the given parameter to the current list of parameters.
    // The resources will be turned into a Template first if necessary
    public addParam(param): Resources {
        const params = this.toTemplate().parameters;
        params.push(param);
        return this;
    }

    get builds() {
        return Resources.selectByKind(this.res, 'build');
    }

    public build(name) {
        return Resources.findByName(this.builds, name);
    }

    get buildConfigs() {
        return Resources.selectByKind(this.res, 'buildconfig');
    }

    public buildConfig(name) {
        return Resources.findByName(this.buildConfigs, name);
    }

    get configMaps() {
        return Resources.selectByKind(this.res, 'configmap');
    }

    public configMap(name) {
        return Resources.findByName(this.configMaps, name);
    }

    get deployments() {
        return Resources.selectByKind(this.res, 'deployment');
    }

    public deployment(name) {
        return Resources.findByName(this.deployments, name);
    }

    get deploymentConfigs() {
        return Resources.selectByKind(this.res, 'deploymentconfig');
    }

    public deploymentConfig(name) {
        return Resources.findByName(this.deploymentConfigs, name);
    }

    get imageStreamImages() {
        return Resources.selectByKind(this.res, 'imagestreamimage');
    }

    public imageStreamImage(name) {
        return Resources.findByName(this.imageStreamImages, name);
    }

    get imageStreams() {
        return Resources.selectByKind(this.res, 'imagestream');
    }

    public imageStream(name) {
        return Resources.findByName(this.imageStreams, name);
    }

    get imageStreamTags() {
        return Resources.selectByKind(this.res, 'imagestreamtag');
    }

    public imageStreamTag(name) {
        return Resources.findByName(this.imageStreamTags, name);
    }

    get persistentVolumes() {
        return Resources.selectByKind(this.res, 'persistentvolume');
    }

    public persistentVolume(name) {
        return Resources.findByName(this.persistentVolumes, name);
    }

    get persistentVolumeClaims() {
        return Resources.selectByKind(this.res, 'persistentvolumeclaim');
    }

    public persistentVolumeClaim(name) {
        return Resources.findByName(this.persistentVolumeClaims, name);
    }

    get roles() {
        return Resources.selectByKind(this.res, 'role');
    }

    public role(name) {
        return Resources.findByName(this.roles, name);
    }

    get roleBindings() {
        return Resources.selectByKind(this.res, 'rolebinding');
    }

    public roleBinding(name) {
        return Resources.findByName(this.roleBindings, name);
    }

    get routes() {
        return Resources.selectByKind(this.res, 'route');
    }

    public route(name) {
        return Resources.findByName(this.routes, name);
    }

    get secrets() {
        return Resources.selectByKind(this.res, 'secret');
    }

    public secret(name) {
        return Resources.findByName(this.secrets, name);
    }

    get services() {
        return Resources.selectByKind(this.res, 'service');
    }

    public service(name) {
        return Resources.findByName(this.services, name);
    }
}

// Wraps the given 'res' object in a instance of Resources.
// If 'res' is already of type Resources it will be returned as-is
export function resources(res = {}): Resources {
    return (res instanceof Resources) ? res : new Resources(res);
}

// Merges the vars from the `env` object with the `targetEnv` object.
// Both objects should be arrays of DeploymentConfig environment definitions
function mergeEnv(targetEnv, env) {
    const tenv = targetEnv || [];
    return [ ...tenv.filter(t => !env.find(e => e.name === t.name)), ...env ];
}

// Converts an object with key/values to an array of DeploymentConfig environment definitions.
// If the value of a key/value pair is a string a simple object with name/value properties will
// be created. In the case that the value is an object it will be assumed to contain a reference
// to a key in a ConfigMap or Secret or a reference to a field in the resources. In the case
// of the ConfigMap or Secret the object must have a `key` property and either a `secretKeyRef`
// with the name of a Secret or a `configMapKeyRef` with the name of a ConfigMap. In the case of
// a `fieldRef` the object just needs to contain a single `field` property that holds the path
// to the field.
function convertObjectToEnvWithRefs(env) {
    return Object.entries(env).map(e => {
        const envKey = e[0];
        const envValue: any = e[1];
        if (typeof envValue === 'object') {
            const envVar = {
                'name': envKey,
                'valueFrom': {}
            };
            if (envValue.secret) {
                envVar.valueFrom['secretKeyRef'] = {
                    'name': envValue.secret,
                    'key': envValue.key
                };
            } else if (envValue.configMap) {
                envVar.valueFrom['configMapKeyRef'] = {
                    'name': envValue.configMap,
                    'key': envValue.key
                };
            } else if (envValue.field) {
                envVar.valueFrom['fieldRef'] = {
                    'fieldPath': envValue.field
                };
            } else {
                throw new Error("Missing ENV value 'secret', 'configMap' or 'field' property");
            }
            return envVar;
        } else {
            return {
                'name': envKey,
                'value': envValue.toString()
            };
        }
    });
}

// Updates the environment variables for the BuildConfig selected
// by 'bcName' with the given key/values in the object 'env'. The values
// are either simple strings or they can be objects themselves in which
// case they are references to keys in a ConfigMap or a Secret.
export function setBuildEnv(res: Resources, env, bcName?: any): Resources {
    if (!!env && res.buildConfigs.length > 0) {
        const bc = (bcName) ? res.buildConfig(bcName) : res.buildConfigs[0];
        const bcss = _.get(bc, 'spec.strategy.sourceStrategy');
        if (bcss) {
            bcss.env = mergeEnv(bcss.env, convertObjectToEnvWithRefs(env));
        }
    }
    return res;
}

// Updates the environment variables for the DeploymentConfig selected
// by 'dcName' with the given key/values in the object 'env'. The values
// are either simple strings or they can be objects themselves in which
// case they are references to keys in a ConfigMap or a Secret.
export function setDeploymentEnv(res: Resources, env, dcName?: any): Resources {
    if (!!env && res.deploymentConfigs.length > 0) {
        const dc = (dcName) ? res.deploymentConfig(dcName) : res.deploymentConfigs[0];
        const dcc = _.get(dc, 'spec.template.spec.containers[0]');
        if (dcc) {
            dcc.env = mergeEnv(dcc.env, convertObjectToEnvWithRefs(env));
        }
    }
    return res;
}

// Updates the contextDir in the source strategy of the BuildConfig selected
// by 'bcName' with the given path.
export function setBuildContextDir(res: Resources, contextDir: string, bcName?: any): Resources {
    if (!!contextDir && res.buildConfigs.length > 0) {
        const bc = (bcName) ? res.buildConfig(bcName) : res.buildConfigs[0];
        if (bc) {
            _.set(bc, 'spec.source.contextDir', contextDir);
        }
    }
    return res;
}

// Sets the "app" label on all resources to the given value
function setAppLabel(res: Resources, label: string|object): Resources {
    res.items.forEach(r => {
        if (typeof label === 'string') {
            _.set(r, 'metadata.labels.app', label);
        } else {
            Object.entries(label).forEach(([key, value]) => _.set(r, `metadata.labels.${key}`, value));
        }
    });
    return res;
}

// Returns a list of resources that when applied will create
// an instance of the given image or template. Any environment
// variables being passed will be applied to any `DeploymentConfig`
// and `BuildConfig` resources that could be found in the image
export async function newApp(appName: string,
                             appLabel: string|object,
                             imageName: string,
                             sourceUri?: string,
                             env = {}): Promise<Resources> {
    let appRes = await readTemplate(imageName, appName, null, sourceUri);
    setAppLabel(appRes, appLabel);
    appRes = setBuildEnv(appRes, env);
    appRes = setDeploymentEnv(appRes, env);
    return appRes;
}

// Helper function that creates a database using the given 'dbImageName'
// and the given environment variables from 'env' and 'secretEnv' (the
// latter being taken from a previously created Secret indicated by
// 'secretName').
export async function newDatabaseUsingSecret(res: Resources,
                                             appName: string,
                                             appLabel: string,
                                             dbImageName: string,
                                             env): Promise<Resources> {
    if (!res.service(appName)) {
        // Create the database resource definitions
        const appRes = await newApp(appName, appLabel, dbImageName, null, env);
        const resNew = res.add(appRes);
        // console.log(`Database ${dbServiceName} added`);
        return resNew;
    } else {
        // console.log(`Database ${dbServiceName} already exists`);
        return res;
    }
}

export async function newRoute(res: Resources,
                               appName: string,
                               appLabel: string|object,
                               serviceName: string, port: number = -1): Promise<Resources> {
    let portName;
    if (port === -1) {
        portName = res.service(serviceName)['spec'].ports[0].name;
    } else {
        portName = res.service(serviceName)['spec'].ports.find(p => p.port === port).name;
    }
    const lbls = (typeof appLabel === 'string') ? { 'app': appLabel } : appLabel;
    res.add({
        'apiVersion': 'v1',
        'kind': 'Route',
        'metadata': {
            'name': appName,
            'labels': lbls
        },
        'spec': {
            'port': {
                'targetPort': portName
            },
            'to': {
                'kind': 'Service',
                'name': serviceName
            }
        }
    });
    return res;
}
