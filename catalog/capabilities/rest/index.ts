import { BaseCapability, Runtime } from 'core/catalog/types';

import RestVertx from 'generators/rest-vertx';
import RestSpring from 'generators/rest-springboot';
import RestGo from 'generators/rest-go';
import RestNodejs from 'generators/rest-nodejs';
import RestThorntail from 'generators/rest-thorntail';
import RestWildfly from 'generators/rest-wildfly';
import RestQuarkus from 'generators/rest-quarkus';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(rt: Runtime) {
    switch (rt.name) {
        case 'nodejs': return RestNodejs;
        case 'quarkus': return RestQuarkus;
        case 'springboot': return RestSpring;
        case 'thorntail' :  return RestThorntail;
        case 'vertx': return RestVertx;
        case 'wildfly' : return RestWildfly;
        case 'go' : return RestGo;
        default:
            throw new Error(`Unsupported runtime type: ${rt.name}`);
    }
}

export default class Rest extends BaseCapability {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props, extra) {
        const appName = this.name(props.application, props.subFolderName);
        const rtServiceName = appName;
        const rtRouteName = appName;
        const rtprops = {
            'application': props.application,
            'subFolderName': props.subFolderName,
            'serviceName': rtServiceName,
            'routeName': rtRouteName,
            'runtime': props.runtime,
            'maven': props.maven,
            'nodejs': props.nodejs
        };
        return await this.generator(runtimeByType(props.runtime)).apply(resources, rtprops, extra);
    }
}
