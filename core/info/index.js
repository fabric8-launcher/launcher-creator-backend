'use strict';

class ValidationError extends Error {
    constructor(msg) {
        super(msg);
        this.msg = msg;
    }
}

function validateRequired(name, def, props) {
    if (def.required === true) {
        if (!props.hasOwnProperty(name)) {
            throw new ValidationError(`Missing property: "${name}"`);
        }
    }
}

function validateTypeEnum(name, def, props) {
    const val = props[name];
    if (!def.values.some(v => v.id === val)) {
        throw new ValidationError(`Invalid enumeration value: "${name}", should be one of: ${def.values.map(v => v.id)}`);
    }
}

function validateType(name, def, props) {
    if (def.type === "enum") {
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
    if (def.type === "enum") {
        printEnumType(name, def);
    } else {
        process.stdout.write(def.description || def.name);
    }
}

function printProperty(name, def) {
    process.stdout.write(`    ${name} - `);
    printRequired(name, def);
    printType(name, def);
    process.stdout.write(`\n`);
}

function printUsage(info) {
    if (Object.entries(info.props).length > 0) {
        process.stdout.write(`json_props:\n`);
        Object.entries(info.props).forEach(([name, def]) => printProperty(name, def));
    }
}

exports.validate = validate;
exports.printUsage = printUsage;
