
import { BaseGenerator } from 'core/catalog/types';

export interface MavenCoords {
    groupId: string;
    artifactId: string;
    version: string;
}

export interface MavenSetupProps {
    maven: MavenCoords;
}

export default class MavenSetup extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: MavenSetupProps) {
        return await this.updateGav(props.maven.groupId, props.maven.artifactId, props.maven.version);
    }
}
