/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    testEnvironment: 'jsdom',
    transformIgnorePatterns: [],
    snapshotSerializers: ['jest-serializer-html'],
    transform: {
        '^.+\\.(j|t)s?$': ['esbuild-jest', {tsconfig: './tsconfig.json'}],
    },
};
