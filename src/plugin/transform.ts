import type MarkdownIt from 'markdown-it';
import {cutPlugin} from './plugin';

export type TransformOptions = {};

const registerTransform = (md: MarkdownIt) => {
    md.use(cutPlugin);

    // TODO: add runtime
};

export function transform(_options: Partial<TransformOptions> = {}) {
    const plugin: MarkdownIt.PluginSimple = function (md: MarkdownIt) {
        registerTransform(md);
    };

    // TODO: add runtime
    Object.assign(plugin, {});

    return plugin;
}
