import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/src/**/*.test.ts', 'tests/src/**/*.spec.ts'],
        exclude: ['node_modules', 'build'],
        environment: 'jsdom',
        globals: true,
        snapshotFormat: {
            escapeString: true,
            printBasicPrototype: false,
        },
        coverage: {
            enabled: false,
            // Coverage is disabled because tests are in separate directory
            // Enable if needed: provider: 'v8', include: ['src'], exclude: ['src/**/*.test.ts']
        },
    },
});
