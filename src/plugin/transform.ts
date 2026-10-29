import type {
    BlockContentState,
    DirectiveBlockState,
    DirectiveInlineState,
} from '@diplodoc/directive';
import type {CutCoreState, CutHost, CutToken, MarkdownIt} from './markdown-it';
import type {RawRuntime, Runtime} from './utils';

import {cutPlugin} from './plugin';
import {dynrequire, getRuntime, hidden} from './utils';
import {ENV_FLAG_NAME} from './const';
import {cutDirective} from './directive';

export type CutDiagnostic = {line: number; reason: string};

export type TransformOptions = {
    runtime?: RawRuntime;
    /** Reports invalid parameters for recognized cut directives. */
    onDiagnostic?: (diagnostic: CutDiagnostic) => void;
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
    /** @internal */
    onBundle?: (args: {runtime: Runtime; output: string}, cache: Set<string>) => void;
};

type NormalizedPluginOptions = Omit<TransformOptions, 'runtime' | 'directiveSyntax'> & {
    runtime: Runtime;
    directiveSyntax: NonNullable<TransformOptions['directiveSyntax']>;
};

const registerTransform = <
    T extends CutToken,
    C extends CutCoreState<T>,
    B extends DirectiveBlockState & BlockContentState<B>,
    I extends DirectiveInlineState,
>(
    md: CutHost<T, C, B, I>,
    {
        runtime,
        bundle,
        onBundle,
        output,
        directiveSyntax,
        onDiagnostic,
    }: Pick<
        NormalizedPluginOptions,
        'bundle' | 'runtime' | 'directiveSyntax' | 'onBundle' | 'onDiagnostic'
    > & {
        output: string;
    },
) => {
    if (directiveSyntax === 'disabled' || directiveSyntax === 'enabled') {
        md.use(cutPlugin);
    }
    if (directiveSyntax === 'enabled' || directiveSyntax === 'only') {
        md.use(cutDirective(onDiagnostic));
    }
    md.core.ruler.push('yfm_cut_after', ({env}) => {
        const bundledEnv = hidden(env, 'bundled', new Set<string>());

        if (env?.[ENV_FLAG_NAME] && runtime) {
            env.meta = env.meta || {};
            env.meta.script = env.meta.script || [];
            env.meta.script.push(runtime.script);
            env.meta.style = env.meta.style || [];
            env.meta.style.push(runtime.style);

            if (bundle && onBundle) {
                onBundle({runtime, output}, bundledEnv.bundled);
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
    const runtime: Runtime = getRuntime(options.runtime);

    const plugin = function <
        T extends CutToken,
        C extends CutCoreState<T>,
        B extends DirectiveBlockState & BlockContentState<B>,
        I extends DirectiveInlineState,
    >(md: CutHost<T, C, B, I>, {output = '.'} = {}) {
        registerTransform(md, {
            directiveSyntax,
            onDiagnostic: options.onDiagnostic,
            runtime,
            bundle,
            onBundle: options.onBundle,
            output,
        });
    };

    return Object.assign(plugin, {
        collect(input: string, {destRoot = '.'}: InputOptions) {
            const MdIt = dynrequire('markdown-it');
            const md = new MdIt().use((md: MarkdownIt) => {
                registerTransform(md, {
                    directiveSyntax,
                    onDiagnostic: options.onDiagnostic,
                    runtime,
                    bundle,
                    onBundle: options.onBundle,
                    output: destRoot,
                });
            });

            md.parse(input, {});
        },
    });
}
