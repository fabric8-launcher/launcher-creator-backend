
import * as test from 'tape';
import { fileSync } from 'tmp';
import { readFileSync, writeFileSync } from 'fs';
import { transform } from 'core/template';
import { id } from 'core/template/transformers/id';

const testContents = `The first line.
The second line.
The third line.`;


test('transform id', (t) => {
    t.plan(1);

    // Write test file
    const targetFile = fileSync();
    writeFileSync(targetFile.name, testContents, 'utf8');

    transform(targetFile.name, targetFile.name, id())
        .then((tfn: string) => {
            const result = readFileSync(tfn, 'utf8');
            const expected = testContents;
            t.is(result, expected);
        });
});
