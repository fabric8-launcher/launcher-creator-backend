
import { cases } from 'core/template/transformers/cases';
import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv,
    setDeploymentEnv
} from 'core/resources';

import { BaseGenerator, BaseGeneratorProps, Runtime } from 'core/catalog/types';

export interface LanguageCSharpProps extends BaseGeneratorProps {
    builderImage: string;
    env?: object;
}

export default class LanguageCSharp extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: LanguageCSharpProps, extra: any = {}) {
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.copy();
            await this.transform('gap', cases(props));
            await this.transform(['**/*.cs'], cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                props.builderImage,
                null,
                props.env || {});
            setBuildContextDir(res, props.subFolderName);
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
