import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        exclude: ['node_modules', 'build'],
        environment: 'jsdom',
        globals: true,
        snapshotFormat: {
            escapeString: true,
            printBasicPrototype: false,
        },
    },
});
