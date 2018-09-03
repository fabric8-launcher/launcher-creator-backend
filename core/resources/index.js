'use strict';

const _ = require('lodash');
const exec = require('child-process-promise').exec;

class Resources {
    constructor(res) {
        this.res = res;
    }

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

    static isEmpty(res) {
        return Resources.asList(res).length == 0;
    }

    static makeList(items) {
        return {
            apiVersion: "v1",
            kind: "List",
            items: [...items]
        };
    }

    static selectByKind(res, kind) {
        return Resources.asList(res).filter(r => r.kind && r.kind.toLowerCase() === kind.toLowerCase());
    }

    static selectByName(res, name) {
        return Resources.asList(res).filter(r => r.metadata && r.metadata.name === name);
    }

    get json() {
        return this.res;
    }

    add(newres) {
        const items = Resources.asList(newres);
        if (this.res.kind && this.res.kind.toLowerCase() === "list") {
            this.res.items = [...this.res.items, ...items];
        } else if (this.res.kind && this.res.kind.toLowerCase() === "template") {
            this.res.objects = [...this.res.objects, ...items];
        } else if (this.res.kind) {
            this.res = Resources.makeList([this.res, ...items]);
        } else {
            this.res = Resources.makeList(items);
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

function resources(res) {
    return (res instanceof Resources) ? res : new Resources(res);
};

// Returns a list of resources that when applied will create
// an instance of the given image or template.
function newApp(appName, imageName, env={}) {
    const envStr = Object.entries(env).reduce((acc, [key,val]) => acc += ` -e${key}=${val}`, "");
    return exec(`oc new-app \
                    --name=${appName} \
                    ${envStr} \
                    ${imageName} \
                    --dry-run \
                    -o json`)
        .catch((error) => {
            console.error(`Exec error: ${error}`);
            throw error;
        })
        .then((result) => {
            return resources(JSON.parse(result.stdout));
        });
}

function setEnv(targetEnv, env, resFunc) {
    let result = targetEnv || [];
    Object.entries(env).forEach(([key, val]) => {
        result = [...result.filter(e => e.name !== key), resFunc(key, val)];
    });
    return result;
}

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

function newDatabaseUsingSecret(resources, dbImageName, dbName, secretName, env, secretEnv) {
    if (resources.service(dbName).length == 0) {
        // Create the database resource definitions
        return newApp(dbName, dbImageName, env)
            .then((appRes) => setDeploymentEnvFromSecret(appRes, secretName, secretEnv))
            .then((appRes) => {
                const res = resources.add(appRes);
                console.log(`Database ${dbName} added`);
                return res;
            });
    } else {
        console.log(`Database ${dbName} already exists`);
    }
    return resources;
}

exports.resources = resources;
exports.newApp = newApp;
exports.setDeploymentEnvFromSecret = setDeploymentEnvFromSecret;
exports.newDatabaseUsingSecret = newDatabaseUsingSecret;
