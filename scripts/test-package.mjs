import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    realpathSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSync} from '@diplodoc/infra/esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRequire = createRequire(join(root, 'package.json'));
const npmCli = process.env.npm_execpath;
assert(npmCli, 'Run this check through npm run test:package.');
const tmp = mkdtempSync(join(tmpdir(), 'cut-package-'));
const report = resolve(process.env.CUT_PACKAGE_REPORT_DIR || tmp);
const hosts = [
    {version: '12.3.2', types: '12.2.3'},
    {version: '13.0.2', types: '13.0.9'},
    {version: '14.1.0', types: '14.1.0'},
    {version: '15.0.3'},
];
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const run = (command, args, cwd, label) => {
    const result = spawnSync(command, args, {cwd, encoding: 'utf8'});
    writeFileSync(join(report, `${label}.log`), result.stdout + result.stderr);
    assert.equal(result.status, 0, `${label} failed; see ${join(report, `${label}.log`)}`);
    return result.stdout;
};
const npm = (args, cwd, label) => run(process.execPath, [npmCli, ...args], cwd, label);

// Reports may be directed to a CI artifact directory, while consumers stay isolated.
mkdirSync(report, {recursive: true});
process.stdout.write(`Cut package evidence: ${report}\n`);
npm(['run', 'build'], root, 'build');
const [pack] = JSON.parse(npm(['pack', '--json', '--pack-destination', tmp], root, 'pack'));
const tarball = join(tmp, pack.filename);
const tarSha256 = hash(tarball);
const sourceFiles = pack.files.map(({path}) => ({path, sha256: hash(join(root, path))}));
writeFileSync(
    join(report, 'pack.json'),
    JSON.stringify({...pack, tarSha256, sourceFiles}, null, 2),
);

const typeBody = `
import {transform, type TransformOptions} from '@diplodoc/cut-extension';
import {transform as pureTransform, recognizeCutBoundary, type CutBoundary} from '@diplodoc/cut-extension/plugin';
import '@diplodoc/cut-extension/runtime';
const original = new MarkdownIt().parse('{% cut "Title" %}', {});
const boundary: CutBoundary | undefined = recognizeCutBoundary(original, 0);
if (boundary?.kind !== 'open' || boundary.title !== 'Title') throw new Error('Cut boundary');
new MarkdownIt().use(pureTransform({bundle:false, runtime:false}));
function checkReadonly(value: CutBoundary) {
    // @ts-expect-error Snapshots are readonly.
    value.raw = 'changed';
    if (value.map) {
        // @ts-expect-error Snapshot map entries are readonly.
        value.map[0] = 42;
    }
    if (value.kind === 'close') {
        // @ts-expect-error Only opening edges have an authored title.
        value.title;
    }
}
void checkReadonly;
const options: TransformOptions = {bundle: false, directiveSyntax: 'enabled', onDiagnostic: ({line, reason}) => {
    const validLine: number = line;
    const validReason: string = reason;
    void [validLine, validReason];
}};
const md = new MarkdownIt().use(transform(options));
void md.render(':::cut [Title]\\nBody\\n:::');
const plugin = transform(options);
const collected: void = plugin.collect(':::cut [Title]\\nBody\\n:::', {destRoot: 'out'});
void collected;
// @ts-expect-error The input must be a string.
plugin.collect(42, {destRoot: 'out'});
// @ts-expect-error The options argument is required.
plugin.collect('input');
// @ts-expect-error destRoot must be a string.
plugin.collect('input', {destRoot: 42});
// @ts-expect-error Unknown directive modes are rejected.
const invalidMode: TransformOptions = {directiveSyntax: 'invalid'};
void invalidMode;
`;
const runtimeBody = `
const bundles = [];
const collector = transform({directiveSyntax: 'enabled', onBundle: (args) => bundles.push(args)});
const descriptor = Object.getOwnPropertyDescriptor(collector, 'collect');
assert.equal(typeof collector, 'function');
assert.equal(descriptor.value, collector.collect);
assert.deepEqual({writable: descriptor.writable, enumerable: descriptor.enumerable, configurable: descriptor.configurable}, {writable: true, enumerable: true, configurable: true});
const collect = collector.collect;
assert.equal(collect(':::cut [Title]\\nBody\\n:::', {destRoot: 'out'}), undefined);
assert.equal(collector.collect, collect);
assert.equal(bundles.length, 1);
assert.equal(bundles[0].output, 'out');
const numeric = new MarkdownIt().use(transform({bundle: false}));
numeric.core.ruler.before('cut', 'numeric-token-attrs', (state) => {
    const OriginalToken = state.Token;
    state.Token = class extends OriginalToken {
        constructor(...args) {
            super(...args);
            if (this.type === 'yfm_cut_open') this.attrSet('data-num', 42);
        }
    };
});
assert.match(numeric.render('{% cut "Title" %}{data-num=plus}\\n\\nBody\\n\\n{% endcut %}'), /data-num="42 plus"/);
for (const [id, expected] of [[42, '42'], [0, null], ['', null], ['0', '0']]) {
    const seeded = new MarkdownIt().use(transform({bundle: false}));
    seeded.core.ruler.before('cut', 'seed-id', (state) => {
        const OriginalToken = state.Token;
        state.Token = class extends OriginalToken {
            constructor(...args) {
                super(...args);
                if (this.type === 'yfm_cut_open') this.attrSet('id', id);
            }
        };
    });
    const html = seeded.render('{% cut "Title" %}\\n\\nBody\\n\\n{% endcut %}');
    const summary = html.match(/<summary[^>]*>/)[0];
    if (expected === null) assert.doesNotMatch(summary, / id=/);
    else assert.match(summary, new RegExp(' id="' + expected + '"'));
}
const diagnostics = [];
const options = {bundle: false, directiveSyntax: 'enabled', onDiagnostic: (item) => diagnostics.push(item)};
const md = new MarkdownIt().use(transform(options));
const env = {};
const oldHtml = md.render('{% cut "Title" %}{#anchor .extra open name=group}\\n\\nBody\\n\\n{% endcut %}', {});
const newHtml = md.render(':::cut [Title] {id=anchor class=extra open=true name=group}\\nBody\\n:::', env);
for (const html of [oldHtml, newHtml]) {
    assert.match(html, /<details class="yfm-cut extra" id="" name="group" open="true">/);
    assert.match(html, /<summary class="yfm-cut-title" id="anchor">Title<\\/summary>/);
    assert.match(html, /<div class="yfm-cut-content">/);
}
assert.equal(env.meta.script.length, 1);
assert.equal(env.meta.style.length, 1);
const directiveInput = ':::cut [Title]\\nBody\\n:::';
const readonlyFlag = Object.defineProperty({}, 'has-yfm-cut', {value: false, writable: false});
assert.throws(() => md.render(directiveInput, readonlyFlag), TypeError);
const sentinel = new Error('setter failed');
const throwingFlag = Object.defineProperty({}, 'has-yfm-cut', {set() {throw sentinel;}});
assert.throws(() => md.render(directiveInput, throwingFlag), (error) => error === sentinel);
const functionEnv = function () {};
assert.match(md.render(directiveInput, functionEnv), /<details/);
assert.equal(functionEnv['has-yfm-cut'], true);
assert.match(md.render(':::cut {constructor=x}\\nBody\\n:::', {}), /:::cut/);
assert.equal(diagnostics.length, 1);
assert.equal(diagnostics[0].line, 1);
const disabled = new MarkdownIt().use(transform({bundle: false}));
assert.doesNotMatch(disabled.render(':::cut [Title]\\nBody\\n:::'), /<details/);
const only = new MarkdownIt().use(transform({bundle: false, directiveSyntax: 'only'}));
assert.doesNotMatch(only.render('{% cut "Title" %}\\n\\nBody\\n\\n{% endcut %}'), /<details/);
assert.match(only.render(':::cut [Title] {open=false}\\nBody\\n:::'), /<details class="yfm-cut">/);
`;

for (const host of hosts) {
    const id = host.version.split('.')[0];
    const dir = join(tmp, `native${id}`);
    mkdirSync(dir);
    const dependencies = {
        '@diplodoc/cut-extension': `file:${tarball}`,
        'markdown-it': host.version,
        typescript: sourceRequire('typescript/package.json').version,
    };
    if (host.types) dependencies['@types/markdown-it'] = host.types;
    if (id === '12') dependencies['@types/linkify-it'] = '3.0.5';
    if (id === '13') dependencies['markdown-it-transform15'] = 'npm:markdown-it@15.0.3';
    if (id === '14') dependencies.mdurl = '2.0.0';
    writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify(
            {name: `cut-native${id}`, private: true, type: 'module', dependencies},
            null,
            2,
        ),
    );
    writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify(
            {
                compilerOptions: {
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    target: 'ES2022',
                    strict: true,
                    skipLibCheck: false,
                    noEmit: true,
                },
                include: [
                    'consumer.mts',
                    'consumer.cts',
                    'node_modules/@diplodoc/cut-extension/build/**/*.d.ts',
                ],
            },
            null,
            2,
        ),
    );
    const mixedTypeBody =
        id === '13'
            ? `
const host13Plugin: (md: MarkdownIt) => void = plugin;
const host15Plugin: (md: InstanceType<typeof MarkdownIt15>) => void = plugin;
new MarkdownIt().use(host13Plugin);
new MarkdownIt15().use(host15Plugin);
`
            : '';
    const mixedRuntimeBody =
        id === '13'
            ? `
assert.match(new MarkdownIt15().use(transform({bundle: false, directiveSyntax: 'enabled'})).render(':::cut [Mixed]\\nBody\\n:::'), /<details/);
`
            : '';
    writeFileSync(
        join(dir, 'consumer.mts'),
        `import MarkdownIt from 'markdown-it';\n${id === '13' ? "import MarkdownIt15 from 'markdown-it-transform15';\n" : ''}${typeBody}${mixedTypeBody}`,
    );
    writeFileSync(
        join(dir, 'consumer.cts'),
        `import MarkdownIt = require('markdown-it');\n${id === '13' ? "import MarkdownIt15 = require('markdown-it-transform15');\n" : ''}${typeBody}${mixedTypeBody}`,
    );
    writeFileSync(
        join(dir, 'reexport.cts'),
        "import {transform} from '@diplodoc/cut-extension';\nexport = transform({bundle: false});\n",
    );
    writeFileSync(
        join(dir, 'runtime.cjs'),
        `const assert = require('node:assert/strict');\nconst MarkdownIt = require('markdown-it');\n${id === '13' ? "const MarkdownIt15 = require('markdown-it-transform15');\n" : ''}const {transform} = require('@diplodoc/cut-extension');\n${runtimeBody}${mixedRuntimeBody}`,
    );
    writeFileSync(
        join(dir, 'runtime.mjs'),
        `import assert from 'node:assert/strict';\nimport MarkdownIt from 'markdown-it';\n${id === '13' ? "import MarkdownIt15 from 'markdown-it-transform15';\n" : ''}import {transform} from '@diplodoc/cut-extension';\n${runtimeBody}${mixedRuntimeBody}`,
    );
    npm(['install', '--no-workspaces', '--no-audit', '--no-fund'], dir, `native${id}-install`);
    npm(['ci', '--no-workspaces', '--no-audit', '--no-fund'], dir, `native${id}-ci`);
    const consumerRequire = createRequire(join(dir, 'package.json'));
    const modules = realpathSync(join(dir, 'node_modules')) + sep;
    for (const name of [
        '@diplodoc/cut-extension',
        '@diplodoc/directive',
        'markdown-it',
        'typescript',
    ]) {
        assert(
            realpathSync(consumerRequire.resolve(name)).startsWith(modules),
            `${name} escaped fixture`,
        );
    }
    assert.equal(consumerRequire('markdown-it/package.json').version, host.version);
    const pure = buildSync({
        stdin: {
            contents:
                "import {transform, recognizeCutBoundary} from '@diplodoc/cut-extension/plugin'; globalThis.cut = transform; globalThis.recognize = recognizeCutBoundary;",
            resolveDir: dir,
        },
        bundle: true,
        platform: 'browser',
        format: 'esm',
        metafile: true,
        write: false,
        logLevel: 'silent',
    });
    assert(
        Object.values(pure.metafile.outputs).every((output) => output.imports.length === 0),
        'The explicit pure entry must bundle without Node imports',
    );
    assert(
        Object.keys(pure.metafile.inputs).every((input) => !/index-node|utilsFS/.test(input)),
        'The explicit pure entry must exclude filesystem wrappers',
    );
    writeFileSync(join(report, `native${id}-pure-graph.json`), JSON.stringify(pure.metafile));
    if (id === '13') {
        assert(
            realpathSync(consumerRequire.resolve('markdown-it-transform15')).startsWith(modules),
        );
        assert.equal(consumerRequire('markdown-it-transform15/package.json').version, '15.0.3');
    }
    assert.equal(consumerRequire('@diplodoc/directive/package.json').version, '0.5.0-transform5.2');
    if (host.types)
        assert.equal(consumerRequire('@types/markdown-it/package.json').version, host.types);
    else
        assert.throws(() => consumerRequire.resolve('@types/markdown-it/package.json'), {
            code: 'MODULE_NOT_FOUND',
        });
    const lock = JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8'));
    const directive = lock.packages['node_modules/@diplodoc/directive'];
    assert.match(directive.resolved, /^https:\/\/registry\.npmjs\.org\//);
    assert.equal(
        directive.integrity,
        'sha512-QcQ8muoELVH1dPOo4RMTFC0ca/u7HnCQ2s6dAqi8MvX3MSHT4aGryb3fCf3uAUTHTpzjPxNwxLroTwGLpLLOzw==',
    );
    const installed = join(dir, 'node_modules', '@diplodoc', 'cut-extension');
    assert(
        realpathSync(consumerRequire.resolve('@diplodoc/cut-extension')).startsWith(
            realpathSync(installed) + sep,
        ),
    );
    const files = readdirSync(installed, {recursive: true})
        .filter((name) => statSync(join(installed, name)).isFile())
        .map((name) => name.split(sep).join('/'))
        .sort();
    assert.deepEqual(files, sourceFiles.map(({path}) => path).sort());
    for (const file of sourceFiles)
        assert.equal(hash(join(installed, file.path)), file.sha256, file.path);
    const tsc = consumerRequire.resolve('typescript/bin/tsc');
    run(process.execPath, [tsc, '-p', 'tsconfig.json'], dir, `native${id}-types`);
    run(
        process.execPath,
        [
            tsc,
            '--ignoreConfig',
            '--strict',
            '--skipLibCheck',
            'false',
            '--module',
            'NodeNext',
            '--moduleResolution',
            'NodeNext',
            '--target',
            'ES2022',
            '--declaration',
            '--emitDeclarationOnly',
            '--outDir',
            'declarations',
            'reexport.cts',
        ],
        dir,
        `native${id}-reexport`,
    );
    const reexport = readFileSync(join(dir, 'declarations/reexport.d.cts'), 'utf8');
    assert.match(reexport, /@diplodoc\/cut-extension/);
    assert.doesNotMatch(reexport, /@diplodoc\/cut-extension\/build\//);
    run(process.execPath, ['runtime.cjs'], dir, `native${id}-cjs`);
    run(process.execPath, ['runtime.mjs'], dir, `native${id}-esm`);
    writeFileSync(join(report, `native${id}-lock.json`), JSON.stringify(lock, null, 2));
    writeFileSync(
        join(report, `native${id}-proof.json`),
        JSON.stringify(
            {
                host: host.version,
                tarSha256,
                directive,
                installed: relative(dir, installed),
                files: sourceFiles,
            },
            null,
            2,
        ),
    );
    process.stdout.write(
        `Native Markdown-it ${host.version}: installed files, CJS/ESM runtime and all declarations passed\n`,
    );
}
