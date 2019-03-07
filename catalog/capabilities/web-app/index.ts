
import { BaseCapability } from 'core/catalog/types';

import PlatformReact from 'generators/platform-react';
import PlatformAngular from 'generators/platform-angular';
import PlatformVueJS from 'generators/platform-vuejs';

// Returns the corresponding runtime generator depending on the given runtime type
function runtimeByType(type) {
    switch (type.name) {
        case 'angular': return PlatformAngular;
        case 'react': return PlatformReact;
        case 'vuejs': return PlatformVueJS;
        default:
            throw new Error(`Unsupported runtime type: ${type.name}`);
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
            'nodejs': {
                'name': props.application,
                'version': '1.0.0'
            }
        };
        return await this.generator(runtimeByType(props.runtime)).apply(resources, rtprops, extra);
    }
}
