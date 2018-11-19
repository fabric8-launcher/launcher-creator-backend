
import { BaseGenerator } from 'core/catalog';

export default class MavenSetup extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: any = {}) {
        return await this.updateGav(props.maven.groupId, props.maven.artifactId, props.maven.version);
    }
}
