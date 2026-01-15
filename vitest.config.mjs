import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        // Paths are relative to the working directory where vitest is run
        // When running from tests/ directory, use 'src/**/*.test.ts'
        // When running from project root, use 'tests/src/**/*.test.ts'
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
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
