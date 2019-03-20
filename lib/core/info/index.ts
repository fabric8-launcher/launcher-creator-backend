
import * as _ from 'lodash';
import { Enums } from 'core/catalog/types';

export interface PropertyDef {
    id: string;
    name: string;
    description?: string;
    type?: string;
    required?: boolean;
    default?: any;
    shared?: boolean;
    enabledWhen?: {
        propId: string;
        equals: any[];
    };
}

interface EnumPropertyDef extends PropertyDef {
    enumRef?: string;
    values?: any[];
}

interface PropertiesDef {
    props: PropertyDef[];
}

interface ObjectPropertyDef extends PropertyDef, PropertiesDef {
}

export interface InfoDef extends PropertiesDef {
    type: string;
    name: string;
    description?: string;
    metadata: {
        category: string;
        icon?: string;
    };
}

export interface ModuleInfoDef extends InfoDef {
    module: string;
}

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

export function findProperty(pdef: PropertiesDef, path: string): PropertyDef {
    const elems = path.split('.');
    const res = elems.reduce((acc, cur) => {
        if (!!acc && !!acc.props) {
            return acc.props.find(p => p.id === cur) as ObjectPropertyDef;
        } else {
            return null;
        }
    }, pdef);
    return res as ObjectPropertyDef;
}

export function findPropertyValues(pdef: PropertiesDef, path: string, enums: Enums): any[] {
    const p = findProperty(pdef, path) as EnumPropertyDef;
    if (!!p && !!p.values) {
        return getValues(path, p, enums);
    } else {
        return [];
    }
}

export function findPropertyWithValue(pdef: PropertiesDef, path: string, value: any, enums: Enums): EnumPropertyDef {
    const p = findProperty(pdef, path) as EnumPropertyDef;
    if (!!p && !!p.values) {
        const values = getValues(path, p, enums);
        if (values.includes(value)) {
            return p;
        }
    }
    return null;
}

function validateRequired(id: string, def: PropertyDef, enums: Enums, props: object) {
    if (def.required === true) {
        if (!_.has(props, id)) {
            if (def.default) {
                _.set(props, id, def.default);
            } else {
                if (def.type !== 'object' || !(def as ObjectPropertyDef).props) {
                    throw new ValidationError(`Missing property: '${id}'`);
                }
            }
        }
    }
}

function validateTypeEnum(id: string, def: EnumPropertyDef, enums: Enums, props: object) {
    const values = getValues(id, def, enums, props);
    if (_.has(props, id)) {
        const val = _.get(props, id);
        if (!values.some(v => v === val)) {
            throw new ValidationError(
                `Invalid enumeration value for property '${id}': '${val}', should be one of: ${values}`);
        }
    }
}

function validateTypeObject(id: string, def: ObjectPropertyDef, props: object) {
    if (_.has(props, id)) {
        const val = _.get(props, id);
        if (typeof(val) !== 'object') {
            throw new ValidationError(
                `Invalid value for property '${id}': '${val}'`);
        }
    }
}

function getValues(id: string, def: EnumPropertyDef, enums: Enums, props?: object): any[] {
    if (!!def.values) {
        if (!Array.isArray(def.values) || def.values.length === 0) {
            throw new DefinitionError(`Missing or invalid 'values' for property: '${id}'`);
        }
        return def.values;
    } else {
        const ref = replaceProps(def.enumRef || id, props);
        const values = enums[ref];
        if (!values) {
            if (!ref.includes('${') || !!props) {
                if (!!def.enumRef) {
                    throw new DefinitionError(`Invalid value '${ref}' as 'enumRef' for property: '${id}'`);
                } else {
                    throw new DefinitionError(`Missing 'values' or 'enumRef' for property: '${id}'`);
                }
            }
        }
        return values.map(v => v.id);
    }
}

function replaceProps(ref: string, props?: object) {
    const re = new RegExp('\\${([a-zA-Z0-9-.]+)}', 'g');
    return ref.replace(re, (match, id) => _.get(props, id));
}

function validateType(id: string, def: PropertyDef, enums: Enums, props: object) {
    if (def.type === 'enum') {
        validateTypeEnum(id, def as EnumPropertyDef, enums, props);
    } else if (def.type === 'object') {
        validateTypeObject(id, def as ObjectPropertyDef, props)
    } else if (def.type === 'string' || !def.type) {
        // Nothing to validate here
    } else {
        throw new DefinitionError(`Unknown type '${def.type}' for property: '${id}'`);
    }
}

function validateProperty(id: string, def: PropertyDef, enums: Enums, props: object) {
    validateRequired(id, def, enums, props);
    validateType(id, def, enums, props);
}

export function validatePossibleObject(id: string, def: PropertyDef, enums: Enums, props: object) {
    if (isEnabled(id, def, props)) {
        validateProperty(id, def, enums, props);
        if (def.type === 'object') {
            const objdef = def as ObjectPropertyDef;
            !!objdef.props && objdef.props.forEach(def2 => validatePossibleObject(id + '.' + def2.id, def2, enums, props));
        }
    }
}

function isEnabled(id: string, def: PropertyDef, props: object) {
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

export function validate(defs: PropertyDef[], enums: Enums, props: object) {
    if (defs) {
        defs.forEach(def => validatePossibleObject(def.id, def, enums, props));
    }
}

function printRequired(id: string, def: PropertyDef) {
    if (def.required === false) {
        process.stdout.write(`(optional) `);
    }
}

function printEnumType(id: string, def: EnumPropertyDef, enums: Enums) {
    const values = getValues(id, def, enums);
    process.stdout.write(def.description || def.name);
    process.stdout.write(`. Should be one of: ${values}`);
}

function printType(id: string, def: PropertyDef, enums: Enums) {
    if (def.type === 'enum') {
        printEnumType(id, def, enums);
    } else {
        process.stdout.write(def.description || def.name);
    }
}

function printProperty(id: string, def: PropertyDef, enums: Enums, indent: number, namePad: number) {
    process.stdout.write(`${' '.repeat(indent)}${id.padEnd(namePad)} - `);
    printRequired(id, def);
    printType(id, def, enums);
    process.stdout.write(`\n`);
}

function printPossibleObject(id: string, def: PropertyDef, enums: Enums, indent: number, namePad: number) {
    printProperty(id, def, enums, indent, namePad);
    if (def.type === 'object') {
        const objdef = def as ObjectPropertyDef;
        const maxLen = Math.max(13, Math.min(20, _.max(objdef.props.map(def2 => def2.id.length))));
        !!objdef.props && objdef.props.forEach(def2 => printPossibleObject(def2.id, def2, enums, indent + 3, maxLen));
    }
}

export function printUsage(defs: PropertyDef[], enums: Enums) {
    if (defs) {
        const maxLen = Math.max(13, Math.min(20, _.max(defs.map(def => def.id.length))));
        defs.forEach(def => printPossibleObject(def.id, def, enums, 8, maxLen));
    }
}
