
import { cases } from 'core/template/transformers/cases';
import { BaseGenerator, BaseGeneratorProps, BasePlatformExtra } from 'core/catalog/types';
import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv, setCpuResources, setDeploymentEnv,
    setMemoryResources,
    setPathHealthChecks
} from 'core/resources';
import { BUILDER_NODEJS_APP } from 'core/resources/images';

export interface LanguageNodejsProps extends BaseGeneratorProps {
    builderImage: string;
    env?: object;
}

export interface LanguageNodejsExtra extends BasePlatformExtra {
}

export default class LanguageNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: LanguageNodejsProps, extra: any = {}) {
        // Check if the gap file already exists, so we don't copy it twice
        if (!await this.filesCopied()) {
            await this.copy();
            await this.transform('gap', cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                props.builderImage || BUILDER_NODEJS_APP,
                null,
                props.env || {});
            setBuildContextDir(res, props.subFolderName);
            setMemoryResources(res, { 'limit': '100Mi' });
            setCpuResources(res, { 'limit': '50m' });
            setPathHealthChecks(res, '/', '/');
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
