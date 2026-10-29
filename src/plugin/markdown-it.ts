import type * as MarkdownItPackage from 'markdown-it' with {'resolution-mode': 'import'};

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
