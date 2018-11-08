
import * as _ from 'lodash';

class ValidationError extends Error {
    private msg: string;

    constructor(msg) {
        super(msg);
        this.msg = msg;
    }
}

class DefinitionError extends Error {
    private msg: string;

    constructor(msg) {
        super(msg);
        this.msg = msg;
    }
}

function validateRequired(id, def, props) {
    if (def.required === true) {
        if (!props.hasOwnProperty(id)) {
            if (def.default) {
                props[id] = def.default;
            } else {
                throw new ValidationError(`Missing property: '${id}'`);
            }
        }
    }
}

function validateTypeEnum(id, def, props) {
    if (!def.values || !Array.isArray(def.values) || def.values.length === 0) {
        throw new DefinitionError(`Missing enum values for property: '${id}'`);
    }
    const val = props[id];
    if (!def.values.some(v => v === val)) {
        throw new ValidationError(
            `Invalid enumeration value for property '${id}': '${val}', should be one of: ${def.values}`);
    }
}

function validateType(id, def, props) {
    if (def.type === 'enum') {
        validateTypeEnum(id, def, props);
    } else if (def.type === 'string' || !def.type) {
        // Nothing to validate here
    } else {
        throw new DefinitionError(`Unknown type '${def.type}' for property: '${id}'`);
    }
}

function validateProperty(id, def, props) {
    validateRequired(id, def, props);
    validateType(id, def, props);
}

export function validate(defs, props) {
    if (defs) {
        defs.forEach(def => validateProperty(def.id, def, props));
    }
}

function printRequired(id, def) {
    if (def.required === false) {
        process.stdout.write(`(optional) `);
    }
}

function printEnumType(id, def) {
    process.stdout.write(def.description || def.name);
    process.stdout.write(`. Should be one of: ${def.values}`);
}

function printType(id, def) {
    if (def.type === 'enum') {
        printEnumType(id, def);
    } else {
        process.stdout.write(def.description || def.name);
    }
}

function printProperty(id, def, namePad) {
    process.stdout.write(`        ${id.padEnd(namePad)} - `);
    printRequired(id, def);
    printType(id, def);
    process.stdout.write(`\n`);
}

export function printUsage(defs) {
    if (defs) {
        const maxLen = Math.max(13, Math.min(20, _.max(defs.map(def => def.id.length))));
        defs.forEach(def => printProperty(def.id, def, maxLen));
    }
}
