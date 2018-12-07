
import * as test from 'tape';
import { writeFileSync, readFileSync } from 'fs-extra';
import { fileSync } from 'tmp';
import {mergePoms, updateGav, updateMetadata, updateParentGav} from 'core/maven';

test('merge poms', (t) => {
    t.plan(1);

    // Write target (original) file
    const targetFile = fileSync();
    writeFileSync(targetFile.name,
        `<project>
            <dependencies>
                <dependency>
                    <groupId>a</groupId>
                    <artifactId>b</artifactId>
                    <version>1.0</version>
                </dependency>
            </dependencies>
        </project>`, 'utf8');

    // Write source file
    const sourceFile = fileSync();
    writeFileSync(sourceFile.name,
        `<project>
            <dependencies>
                <dependency>
                    <groupId>c</groupId>
                    <artifactId>d</artifactId>
                    <version>2.0</version>
                </dependency>
            </dependencies>
        </project>`, 'utf8');

    mergePoms(targetFile.name, sourceFile.name)
        .then(() => {
            const result = readFileSync(targetFile.name, 'utf8');
            const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<project>\n  <dependencies>\n    <dependency>\n      <groupId>a</groupId>\n      <artifactId>b</artifactId>\n      <version>1.0</version>\n    </dependency>\n    <dependency>\n      <groupId>c</groupId>\n      <artifactId>d</artifactId>\n      <version>2.0</version>\n    </dependency>\n  </dependencies>\n</project>\n\n';
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('update GAV', (t) => {
    t.plan(1);

    // Write target (original) file
    const targetFile = fileSync();
    writeFileSync(targetFile.name,
        `<project><groupId>empty</groupId><artifactId>empty</artifactId></project>`, 'utf8');

    updateGav(targetFile.name, 'foo', 'bar', '1.0')
        .then( () => {
            const result = readFileSync(targetFile.name, 'utf8');
            const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<project>\n  <groupId>foo</groupId>\n  <artifactId>bar</artifactId>\n  <version>1.0</version>\n</project>\n\n';
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('update parent GAV', (t) => {
    t.plan(1);

    // Write target (original) file
    const targetFile = fileSync();
    writeFileSync(targetFile.name,
        `<project><groupId>empty</groupId><artifactId>empty</artifactId></project>`, 'utf8');

    updateParentGav(targetFile.name, 'foo', 'bar')
        .then( () => {
            const result = readFileSync(targetFile.name, 'utf8');
            const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<project>\n  <groupId>empty</groupId>\n  <parent>\n    <artifactId>bar</artifactId>\n    <groupId>foo</groupId>\n  </parent>\n  <artifactId>empty</artifactId>\n</project>\n\n';
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});

test('update metadata', (t) => {
    t.plan(1);

    // Write target (original) file
    const targetFile = fileSync();
    writeFileSync(targetFile.name,
        `<project><groupId>empty</groupId><artifactId>empty</artifactId><version>1.0</version></project>`, 'utf8');

    updateMetadata(targetFile.name, 'my-name', 'my-description')
        .then( () => {
            const result = readFileSync(targetFile.name, 'utf8');
            const expected = '<?xml version="1.0" encoding="UTF-8"?>\n<project>\n  <groupId>empty</groupId>\n  <artifactId>empty</artifactId>\n  <version>1.0</version>\n  <name>my-name</name>\n  <description>my-description</description>\n</project>\n\n';
            t.is(result, expected);
        })
        .finally(() => targetFile.removeCallback());
});
