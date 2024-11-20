import type MarkdownIt from 'markdown-it';

import {directiveParser, registerContainerDirective} from '@diplodoc/directive';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';

export const cutDirective: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    registerContainerDirective(md, {
        name: 'cut',
        match(_params, state) {
            state.env ??= {};
            state.env[ENV_FLAG_NAME] = true;

            return true;
        },
        container: {
            tag: 'details',
            token: TokenType.Cut,
            attrs: {
                class: ClassNames.Cut,
            },
        },
        inlineContent: {
            required: false,
            tag: 'summary',
            token: TokenType.Title,
            attrs: {
                class: ClassNames.Title,
            },
        },
        content: {
            tag: 'div',
            token: TokenType.Content,
            attrs: {
                class: ClassNames.Content,
            },
        },
    });
};
