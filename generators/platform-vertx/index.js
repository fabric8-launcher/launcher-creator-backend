'use strict';

const fs = require('fs-extra');
const path = require('path');
const newApp = require('@core/resources').newApp;

exports.apply = function(targetDir, props={}) {
    return fs.copy(path.join(__dirname, "files"), targetDir);
}

exports.generate = function(resources, targetDir, props = {}) {
    return newApp("dummy-name-vertx", "registry.access.redhat.com/redhat-openjdk-18/openjdk18-openshift~.", {}, targetDir)
        .then(res => resources.add(res));
};

exports.info = function () {
    return require("./info.json");
};
