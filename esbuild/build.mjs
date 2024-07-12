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

build({
    ...common,
    entryPoints: ['src/index.ts'],
    outfile: outDir + 'index.js',
    minify: true,
});
