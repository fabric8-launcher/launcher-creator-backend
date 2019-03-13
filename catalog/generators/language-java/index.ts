
import { cases } from 'core/template/transformers/cases';
import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv,
    setDefaultHealthChecks, setDeploymentEnv,
    setMemoryResources
} from 'core/resources';

import { BaseGenerator, BaseGeneratorProps, Runtime } from 'core/catalog/types';
import MavenSetup, { MavenSetupProps } from 'generators/maven-setup';

export interface LanguageJavaProps extends BaseGeneratorProps, MavenSetupProps {
    builderImage: string;
    jarName?: string;
    env?: object;
}

export default class LanguageJava extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: LanguageJavaProps, extra: any = {}) {
        const jarName = props.jarName || props.maven.artifactId + '-' + props.maven.version + '.jar';
        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(MavenSetup).apply(resources, props, extra);
            await this.copy();
            await this.transform('gap', cases({ ...props, jarName }));
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
