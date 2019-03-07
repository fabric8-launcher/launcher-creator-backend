
import * as test from 'tape';
import { readFileSync, writeFileSync } from 'fs';
import { fileSync } from 'tmp-promise';
import { appendFile } from 'core/utils';

test('appendFile', async (t) => {
    t.plan(1);

    const testContents1 = `aap
noot
mies
`;

    const testContents2 = `wim
zus
jet
`;

    // Write test file 1
    const file1 = fileSync();
    writeFileSync(file1.name, testContents1, 'utf8');

    // Write test file 2
    const file2 = fileSync();
    writeFileSync(file2.name, testContents2, 'utf8');

    // Append contenst of file2 to file1
    await appendFile(file1.name, file2.name);

    // Read new contents of file1
    const contents = readFileSync(file1.name, 'utf8');

    t.equal(contents, testContents1 + testContents2);
});
