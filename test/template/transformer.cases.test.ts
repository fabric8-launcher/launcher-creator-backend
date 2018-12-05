
import * as test from 'tape';
import { writeFileSync, readFileSync } from 'fs-extra';
import { fileSync } from 'tmp';
import { transform } from 'core/template';
import { cases } from 'core/template/transformers/cases';

const testContents = `
    function connect(host) {
    //{{if .database == postgresql}}
        return ConnectionManager.connect("jdbc:postgresql" + host);
    //{{else if .database==mysql }}
    //    return ConnectionManager.connect("jdbc:mysql" + host);
    //{{else if .booleanOpt }}
    //    throw new Exception("Dummy option {{.booleanOpt}}");
    //{{else}}
    //    throw new Exception("Not implemented {{.nested.opt}}-{{.doesntexist}}-{{.undeffed}}-{{.nullish}}");
    //{{end}}
    }
`;

const resultPostgresql = `
    function connect(host) {
        return ConnectionManager.connect("jdbc:postgresql" + host);
    }
`;

const resultMysql = `
    function connect(host) {
        return ConnectionManager.connect("jdbc:mysql" + host);
    }
`;

const resultBool = `
    function connect(host) {
        throw new Exception("Dummy option true");
    }
`;

const resultElse = `
    function connect(host) {
        throw new Exception("Not implemented yet---");
    }
`;

test('transform cases compare 1', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    const props = { 'database': 'postgresql' };

    transform(targetFile.name, targetFile.name, cases(props))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultPostgresql;
            t.is(result, expected);
        });
});

test('transform cases compare 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    const props = {'database': 'mysql'};

    transform(targetFile.name, targetFile.name, cases(props))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultMysql;
            t.is(result, expected);
        });
});

test('transform cases exist', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    const props = {'booleanOpt': true};

    transform(targetFile.name, targetFile.name, cases(props))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultBool;
            t.is(result, expected);
        });
});

test('transform cases else', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    const props = { 'nested': { 'opt': 'yet' }, 'undeffed': undefined, 'nullish': null };

    transform(targetFile.name, targetFile.name, cases(props))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultElse;
            t.is(result, expected);
        });
});

test('transform line with double slashes', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, `
            function connect(host) {
            //{{if .database == postgresql}}
                return ConnectionManager.connect("jdbc:postgresql://" + host);
            //{{end}}
            }`, 'utf8');

    const props = {'database': 'postgresql'};

    transform(targetFile.name, targetFile.name, cases(props))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = `
            function connect(host) {
                return ConnectionManager.connect("jdbc:postgresql://" + host);
            }`;
            t.is(result, expected);
        });
});
