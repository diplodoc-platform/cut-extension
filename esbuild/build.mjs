#!/usr/bin/env node

import {build} from 'esbuild';
import {sassPlugin} from 'esbuild-sass-plugin';

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
    outfile: 'plugin/index.js',
    platform: 'node',
    packages: 'external',
}

/** @type {import('esbuild').BuildOptions}*/
const runtime = {
    ...common,
    entryPoints: ['src/runtime/index.ts'],
    outfile: 'runtime/index.js',
    minify: true,
    platform: 'browser',
    plugins: [sassPlugin()],
};

build(plugin);
build(runtime);
