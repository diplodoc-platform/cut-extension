import type MarkdownIt from 'markdown-it';

import {
    createBlockInlineToken,
    directive,
    registerBlockDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';

export const cutDirective: MarkdownIt.PluginSimple = (md) => {
    md.use(directive());

    registerBlockDirective(md, 'cut', (state, params) => {
        if (!params.content) {
            return false;
        }

        state.env ??= {};
        state.env[ENV_FLAG_NAME] = true;

        let token = state.push(TokenType.CutOpen, 'details', 1);
        token.block = true;
        token.attrSet('class', ClassNames.Cut);
        token.map = [params.startLine, params.endLine];
        token.markup = ':::';

        token = state.push(TokenType.TitleOpen, 'summary', 1);
        token.attrSet('class', ClassNames.Title);

        if (params.inlineContent) {
            token = createBlockInlineToken(state, params);
        }

        token = state.push(TokenType.TitleClose, 'summary', -1);

        token = state.push(TokenType.ContentOpen, 'div', 1);
        token.attrSet('class', ClassNames.Content);
        token.map = [params.startLine + 1, params.endLine - 1];

        tokenizeBlockContent(state, params.content, 'yfm-cut');

        token = state.push(TokenType.ContentClose, 'div', -1);

        token = state.push(TokenType.CutClose, 'details', -1);
        token.block = true;

        return true;
    });
};
