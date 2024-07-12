import type MarkdownIt from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';

import {ClassNames, TokenType} from './const';
import {findCloseTokenIdx, matchOpenToken} from './helpers';

export const cutPlugin: MarkdownIt.PluginSimple = (md) => {
    const rule: Core.RuleCore = (state) => {
        const tokens = state.tokens;
        let i = 0;

        while (i < tokens.length) {
            const match = matchOpenToken(tokens, i);

            if (match) {
                const closeTokenIdx = findCloseTokenIdx(tokens, i + 4);

                if (!closeTokenIdx) {
                    i += 3;
                    continue;
                }

                const newOpenToken = new state.Token(TokenType.CutOpen, 'div', 1);
                newOpenToken.attrSet('class', ClassNames.Cut);
                newOpenToken.map = tokens[i].map;

                const titleOpen = new state.Token(TokenType.TitleOpen, 'div', 1);
                titleOpen.attrSet('class', ClassNames.Title);

                const titleInline = state.md.parseInline(
                    match[1] === undefined ? 'ad' : match[1],
                    state.env,
                )[0];

                const titleClose = new state.Token(TokenType.TitleClose, 'div', -1);

                const contentOpen = new state.Token(TokenType.ContentOpen, 'div', 1);
                contentOpen.attrSet('class', ClassNames.Content);

                if (newOpenToken.map) {
                    const contentOpenStart = newOpenToken.map[0] + 1;
                    const contentOpenEnd = newOpenToken.map[0] + 2;

                    contentOpen.map = [contentOpenStart, contentOpenEnd];
                }

                const contentClose = new state.Token(TokenType.ContentClose, 'div', -1);

                const newCloseToken = new state.Token(TokenType.CutClose, 'div', -1);
                newCloseToken.map = tokens[closeTokenIdx].map;

                const insideTokens = [
                    newOpenToken,
                    titleOpen,
                    titleInline,
                    titleClose,
                    contentOpen,
                    ...tokens.slice(i + 3, closeTokenIdx),
                    contentClose,
                    newCloseToken,
                ];

                tokens.splice(i, closeTokenIdx - i + 3, ...insideTokens);

                i++;
            } else {
                i++;
            }
        }
    };

    try {
        md.core.ruler.before('curly_attributes', 'cut', rule);
    } catch (e) {
        md.core.ruler.push('cut', rule);
    }
};
