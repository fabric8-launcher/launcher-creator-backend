
import * as test from 'tape';
import { fileSync } from 'tmp';
import { readFileSync, writeFileSync } from 'fs';
import { transform } from 'core/template';
import { replace } from 'core/template/transformers/replace';

const testContents = `The first line.
The second line.
The third line.`;

const replacedLine = 'The replaced line.';

const replacedLines = [
    'These are several',
    'replaced lines.'
];

const resultReplaceStringLine = `The first line.
The replaced line.
The third line.`;

const resultReplaceStringLines = `The first line.
These are several
replaced lines.
The third line.`;

const resultReplaceStringLineAtStart = `The replaced line.
The second line.
The third line.`;

const resultReplaceStringLineAtEnd = `The first line.
The second line.
The replaced line.`;

const resultReplaceRegExpLine = `The first line.
The replaced line.
The replaced line.`;

const resultReplaceRegExpLines = `These are several
replaced lines.
These are several
replaced lines.
These are several
replaced lines.`;

const resultReplaceRexExpEmpty = '';

test('transform replace string line', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, replace('second', replacedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultReplaceStringLine;
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('transform replace string lines', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, replace('second', replacedLines))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultReplaceStringLines;
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('transform replace string line at start', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, replace('first', replacedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultReplaceStringLineAtStart;
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('transform replace string line at end', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, replace('third', replacedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultReplaceStringLineAtEnd;
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('transform replace regexp line', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, replace(/d/, replacedLine))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultReplaceRegExpLine;
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('transform replace regexp lines', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, replace(/line/, replacedLines))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultReplaceRegExpLines;
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('transform replace regexp empty', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, replace(/line/, []))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultReplaceRexExpEmpty;
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});
