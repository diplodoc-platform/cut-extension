import type * as MarkdownItPackage from 'markdown-it' with {'resolution-mode': 'import'};
import type {DirectiveParserHost} from '@diplodoc/directive';

type Package = typeof MarkdownItPackage;
type MarkdownItConstructor = Package extends {default: infer Default} ? Default : Package;

export type MarkdownIt = MarkdownItConstructor extends abstract new (
    ...args: infer Args
) => infer Instance
    ? Args extends unknown[]
        ? Instance
        : never
    : never;

export type Token = ReturnType<MarkdownIt['parse']>[number];
export type CoreRule = Parameters<MarkdownIt['core']['ruler']['push']>[1];
export type PluginSimple = (md: MarkdownIt) => void;

/** The token fields and string writes used by the legacy cut rule. */
export type CutToken = {
    type: string;
    content: string;
    markup: string;
    map: [number, number] | null;
    attrSet(name: string, value: string): void;
    attrJoin(name: string, value: string): void;
    attrGet(name: string): string | number | null;
};

export type CutCoreState<T> = {
    tokens: T[];
    Token: new (type: string, tag: string, nesting: -1 | 0 | 1) => T;
    env: Record<string, unknown> & {
        meta?: {script?: string[]; style?: string[]};
        bundled?: Set<string>;
    };
    md: {parseInline(src: string, env: Record<string, unknown>): T[]};
};

export type CutHost<T, C, B, I> = DirectiveParserHost<B, I> & {
    use(plugin: (md: CutHost<T, C, B, I>) => void): unknown;
    core: {
        ruler: {
            before(name: string, ruleName: string, rule: (state: C) => void): void;
            push(name: string, rule: (state: C) => void): void;
        };
    };
};
