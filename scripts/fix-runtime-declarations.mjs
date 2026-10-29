import {readFileSync, writeFileSync} from 'node:fs';

// The stylesheet is bundled into the separately exported CSS asset. It is not
// shipped at the source path referenced by TypeScript's emitted declaration.
const file = new URL('../build/runtime/index.d.ts', import.meta.url);
const contents = readFileSync(file, 'utf8');
const stylesheetImport = /^import '\.\/styles\/cut\.scss';\r?\n/gm;
if ([...contents.matchAll(stylesheetImport)].length !== 1) {
    throw new Error('Unexpected runtime declaration stylesheet import');
}
writeFileSync(file, contents.replace(stylesheetImport, ''));
