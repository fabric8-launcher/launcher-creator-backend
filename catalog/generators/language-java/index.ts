
import { cases } from 'core/template/transformers/cases';
import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv,
    setDefaultHealthChecks, setDeploymentEnv,
    setMemoryResources
} from 'core/resources';

import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';

export interface LanguageJavaProps extends BaseGeneratorProps {
    builderImage: string;
    jarName?: string;
    binaryExt?: string;
    env?: object;
}

export default class LanguageJava extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: LanguageJavaProps, extra: any = {}) {
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform('gap', cases({ ...props }));
            const res = await newApp(
                props.serviceName,
                props.application,
                props.builderImage,
                null,
                props.env || {});
            setBuildContextDir(res, props.subFolderName);
            setMemoryResources(res, { 'limit': '1G' });
            setDefaultHealthChecks(res);
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
