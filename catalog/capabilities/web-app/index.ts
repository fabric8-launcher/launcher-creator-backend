
import { BaseCapability } from 'core/catalog/types';

import PlatformReact from 'generators/platform-react';
import PlatformAngular from 'generators/platform-angular';
import PlatformVueJS from 'generators/platform-vuejs';

// Returns the corresponding framework generator depending on the given framework type
function frameworkByType(type) {
    if (type.name === 'react') {
        return PlatformReact;
    } else if (type.name === 'angular') {
        return PlatformAngular;
    } else if (type.name === 'vuejs') {
        return PlatformVueJS;
    } else {
        throw new Error(`Unsupported framework type: ${type.name}`);
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
            'framework': props.framework,
            'nodejs': {
                'name': props.application,
                'version': '1.0.0'
            }
        };
        return await this.generator(frameworkByType(props.framework)).apply(resources, rtprops, extra);
    }
}
