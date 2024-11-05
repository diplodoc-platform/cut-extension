import type MarkdownIt from 'markdown-it';

import {cutPlugin} from './plugin';
import {type Runtime, copyRuntime, dynrequire, hidden} from './utils';
import {ENV_FLAG_NAME} from './const';
import {cutDirective} from './directive';

type Syntax = 'both' | 'curly' | 'directive';

export type TransformOptions = {
    runtime?:
        | string
        | {
              script: string;
              style: string;
          };
    bundle?: boolean;
    /** @default 'curly' */
    syntax?: Syntax;
};

type NormalizedPluginOptions = Omit<TransformOptions, 'runtime' | 'syntax'> & {
    runtime: Runtime;
    syntax: Syntax;
};

const registerTransform = (
    md: MarkdownIt,
    {
        runtime,
        bundle,
        syntax,
        output,
    }: Pick<NormalizedPluginOptions, 'bundle' | 'runtime' | 'syntax'> & {
        output: string;
    },
) => {
    if (syntax === 'curly' || syntax === 'both') {
        md.use(cutPlugin);
    }
    if (syntax === 'directive' || syntax === 'both') {
        md.use(cutDirective);
    }
    md.core.ruler.push('yfm_cut_after', ({env}) => {
        hidden(env, 'bundled', new Set<string>());

        if (env?.[ENV_FLAG_NAME]) {
            env.meta = env.meta || {};
            env.meta.script = env.meta.script || [];
            env.meta.script.push(runtime.script);
            env.meta.style = env.meta.style || [];
            env.meta.style.push(runtime.style);

            if (bundle) {
                copyRuntime({runtime, output}, env.bundled);
            }
        }
    });
};

type InputOptions = {
    destRoot: string;
};

export function transform(options: Partial<TransformOptions> = {}) {
    const {bundle = true} = options;

    if (bundle && typeof options.runtime === 'string') {
        throw new TypeError('Option `runtime` should be record when `bundle` is enabled.');
    }

    const syntax: Syntax = options.syntax ?? 'curly';

    const runtime: Runtime =
        typeof options.runtime === 'string'
            ? {script: options.runtime, style: options.runtime}
            : options.runtime || {
                  script: '_assets/cut-extension.js',
                  style: '_assets/cut-extension.css',
              };

    const plugin: MarkdownIt.PluginWithOptions<{output?: string}> = function (
        md: MarkdownIt,
        {output = '.'} = {},
    ) {
        registerTransform(md, {
            syntax,
            runtime,
            bundle,
            output,
        });
    };

    Object.assign(plugin, {
        collect(input: string, {destRoot = '.'}: InputOptions) {
            const MdIt = dynrequire('markdown-it');
            const md = new MdIt().use((md: MarkdownIt) => {
                registerTransform(md, {
                    syntax,
                    runtime,
                    bundle,
                    output: destRoot,
                });
            });

            md.parse(input, {});
        },
    });

    return plugin;
}
