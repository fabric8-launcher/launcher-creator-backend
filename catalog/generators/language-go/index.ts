
import { cases } from 'core/template/transformers/cases';
import {
    newApp,
    newRoute, newService,
    setBuildContextDir,
    setBuildEnv,
    setDefaultHealthChecks, setDeploymentEnv,
    setMemoryResources
} from 'core/resources';

import { BaseGenerator, BaseGeneratorProps, Runtime } from 'core/catalog/types';

export interface LanguageGoProps extends BaseGeneratorProps {
    builderImage: string;
    env?: object;
}

export default class LanguageGo extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: LanguageGoProps, extra: any = {}) {
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform('gap', cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                props.builderImage,
                null,
                props.env || {});
            setBuildContextDir(res, props.subFolderName);
            setMemoryResources(res, { 'limit': '1024Mi' });
            setDefaultHealthChecks(res);
            resources.add(res);
            await newService(resources, props.application, props.application, props.serviceName);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
