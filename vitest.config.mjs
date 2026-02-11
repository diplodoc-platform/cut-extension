import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {coverageConfigDefaults, defineConfig} from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: __dirname,
    resolve: {
        alias: {
            '@diplodoc/cut-extension': join(__dirname, 'src'),
        },
    },
    test: {
        globals: false,
        include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
        exclude: ['**/node_modules/**', 'build', 'dist', 'coverage'],
        snapshotFormat: {
            escapeString: true,
            printBasicPrototype: false,
        },
        coverage: {
            provider: 'v8',
            include: ['src/**'],
            exclude: ['test/**', ...coverageConfigDefaults.exclude],
            reporter: ['text', 'json', 'html', 'lcov'],
        },
    },
});
