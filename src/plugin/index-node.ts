import type {Runtime} from './utils';

import {transform as baseTransform} from './transform';

export * from './index';

const onBundle = ({runtime, output}: {runtime: Runtime; output: string}, cache: Set<string>) => {
    copyRuntime({runtime, output}, cache);
};

export const transform: typeof baseTransform = (options = {}) => {
    return baseTransform({onBundle, ...options});
};

declare const __dirname: string;
function copyRuntime({runtime, output}: {runtime: Runtime; output: string}, cache: Set<string>) {
    if (!runtime) {
        return;
    }

    const PATH_TO_RUNTIME = '../runtime';
    const {join, resolve} = require('node:path');
    const runtimeFiles = {
        'index.js': runtime.script,
        'index.css': runtime.style,
    };
    for (const [originFile, outputFile] of Object.entries(runtimeFiles)) {
        const file = join(PATH_TO_RUNTIME, originFile);
        if (!cache.has(file)) {
            cache.add(file);
            copy(resolve(__dirname, file), join(output, outputFile));
        }
    }
}

function copy(from: string, to: string) {
    const {mkdirSync, copyFileSync} = require('node:fs');
    const {dirname} = require('node:path');

    mkdirSync(dirname(to), {recursive: true});
    copyFileSync(from, to);
}
