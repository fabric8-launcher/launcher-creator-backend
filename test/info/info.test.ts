
import * as test from 'tape';
import * as info from 'core/info';
import { Enums } from 'core/catalog';

const def = [
    {
        'id': 'databaseType',
        'name': 'Database Type',
        'description': 'The type of database to use',
        'required': true,
        'type': 'enum',
        'values': [
            'postgresql',
            'mysql'
        ],
        'default': 'postgresql'
    },
    {
        'id': 'runtime',
        'name': 'Runtime Type',
        'description': 'The type of runtime to use',
        'required': true,
        'type': 'enum',
        'values': [
            'nodejs',
            'springboot',
            'thorntail',
            'vertx'
        ]
    },
    {
        'id': 'version',
        'name': 'Runtime Version',
        'description': 'The version of runtime to use',
        'type': 'enum',
        'enumRef': 'version.${runtime}'
    },
    {
        'id': 'type',
        'name': 'Some Type',
        'description': 'The type to use',
        'required': true,
        'type': 'enum',
        'enumRef': 'type',
        'default': 'type1'
    },
    {
        'id': 'maven',
        'name': 'Maven Project Setting',
        'description': 'The ids and version to use for the Maven project',
        'required': true,
        'shared': true,
        'enabledWhen': {
            'propId': 'runtime',
            'equals': [
                'vertx'
            ]
        },
        'type': 'object',
        'props': [
            {
                'id': 'groupId',
                'name': 'Group Id',
                'description': 'The Maven Group Id for the project',
                'required': true,
                'type': 'string',
                'default': 'org.openshift.appgen'
            }
        ]
    }
];

const enums: Enums = {
    'type': [{
        'id': 'type1',
        'name': 'Type 1'
    }],
    'version.vertx': [{
        'id': 'v1',
        'name': 'Vert.x Version 1'
    }],
    'version.nodejs': [{
        'id': 'ver1',
        'name': 'Node Version 1'
    }]
};

test('info validate all ok', (t) => {
    t.plan(1);

    const props = {
        'databaseType': 'mysql',
        'runtime': 'vertx',
        'version': 'v1',
        'type': 'type1',
        'maven': {
            'groupId': 'xxx'
        }
    };

    t.doesNotThrow(() => info.validate(def, enums, props));
});

test('info validate using default maven', (t) => {
    t.plan(3);

    const props = {
        'runtime': 'vertx',
    };

    t.doesNotThrow(() => info.validate(def, enums, props));
    t.isEqual(props['databaseType'], 'postgresql');
    t.isEqual(props['maven']['groupId'], 'org.openshift.appgen');
});

test('info validate using default nodejs', (t) => {
    t.plan(3);

    const props = {
        'runtime': 'nodejs'
    };

    t.doesNotThrow(() => info.validate(def, enums, props));
    t.isEqual(props['databaseType'], 'postgresql');
    t.isEqual(props['maven'], undefined);
});

test('info validate invalid enum value', (t) => {
    t.plan(1);

    const props = {
        'databaseType': 'WRONG',
        'runtime': 'vertx',
        'maven': {
            'groupId': 'xxx'
        }
    };

    t.throws(() => info.validate(def, enums, props), /Invalid enumeration value/);
});

test('info validate missing required', (t) => {
    t.plan(1);

    const props = {
        'databaseType': 'mysql',
        'maven': {
            'groupId': 'xxx'
        }
    };

    t.throws(() => info.validate(def, enums, props), /Missing property/);
});

test('info validate definition wrong type', (t) => {
    t.plan(1);

    const wrongTypeDef = [
        {
            'id': 'version',
            'name': 'Version',
            'description': 'The Maven Version for the project',
            'required': true,
            'type': 'WRONG',
            'default': '1.0'
        }
    ];

    const props = {
        'version': '2.0'
    };

    t.throws(() => info.validate(wrongTypeDef, enums, props), /Unknown type/);
});

test('info validate definition missing enum values', (t) => {
    t.plan(3);

    const wrongEnumDef1 = [
        {
            'id': 'databaseType',
            'name': 'Database Type',
            'description': 'The type of database to use',
            'required': true,
            'type': 'enum',
            'values': [
            ],
            'default': 'postgresql'
        }
    ];

    const wrongEnumDef2 = [
        {
            'id': 'databaseType',
            'name': 'Database Type',
            'description': 'The type of database to use',
            'required': true,
            'type': 'enum',
            'values': {},
            'default': 'postgresql'
        }
    ];

    const wrongEnumDef3 = [
        {
            'id': 'databaseType',
            'name': 'Database Type',
            'description': 'The type of database to use',
            'required': true,
            'type': 'enum',
            'default': 'postgresql'
        }
    ];

    const props = {
        'databaseType': 'dummy'
    };

    t.throws(() => info.validate(wrongEnumDef1, enums, props), /Missing or invalid 'values'/);
    t.throws(() => info.validate(wrongEnumDef2, enums, props), /Missing or invalid 'values'/);
    t.throws(() => info.validate(wrongEnumDef3, enums, props), /Missing 'values' or 'enumRef'/);
});
