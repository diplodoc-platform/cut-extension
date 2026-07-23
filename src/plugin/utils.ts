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

/*
 * Runtime require hidden for builders.
 * Used for nodejs api
 */
export function dynrequire(module: string) {
    // eslint-disable-next-line no-eval
    return eval(`require('${module}')`);
}
