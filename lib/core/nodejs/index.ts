import { readFile, writeFile } from 'fs-extra';

export async function mergePackageJson(targetPath, sourcePath) {
    const sourcePackageJson = JSON.parse(await readFile(sourcePath, 'utf-8'));
    const targetPackageJson = JSON.parse(await readFile(targetPath, 'utf-8'));
    for (const key in sourcePackageJson) {
        if (targetPackageJson[key]) {
            targetPackageJson[key] = { ...targetPackageJson[key], ...sourcePackageJson[key] };
        } else {
            targetPackageJson[key] = sourcePackageJson[key];
        }
    }

    await writeFile(targetPath, JSON.stringify(targetPackageJson, null, 2));
}
