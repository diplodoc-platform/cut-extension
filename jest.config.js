/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transformIgnorePatterns: [],
    transform: {
        '^.+\\.(j|t)s?$': [
            'ts-jest',
            {
                isolatedModules: true,
                tsconfig: '<rootDir>/tests/tsconfig.json',
            },
        ],
    },
};
