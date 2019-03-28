
import * as _ from 'lodash';
import { setDefaultHealthChecks, setMemoryResources } from 'core/resources';
import { enumItem } from 'core/catalog';
import { BaseGenerator, BasePlatformExtra, DotNetCoords } from 'core/catalog/types';
import { BUILDER_DOTNET } from 'core/resources/images';

import PlatformBaseSupport from 'generators/platform-base-support';
import LanguageCSharp, { LanguageCSharpProps } from 'generators/language-csharp';

import { cases } from 'core/template/transformers/cases';

export interface PlatformDotNetProps extends LanguageCSharpProps {
    dotnet: DotNetCoords;
}

export interface PlatformDotNetExtra extends BasePlatformExtra {
}

export default class PlatformDotNet extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: PlatformDotNetProps, extra: any = {}) {
        const exProps: PlatformDotNetExtra = {
            'image': BUILDER_DOTNET,
            'enumInfo': enumItem('runtime.name', 'dotnet'),
            'service': props.serviceName,
            'route': props.routeName,
        };
        _.set(extra, 'shared.runtimeInfo', exProps);

        const lprops: LanguageCSharpProps = { ...props, 'builderImage': BUILDER_DOTNET };

        // Check if the service already exists, so we don't create it twice
        if (!resources.service(props.serviceName)) {
            await this.generator(PlatformBaseSupport).apply(resources, props, extra);
            await this.copy();
            await this.transform('**/*.cs', cases(props));
            await this.transform('files.csproj', cases(props));
            await this.move('files.csproj', props.application + '.csproj');
        }
        await this.generator(LanguageCSharp).apply(resources, lprops, extra);
        setMemoryResources(resources, { 'limit': '512M' }, props.serviceName);
        setDefaultHealthChecks(resources, props.serviceName);
        return resources
    }
}
