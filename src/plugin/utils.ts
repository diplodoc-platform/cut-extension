export function hidden<B extends Record<string | symbol, unknown>, F extends string | symbol, V>(
    box: B,
    field: F,
    value: V,
) {
    if (!(field in box)) {
        Object.defineProperty(box, field, {
            enumerable: false,
            value: value,
        });
    }

    return box as B & Record<F, V>;
}

export type RawRuntime =
    | false
    | string
    | undefined
    | {
          script: string;
          style: string;
      };

export type Runtime =
    | {
          script: string;
          style: string;
      }
    | false;

export function getRuntime(runtime: RawRuntime) {
    if (typeof runtime === 'string') {
        return {
            script: runtime,
            style: runtime,
        };
    } else if (typeof runtime === 'undefined') {
        return {
            script: '_assets/cut-extension.js',
            style: '_assets/cut-extension.css',
        };
    } else {
        return runtime;
    }
}

declare const __dirname: string;
export function copyRuntime(
    {runtime, output}: {runtime: Runtime; output: string},
    cache: Set<string>,
) {
    if (!runtime) {
        return;
    }

    const PATH_TO_RUNTIME = '../runtime';
    const {join, resolve} = dynrequire('node:path');
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

export function copy(from: string, to: string) {
    const {mkdirSync, copyFileSync} = dynrequire('node:fs');
    const {dirname} = dynrequire('node:path');

    mkdirSync(dirname(to), {recursive: true});
    copyFileSync(from, to);
}

/*
 * Runtime require hidden for builders.
 * Used for nodejs api
 */
export function dynrequire(module: string) {
    // eslint-disable-next-line no-eval
    return eval(`require('${module}')`);
}
