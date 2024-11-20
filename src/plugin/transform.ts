import type MarkdownIt from 'markdown-it';

import {cutPlugin} from './plugin';
import {type Runtime, copyRuntime, dynrequire, hidden} from './utils';
import {ENV_FLAG_NAME} from './const';
import {cutDirective} from './directive';

export type TransformOptions = {
    runtime?:
        | string
        | {
              script: string;
              style: string;
          };
    bundle?: boolean;
    /**
     * Enables directive syntax of yfm-cut.
     *
     * - 'disabled' – directive syntax is disabled.
     * - 'enabled' – directive syntax is enabled; old syntax is also enabled.
     * - 'only' – enabled only directive syntax; old syntax is disabled.
     *
     * @default 'disabled'
     */
    directiveSyntax?: 'disabled' | 'enabled' | 'only';
};

type NormalizedPluginOptions = Omit<TransformOptions, 'runtime' | 'directiveSyntax'> & {
    runtime: Runtime;
    directiveSyntax: NonNullable<TransformOptions['directiveSyntax']>;
};

const registerTransform = (
    md: MarkdownIt,
    {
        runtime,
        bundle,
        output,
        directiveSyntax,
    }: Pick<NormalizedPluginOptions, 'bundle' | 'runtime' | 'directiveSyntax'> & {
        output: string;
    },
) => {
    if (directiveSyntax === 'disabled' || directiveSyntax === 'enabled') {
        md.use(cutPlugin);
    }
    if (directiveSyntax === 'enabled' || directiveSyntax === 'only') {
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

    const directiveSyntax = options.directiveSyntax || 'disabled';
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
            directiveSyntax,
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
                    directiveSyntax,
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
