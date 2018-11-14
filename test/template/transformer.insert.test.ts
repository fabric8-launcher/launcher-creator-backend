
import * as test from 'tape';
import { fileSync } from 'tmp';
import { readFileSync, writeFileSync } from 'fs';
import { transform } from 'core/template';
import { insertBefore, insertAfter } from 'core/template/transformers/insert';

const testContents = `The first line.
The second line.
The third line.`;

const insertedLine = 'The inserted line.';

const insertedLines = [
    'These are several',
    'inserted lines.'
];

const resultAfterStringLine = `The first line.
The second line.
The inserted line.
The third line.`;

const resultAfterStringLines = `The first line.
The second line.
These are several
inserted lines.
The third line.`;

const resultAfterStringLineAtEnd = `The first line.
The second line.
The third line.
The inserted line.`;

const resultAfterRegExpLine = `The first line.
The second line.
The inserted line.
The third line.
The inserted line.`;

const resultBeforeStringLine = `The first line.
The inserted line.
The second line.
The third line.`;

const resultBeforeStringLines = `The first line.
These are several
inserted lines.
The second line.
The third line.`;

const resultBeforeStringLineAtStart = `The inserted line.
The first line.
The second line.
The third line.`;

const resultBeforeRegExpLine = `The first line.
The inserted line.
The second line.
The inserted line.
The third line.`;

test('transform insertAfter string line', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertAfter('second', insertedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultAfterStringLine;
            t.is(result, expected);
        });
});

test('transform insertAfter string lines', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertAfter('second', insertedLines))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultAfterStringLines;
            t.is(result, expected);
        });
});

test('transform insertAfter string line at end', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertAfter('third', insertedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultAfterStringLineAtEnd;
            t.is(result, expected);
        });
});

test('transform insertAfter regexp line', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertAfter(/d/, insertedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultAfterRegExpLine;
            t.is(result, expected);
        });
});

test('transform insertBefore string line', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertBefore('second', insertedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultBeforeStringLine;
            t.is(result, expected);
        });
});

test('transform insertBefore string lines', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertBefore('second', insertedLines))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultBeforeStringLines;
            t.is(result, expected);
        });
});

test('transform insertBefore string line at start', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertBefore('first', insertedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultBeforeStringLineAtStart;
            t.is(result, expected);
        });
});

test('transform insertBefore regexp line', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, insertBefore(/d/, insertedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultBeforeRegExpLine;
            t.is(result, expected);
        });
});
