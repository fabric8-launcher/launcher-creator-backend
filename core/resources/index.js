'use strict';

const _ = require('lodash');
const spawn = require('child-process-promise').spawn;
const streamToString = require('stream-to-string');
const Readable = require("stream").Readable;

// Wrapper class for an object containing OpenShift/K8s resources.
// It intends to make it easier to query and update the resources
class Resources {
    constructor(res) {
        this.res = res;
    }

    // Returns an array of all the resources found in the given object.
    // Will return the items of a List or the objects contained in a
    // Template. It will return an array of one if there's just a single
    // item that's neither a List nor a Template. Will return an empty
    // array if no resources were found at all. And finally if the argument
    // already is an array it will return that as-is.
    static asList(res) {
        if (res instanceof Resources) {
            return Resources.asList(res.json);
        } else if (Array.isArray(res)) {
            return res;
        } else if (res.kind && res.kind.toLowerCase() === "list") {
            return res.items || [];
        } else if (res.kind && res.kind.toLowerCase() === "template") {
            return res.objects || [];
        } else if (res.kind) {
            return [res];
        } else {
            return [];
        }
    }

    // Returns true if no resources were found in the given argument
    static isEmpty(res) {
        return Resources.asList(res).length === 0;
    }

    // Takes an array of resources and turns them into a List
    static makeList(items) {
        return {
            apiVersion: "v1",
            kind: "List",
            items: [...items]
        };
    }

    // Selects resources by their "kind" property
    static selectByKind(res, kind) {
        return Resources.asList(res).filter(r => r.kind && r.kind.toLowerCase() === kind.toLowerCase());
    }

    // Selects resources by their "metadata/name" property
    static selectByName(res, name) {
        return Resources.asList(res).filter(r => r.metadata && r.metadata.name === name);
    }

    // Returns the wrapped object
    get json() {
        return this.res;
    }

    // Adds new resources from "newres" to the wrapped object.
    // If the current wrapped object is a List the new resources will be added
    // to its items. If it's a Template they will be added to its objects. If
    // it's a single resource a List will be created containing that resource
    // plus all the new ones. If the current wrapped object is empty a new List
    // will be created if "newres" has multiple resources or it will be set to
    // contain the single "newres" item if there's only one.
    add(newres) {
        const items = Resources.asList(newres);
        if (this.res.kind && this.res.kind.toLowerCase() === "list") {
            this.res.items = [...this.res.items, ...items];
        } else if (this.res.kind && this.res.kind.toLowerCase() === "template") {
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
        return Resources.selectByKind(this.res, "build");
    }

    build(name) {
        return Resources.selectByName(this.builds, name);
    }

    get buildConfigs() {
        return Resources.selectByKind(this.res, "buildconfig");
    }

    buildConfig(name) {
        return Resources.selectByName(this.buildConfigs, name);
    }

    get configMaps() {
        return Resources.selectByKind(this.res, "configmap");
    }

    configMap(name) {
        return Resources.selectByName(this.configMaps, name);
    }

    get deployments() {
        return Resources.selectByKind(this.res, "deployment");
    }

    deployment(name) {
        return Resources.selectByName(this.deployments, name);
    }

    get deploymentConfigs() {
        return Resources.selectByKind(this.res, "deploymentconfig");
    }

    deploymentConfig(name) {
        return Resources.selectByName(this.deploymentConfigs, name);
    }

    get imageStreamImages() {
        return Resources.selectByKind(this.res, "imagestreamimage");
    }

    imageStreamImage(name) {
        return Resources.selectByName(this.imageStreamImages, name);
    }

    get imageStreams() {
        return Resources.selectByKind(this.res, "imagestream");
    }

    imageStream(name) {
        return Resources.selectByName(this.imageStreams, name);
    }

    get imageStreamTags() {
        return Resources.selectByKind(this.res, "imagestreamtag");
    }

    imageStreamTag(name) {
        return Resources.selectByName(this.imageStreamTags, name);
    }

    get persistentVolumes() {
        return Resources.selectByKind(this.res, "persistentvolume");
    }

    persistentVolume(name) {
        return Resources.selectByName(this.persistentVolumes, name);
    }

    get persistentVolumeClaims() {
        return Resources.selectByKind(this.res, "persistentvolumeclaim");
    }

    persistentVolumeClaim(name) {
        return Resources.selectByName(this.persistentVolumeClaims, name);
    }

    get roles() {
        return Resources.selectByKind(this.res, "role");
    }

    role(name) {
        return Resources.selectByName(this.roles, name);
    }

    get roleBindings() {
        return Resources.selectByKind(this.res, "rolebinding");
    }

    roleBinding(name) {
        return Resources.selectByName(this.roleBindings, name);
    }

    get routes() {
        return Resources.selectByKind(this.res, "route");
    }

    route(name) {
        return Resources.selectByName(this.routes, name);
    }

    get secrets() {
        return Resources.selectByKind(this.res, "secret");
    }

    secret(name) {
        return Resources.selectByName(this.secrets, name);
    }

    get services() {
        return Resources.selectByKind(this.res, "service");
    }

    service(name) {
        return Resources.selectByName(this.services, name);
    }
}

// Wraps the given "res" object in a instance of Resources.
// If "res" is already of type Resources it will be returned as-is
function resources(res) {
    return (res instanceof Resources) ? res : new Resources(res);
}

// Returns a list of resources that when applied will create
// an instance of the given image or template.
function newApp(appName, imageName, env={}) {
    const envStr = Object.entries(env).map(([key,val]) => `-e${key}=${val}`);
    const proc = spawn(`oc`, [`new-app`,
                    `--name=${appName}`,
                    ...envStr,
                    imageName,
                    `--dry-run`,
                    `-o`, `json`]);
    proc.catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
    return streamToString(proc.childProcess.stdout).then(json => resources(JSON.parse(json)));
}

function setEnv(targetEnv, env, resFunc) {
    let result = targetEnv || [];
    Object.entries(env).forEach(([key, val]) => {
        result = [...result.filter(e => e.name !== key), resFunc(key, val)];
    });
    return result;
}

// Updates the environment variables for the DeploymentConfig selected
// by "dcName" with the given variables in "env" from a previously
// created Secret indicated by "secretName"
function setDeploymentEnvFromSecret(res, secretName, env, dcName) {
    if (res.deploymentConfigs.length > 0) {
        const dc = (dcName) ? res.deploymentConfig(dcName) : res.deploymentConfigs[0];
        const dcc = _.get(dc, "spec.template.spec.containers[0]");
        if (dcc) {
            dcc.env = setEnv(dcc.env, env, (envKey, secretKey) => ({
                "name": envKey,
                "valueFrom": {
                    "secretKeyRef": {
                        "name": secretName,
                        "key": secretKey
                    }
                }
            }));
        }
    }
    return res;
}

// Helper function that creates a database using the given "dbImageName"
// and the given environment variables from "env" and "secretEnv" (the
// latter being taken from a previously created Secret indicated by
// "secretName").
function newDatabaseUsingSecret(resources, dbImageName, dbServiceName, secretName, env, secretEnv) {
    if (resources.service(dbServiceName).length === 0) {
        // Create the database resource definitions
        return newApp(dbServiceName, dbImageName, env)
            .then((appRes) => setDeploymentEnvFromSecret(appRes, secretName, secretEnv))
            .then((appRes) => {
                const res = resources.add(appRes);
                //console.log(`Database ${dbServiceName} added`);
                return res;
            });
    } else {
        //console.log(`Database ${dbServiceName} already exists`);
    }
    return Promise.resolve(resources);
}

// Applies the given resources to the active OpenShift instance
function apply(resources) {
    // Run "oc apply" using the given resources
    const proc = spawn(`oc`, [`apply`, `-f`, `-`], { stdio: ["pipe", 1, 2] })
        .catch((error) => {
            console.error(`Spawn error: ${error}`);
            throw error;
        });
    // Create a Stream containing the resource's json as text and pipe it to the oc command
    const ins = new Readable();
    ins.push(JSON.stringify(resources.json));
    ins.push(null);
    ins.pipe(proc.childProcess.stdin);
    return proc;
}

exports.resources = resources;
exports.newApp = newApp;
exports.setDeploymentEnvFromSecret = setDeploymentEnvFromSecret;
exports.newDatabaseUsingSecret = newDatabaseUsingSecret;
exports.apply = apply;
