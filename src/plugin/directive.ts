import type MarkdownIt from 'markdown-it';
import directives, {type MarkdownItWithDirectives} from 'markdown-it-directive';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';

export const cutDirective: MarkdownIt.PluginSimple = (md) => {
    md.use(directives);

    (md as MarkdownItWithDirectives).blockDirectives['cut'] = ({
        state,
        content,
        contentStartLine,
        contentEndLine,
        inlineContent,
        inlineContentStart,
        inlineContentEnd,
        directiveStartLine,
        directiveEndLine,
    }) => {
        state.env ??= {};
        state.env[ENV_FLAG_NAME] = true;

        let token = state.push(TokenType.CutOpen, 'div', 1);
        token.block = true;
        token.attrSet('class', ClassNames.Cut);
        token.map = [directiveStartLine, directiveEndLine];

        token = state.push(TokenType.TitleOpen, 'div', 1);
        token.attrSet('class', ClassNames.Title);
        token.map = [inlineContentStart, inlineContentEnd];

        token = state.push('inline', '', 0);
        token.children = [];
        token.content = inlineContent || '';
        token.map = [directiveStartLine, directiveStartLine + 1];

        token = state.push(TokenType.TitleClose, 'div', -1);

        token = state.push(TokenType.ContentOpen, 'div', 1);
        token.attrSet('class', ClassNames.Content);
        token.map = [directiveStartLine + 1, directiveEndLine - 1];

        if (content) {
            const oldParent = state.parentType;
            const oldLineMax = state.lineMax;

            // @ts-expect-error bad types of state.parentType
            state.parentType = 'yfm-cut';
            state.line = contentStartLine!;
            state.lineMax = contentEndLine!;

            state.md.block.tokenize(state, contentStartLine!, contentEndLine!);

            state.lineMax = oldLineMax;
            state.parentType = oldParent;
        }

        token = state.push(TokenType.ContentClose, 'div', -1);

        token = state.push(TokenType.CutClose, 'div', -1);
        token.block = true;

        return true;
    };
};
