#!/usr/bin/env node

import {build} from 'esbuild';
import {sassPlugin} from 'esbuild-sass-plugin';

import tsconfigJson from '../tsconfig.json' with {type: 'json'};

const outDir = 'build';

/** @type {import('esbuild').BuildOptions}*/
const common = {
    bundle: true,
    sourcemap: true,
    target: tsconfigJson.compilerOptions.target,
    tsconfig: './tsconfig.json',
};

/** @type {import('esbuild').BuildOptions}*/
const plugin = {
    ...common,
    entryPoints: ['src/plugin/index.ts'],
    outfile: outDir + '/plugin/index.js',
    platform: 'node',
    packages: 'external',
};

/** @type {import('esbuild').BuildOptions}*/
const runtime = {
    ...common,
    entryPoints: ['src/runtime/index.ts'],
    outfile: outDir + '/runtime/index.js',
    minify: true,
    platform: 'browser',
    plugins: [sassPlugin()],
};

/** @type {import('esbuild').BuildOptions}*/
const runtimeReact = {
    ...common,
    entryPoints: ['src/react/index.tsx'],
    outfile: outDir + '/react/index.js',
    minify: true,
    platform: 'neutral',
    plugins: [],
    external: ['react'],
};

build(plugin);
build(runtime);
build(runtimeReact);
