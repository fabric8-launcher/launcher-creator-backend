
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
        if (!_.has(props, id)) {
            if (def.default) {
                _.set(props, id, def.default);
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
    const val = _.get(props, id);
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

export function validatePossibleObject(id, def, props) {
    if (isEnabled(id, def, props)) {
        if (def.type === 'object') {
            def.props.forEach(def2 => validatePossibleObject(id + '.' + def2.id, def2, props));
        } else {
            validateProperty(id, def, props);
        }
    }
}

function isEnabled(id, def, props) {
    if (def.hasOwnProperty('enabledWhen')) {
        const fld = def.enabledWhen.propId;
        if (!fld) {
            throw new DefinitionError(`Missing 'enabledWhen.propId' for property: '${id}'`);
        }
        const eq = def.enabledWhen.equals;
        if (!eq || !Array.isArray(eq) || eq.length === 0) {
            throw new DefinitionError(`Missing 'enabledWhen.propId' for property: '${id}'`);
        }
        const value = _.get(props, fld);
        return eq.includes(value);
    } else {
        return true;
    }
}

export function validate(defs, props) {
    if (defs) {
        defs.forEach(def => validatePossibleObject(def.id, def, props));
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

function printProperty(id, def, indent, namePad) {
    process.stdout.write(`${' '.repeat(indent)}${id.padEnd(namePad)} - `);
    printRequired(id, def);
    printType(id, def);
    process.stdout.write(`\n`);
}

function printPossibleObject(id, def, indent, namePad) {
    printProperty(id, def, indent, namePad);
    if (def.type === 'object') {
        const maxLen = Math.max(13, Math.min(20, _.max(def.props.map(def2 => def2.id.length))));
        def.props.forEach(def2 => printPossibleObject(def2.id, def2, indent + 3, maxLen));
    }
}

export function printUsage(defs) {
    if (defs) {
        const maxLen = Math.max(13, Math.min(20, _.max(defs.map(def => def.id.length))));
        defs.forEach(def => printPossibleObject(def.id, def, 8, maxLen));
    }
}
