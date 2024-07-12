#!/usr/bin/env node

import {build} from 'esbuild';

import tsConfig from '../tsconfig.json' assert { type: "json" };

const outDir = 'build/';

/** @type {import('esbuild').BuildOptions}*/
const common = {
    bundle: true,
    sourcemap: true,
    target: tsConfig.compilerOptions.target,
    tsconfig: './tsconfig.json',
};

/** @type {import('esbuild').BuildOptions}*/
const plugin = {
    ...common,
    entryPoints: ['src/plugin/index.ts'],
    outfile: outDir + 'plugin/index.js',
    platform: 'node',
    packages: 'external',
}


build(plugin);
