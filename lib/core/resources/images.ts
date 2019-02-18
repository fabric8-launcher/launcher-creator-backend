
import { Enum } from 'core/catalog/types';

export const BUILDER_JAVA = 'registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift';
export const BUILDER_NODEJS_APP = 'nodeshift/centos7-s2i-nodejs';
export const BUILDER_NODEJS_WEB = 'nodeshift/centos7-s2i-web-app';

export interface BuilderImage extends Enum {
    'metadata'?: {
        'language': string,
        'isBuilder': boolean
    };
}

export const builderImages: BuilderImage[] = [
    {
        'id': BUILDER_JAVA,
        'name': 'Java Code Builder',
        'metadata': {
            'language': 'java',
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
            'isBuilder': true
        }
    }
];

export const databaseImages: BuilderImage[] = [
    {
        'id': 'mysql',
        'name': 'MySQL Database'
    },
    {
        'id': 'postgresql',
        'name': 'PostgreSQL Database'
    }
];

export const images: BuilderImage[] = [
    ...databaseImages,
    ...builderImages
];

export function builderById(builderId: string): BuilderImage {
    return builderImages.find(e => e.id === builderId);
}

export function builderByLanguage(language: string): BuilderImage {
    return builderImages.find(e => e.metadata.language === language);
}
