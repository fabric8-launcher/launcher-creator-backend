'use strict';

const _ = require('lodash');

class ValidationError extends Error {
    constructor(msg) {
        super(msg);
        this.msg = msg;
    }
}

function validateRequired(name, def, props) {
    if (def.required === true) {
        if (!props.hasOwnProperty(name)) {
            throw new ValidationError(`Missing property: '${name}'`);
        }
    }
}

function validateTypeEnum(name, def, props) {
    const val = props[name];
    if (!def.values.some(v => v.id === val)) {
        throw new ValidationError(`Invalid enumeration value for property '${name}': '${val}', should be one of: ${def.values.map(v => v.id)}`);
    }
}

function validateType(name, def, props) {
    if (def.type === 'enum') {
        validateTypeEnum(name, def, props);
    }
}

function validateProperty(name, def, props) {
    validateRequired(name, def, props);
    validateType(name, def, props);
}

function validate(info, props) {
    Object.entries(info.props).forEach(([name,def]) => validateProperty(name, def, props));
}

function printRequired(name, def) {
    if (def.required === false) {
        process.stdout.write(`(optional) `);
    }
}

function printEnumType(name, def) {
    process.stdout.write(def.description || def.name);
    process.stdout.write(`. Should be one of: ${def.values.map(v => v.id)}`);
}

function printType(name, def) {
    if (def.type === 'enum') {
        printEnumType(name, def);
    } else {
        process.stdout.write(def.description || def.name);
    }
}

function printProperty(name, def, namePad) {
    process.stdout.write(`        ${name.padEnd(namePad)} - `);
    printRequired(name, def);
    printType(name, def);
    process.stdout.write(`\n`);
}

function printUsage(info) {
    const maxLen = Math.max(13, Math.min(20, _.max(Object.entries(info.props).map(([name, def]) => name.length))));
    Object.entries(info.props).forEach(([name, def]) => printProperty(name, def, maxLen));
}

exports.validate = validate;
exports.printUsage = printUsage;
