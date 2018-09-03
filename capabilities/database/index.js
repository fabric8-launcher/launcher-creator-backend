'use strict';

const moduleName = require("@core/utils").moduleName;
const deploy = require("@core/deploy");

exports.apply = function(appName, targetDir, props) {
    const deploymentFile = deploy.deploymentFile(targetDir);
    deploy.readDeployment(deploymentFile)
        .then((deployment) => {
            const id = props.id || deploy.uniqueName(deployment, moduleName(module));
            const dbprops = {
                databaseName: "my_data",
                secretName: id + "-bind",
            };

            // Returns the corresponding database generator depending on the given database type
            function databaseByType(type) {
                if (type === "postgresql") {
                    return {
                        name: "database-postgresql",
                        props: require("@generators/database-postgresql").apply(appName, targetDir, props, dbprops)
                    };
                } else if (type === "mysql") {
                    return {
                        name: "database-mysql",
                        props: require("@generators/database-mysql").apply(appName, targetDir, props, {databaseUri: id, ...dbprops})
                    };
                } else {
                    throw `Unknown daytabase type: ${type}`;
                }
            }

            const cap = {
                props: props,
                generators: [
                    {
                        name: "database-secret",
                        props: require("@generators/database-secret").apply(appName, targetDir, props, dbprops)
                    },
                    databaseByType(props.databaseType),
                ]
            };
            const newDeployment = deploy.addCapability(deployment, id, cap);
            return deploy.writeDeployment(deploymentFile, deployment)
                .then(() => newDeployment);
        })
};

exports.info = function() {
    return {
        description: "Adds Database capability to the user's project",
        props: {
            id: {
                type: "string"
            },
            databaseType: {
                enum: [{
                    id: "postgresql",
                    name: "PostgreSQL"
                }, {
                    id: "mysql",
                    name: "mySQL"
                }]
            },
            runtime: {
                enum: [{
                    id: "nodejs",
                    name: "Node.js"
                }, {
                    id: "springboot",
                    name: "Spring Boot"
                }, {
                    id: "thorntail",
                    name: "Thorntail"
                }, {
                    id: "vertx",
                    name: "Vert.x"
                }]
            }
        }
    };
};
