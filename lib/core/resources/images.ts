
import { Enum } from 'core/catalog/types';

export const BUILDER_DOTNET = 'registry.access.redhat.com/dotnet/dotnet-22-rhel7';
export const BUILDER_JAVA = 'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift';
export const BUILDER_JAVAEE = 'openshift/wildfly:latest';
export const BUILDER_JAVAEE_PRO = 'registry.access.redhat.com/jboss-eap-7/eap72-openshift';
export const BUILDER_NODEJS_APP = 'nodeshift/centos7-s2i-nodejs';
export const BUILDER_NODEJS_WEB = 'nodeshift/centos7-s2i-web-app';

export const IMAGE_MYSQL = 'mysql';
export const IMAGE_POSTGRESQL = 'postgresql';

export const MARKER_BOOSTER_IMPORT = '#booster-import#';

export interface BuilderImage extends Enum {
    'metadata'?: {
        'language'?: string,
        'binaryExt'?: string
        'isBuilder'?: boolean
        'suggestedEnv'?: object
    };
}

export const builderImages: BuilderImage[] = [
    {
        'id': BUILDER_DOTNET,
        'name': '.NET Core Code Builder',
        'metadata': {
            'language': 'csharp',
            'isBuilder': true
        }
    },
    {
        'id': BUILDER_JAVA,
        'name': 'Java Code Builder',
        'metadata': {
            'language': 'java',
            'binaryExt': 'jar',
            'isBuilder': true
        }
    },
    {
        'id': BUILDER_JAVAEE,
        'name': 'JavaEE Code Builder',
        'metadata': {
            'language': 'java',
            'binaryExt': 'war',
            'isBuilder': true,
            'suggestedEnv': {
                'ARTIFACT_DIR': 'target'
            }
        }
    },
    {
        'id': BUILDER_JAVAEE_PRO,
        'name': 'JavaEE Code Builder',
        'metadata': {
            'language': 'java',
            'binaryExt': 'war',
            'isBuilder': true
        }
    },
    {
        'id': BUILDER_NODEJS_WEB,
        'name': 'Web App Node.js Code Builder',
        'metadata': {
            'language': 'nodejs',
            'isBuilder': true
        }
    },
    {
        'id': BUILDER_NODEJS_APP,
        'name': 'Generic Node.js Code Builder',
        'metadata': {
            'language': 'nodejs',
            'isBuilder': true,
            'suggestedEnv': {
                'PORT': '8080'
            }
        }
    }
];

export const databaseImages: BuilderImage[] = [
    {
        'id': IMAGE_MYSQL,
        'name': 'MySQL Database'
    },
    {
        'id': IMAGE_POSTGRESQL,
        'name': 'PostgreSQL Database'
    }
];

export const images: BuilderImage[] = [
    ...databaseImages,
    ...builderImages
];

export const markerBoosterImport: BuilderImage = {
    'id': MARKER_BOOSTER_IMPORT,
    'name': 'Launcher Example Application'
};

export function builderById(builderId: string): BuilderImage {
    return builderImages.find(e => e.id === builderId);
}

export function builderByLanguage(language: string): BuilderImage {
    return builderImages.find(e => e.metadata.language === language);
}
