import * as test from 'tape';
import { fileSync } from 'tmp';
import { writeFileSync, readFileSync } from 'fs-extra';
import { mergePackageJson } from 'core/nodejs';

test('update parent dependencies', (t) => {
  t.plan(1);

  // Write target (original) file
  const targetFile = fileSync();
  writeFileSync(targetFile.name,
    `{"name": "test", "dependencies": {"test": "1.0.0"}}`, 'utf8');

  // Write source file
  const sourceFile = fileSync();
  writeFileSync(sourceFile.name,
    `{"dependencies": {"super": "2.0.2"}}`, 'utf8');

  mergePackageJson(targetFile.name, sourceFile.name)
    .then(() => {
      const result = readFileSync(targetFile.name, 'utf8');
      const expected = '{\n  "name": "test",\n  "dependencies": {\n    "test": "1.0.0",\n    "super": "2.0.2"\n  }\n}';
      t.is(result, expected);
    })
    .finally(() => targetFile.removeCallback());

});
