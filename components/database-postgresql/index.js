'use strict';

const exec = require('child-process-promise').exec;

exports.apply = function(appName, componentName, targetDir) {

/*
# Copy files
cp -a $SOURCE_DIR/deploy $TARGET_DIR

# Generate "env" file with component properties
cat > $TARGET_DIR/env << __EOF__
APP_NAME=$APP_NAME
COMPONENT_NAME=$COMPONENT_NAME
SECRET_NAME=$COMPONENT_NAME-bind
DB_NAME=$COMPONENT_NAME
__EOF__
 */
}

exports.deploy = function(secretName, dbName) {
    // Create the PostgreSQL DB service
    const USRENV = `{"name":"POSTGRESQL_USER","valueFrom":{"secretKeyRef":{"name":"'${secretName}'","key":"user"}}}`;
    const PWDENV = `{"name":"POSTGRESQL_PASSWORD","valueFrom":{"secretKeyRef":{"name":"'${secretName}'","key":"password"}}}`;
    const QUERY = `(.items[] | select(.kind == "DeploymentConfig") | .spec.template.spec.containers[0].env)`;
    exec(`oc get service ${dbName}`)
        .then((result) => {
            console.log(`Database ${dbName} already exists`);
        })
        .catch((error) => {
            exec(`oc new-app \
            --name=${dbName} \
            -ePOSTGRESQL_DATABASE=my_data \
            postgresql \
            --dry-run \
            -o json | \
            jq "$QUERY += [${USRENV},${PWDENV}]" | \
            oc apply -f -`)
                .then((result) => {
                    console.log("Database ${dbName} created");
                })
                .catch((error) => {
                    console.error(`Exec error: ${error}`);
                });
        })
}

