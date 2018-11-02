
export async function apply(applyGenerator, resources, targetDir, props: any = {}) {
    // Create Secret holding Database connection/authentication information
    if (!resources.secret(props.secretName)) {
        const secret = {
            'kind': 'Secret',
            'apiVersion': 'v1',
            'metadata': {
                'name': props.secretName,
                'labels': {
                    'app': props.application,
                }
            },
            'stringData': {
                'uri': props.databaseUri,
                'database': props.databaseName,
                'user': 'dbuser',
                'password': 'secret',  // TODO generate pwd
            }
        };
        resources.add(secret);
        // console.log(`Secret ${props.secretName} added`);
    } else {
        // console.log(`Secret ${props.secretName} already exists`);
    }
    return resources;
}

export function info() {
    return require('./info.json');
}
