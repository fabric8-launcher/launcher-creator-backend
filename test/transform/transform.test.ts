
import * as test from 'tape';
import { writeFileSync, readFileSync } from 'fs-extra';
import { fileSync } from 'tmp';
import { transform } from '../../lib/core/template';
import { pipe2 as pipe } from '../../lib/core/utils';

const testContents =
    `0123456789
     56789
     56789
0123456789

0123456789
0123456789

0123456789
     56789
`;

test('transform identity', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    // ID "transformer" that just returns the input unchanged
    const id = (line: string) => line;

    transform(targetFile.name, targetFile.name, id)
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = testContents;
            t.is(result, expected);
        });
});

test('transform no blank lines', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    // Transformer that only returns non-empty lines
    const nonempty = (line: string) => line || null;

    transform(targetFile.name, targetFile.name, nonempty)
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected =
                `0123456789
     56789
     56789
0123456789
0123456789
0123456789
0123456789
     56789
`;
            t.is(result, expected);
        });
});

test('transform chaining', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    // Transformer that only returns non-empty lines
    let prev;
    const dedup = (line: string) => (line !== prev) ? prev = line : null;
    const nonempty = (line: string) => line || null;

    transform(targetFile.name, targetFile.name, pipe(nonempty, dedup))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected =
                `0123456789
     56789
0123456789
     56789
`;
            t.is(result, expected);
        });
});

test('transform empty', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    // Nil "transformer" that drops everything
    const nil = (line: string) => null;

    transform(targetFile.name, targetFile.name, nil)
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = ``;
            t.is(result, expected);
        });
});
