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

    return box as B & {[P in F]: V};
}

export type Runtime = {
    script: string;
    style: string;
};

declare const __dirname: string;
export function copyRuntime(
    {runtime, output}: {runtime: Runtime; output: string},
    cache: Set<string>,
) {
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
    return eval(`require('${module}')`);
}
