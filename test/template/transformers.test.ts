
import * as test from 'tape';
import { writeFileSync, readFileSync } from 'fs-extra';
import { fileSync } from 'tmp';
import { transform } from '../../lib/core/template';
import { cases } from '../../lib/core/template/transformers';

const testContents = `
    function connect(host) {
    //$$CASE:database:postgresql
        return ConnectionManager.connect("jdbc:postgresql" + host);
    //$$CASE:database:mysql
    //    return ConnectionManager.connect("jdbc:mysql" + host);
    //$$
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

test('transform cases option 1', (t) => {
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

test('transform cases option 2', (t) => {
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
