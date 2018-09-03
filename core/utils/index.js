'use strict';

const path = require('path');

exports.moduleName = function (module) {
    const pkg = path.join(path.dirname(module.filename), "package.json");
    return path.basename(require(pkg).name);
};
