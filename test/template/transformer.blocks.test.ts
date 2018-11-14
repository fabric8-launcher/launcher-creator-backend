
import * as test from 'tape';
import { fileSync } from 'tmp';
import { readFileSync, writeFileSync } from 'fs';
import { transform } from 'core/template';
import { blocks, id, insertAtStart, insertAtEnd } from 'core/template/transformers/blocks';

const testContentsEmpty = `
Consumer[] listConsumers() {
    return new Consumer[] {
    };
}`;

const testContentsWithEntries = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new FooConsumer(),
        new BarConsumer(),
        new BazConsumer()
    };
}`;

const startPattern = 'return new Consumer[]';
const endPattern = '};';

const insertedEntry = '        new SingleConsumer()';

const insertedEntryWithComma = '        new SingleConsumer(), ';

const insertedEntries = [
    '        new OneConsumer()',
    '        new TwoConsumer()'
];

const insertedEntriesWithCommas = [
    '        new OneConsumer()',
    '        new TwoConsumer()'
];

const resultInsertAtEndEmptySingle = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new SingleConsumer()
    };
}`;

const resultInsertAtEndEmptyMulti = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new OneConsumer(),
        new TwoConsumer()
    };
}`;

const resultInsertAtEndWithEntriesSingle = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new FooConsumer(),
        new BarConsumer(),
        new BazConsumer(),
        new SingleConsumer()
    };
}`;

const resultInsertAtEndWithEntriesMulti = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new FooConsumer(),
        new BarConsumer(),
        new BazConsumer(),
        new OneConsumer(),
        new TwoConsumer()
    };
}`;

const resultInsertAtStartEmptySingle = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new SingleConsumer()
    };
}`;

const resultInsertAtStartEmptyMulti = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new OneConsumer(),
        new TwoConsumer()
    };
}`;

const resultInsertAtStartWithEntriesSingle = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new SingleConsumer(),
        new FooConsumer(),
        new BarConsumer(),
        new BazConsumer()
    };
}`;

const resultInsertAtStartWithEntriesMulti = `
Consumer[] listConsumers() {
    return new Consumer[] {
        new OneConsumer(),
        new TwoConsumer(),
        new FooConsumer(),
        new BarConsumer(),
        new BazConsumer()
    };
}`;

test('transform blocks id empty', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, id()))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = testContentsEmpty;
            t.is(result, expected);
        });
});

test('transform blocks id entries', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, id()))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = testContentsWithEntries;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd empty single', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntry)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndEmptySingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd empty single 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntryWithComma)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndEmptySingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd empty multi', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntries)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndEmptyMulti;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd empty multi 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntriesWithCommas)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndEmptyMulti;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd entries single', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntry)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndWithEntriesSingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd entries single 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntryWithComma)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndWithEntriesSingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd entries multi', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntries)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndWithEntriesMulti;
            t.is(result, expected);
        });
});

test('transform blocks insertAtEnd entries multi 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtEnd(insertedEntriesWithCommas)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtEndWithEntriesMulti;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart empty single', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntry)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartEmptySingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart empty single 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntryWithComma)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartEmptySingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart empty multi', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntries)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartEmptyMulti;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart empty multi 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsEmpty, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntriesWithCommas)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartEmptyMulti;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart entries single', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntry)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartWithEntriesSingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart entries single 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntryWithComma)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartWithEntriesSingle;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart entries multi', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntries)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartWithEntriesMulti;
            t.is(result, expected);
        });
});

test('transform blocks insertAtStart entries multi 2', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContentsWithEntries, 'utf8');

    transform(targetFile.name, targetFile.name, blocks(startPattern, endPattern, insertAtStart(insertedEntriesWithCommas)))
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = resultInsertAtStartWithEntriesMulti;
            t.is(result, expected);
        });
});
