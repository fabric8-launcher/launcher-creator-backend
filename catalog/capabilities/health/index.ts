
import { BaseCapability, Runtime } from 'core/catalog/types';

import PlatformNodejs from 'generators/platform-nodejs';
import PlatformSpringBoot from 'generators/platform-springboot';
import PlatformThorntail from 'generators/platform-thorntail';
import PlatformVertx from 'generators/platform-vertx';
import PlatformWildfly from 'generators/platform-wildfly';
import PlatformQuarkus from 'generators/platform-quarkus';
import PlatformDotNet from 'generators/platform-dotnet';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(rt: Runtime) {
    switch (rt.name) {
        case 'dotnet': return PlatformDotNet;
        case 'nodejs': return PlatformNodejs;
        case 'quarkus': return PlatformQuarkus;
        case 'springboot': return PlatformSpringBoot;
        case 'thorntail' :  return PlatformThorntail;
        case 'vertx': return PlatformVertx;
        case 'wildfly' : return PlatformWildfly;
        case 'eap' : return PlatformWildfly;
        default:
            throw new Error(`Unsupported runtime type: ${rt.name}`);
    }
}

export default class Health extends BaseCapability {
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
            'nodejs': props.nodejs,
            'dotnet': props.dotnet
        };
        return await this.generator(runtimeByType(props.runtime)).apply(resources, rtprops, extra);
    }
}
