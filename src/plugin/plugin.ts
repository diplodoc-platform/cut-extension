import type {CoreRule, PluginSimple} from './markdown-it';

import {AttrsParser} from '@diplodoc/utils';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';
import {findCloseTokenIdx, matchOpenToken} from './helpers';
import {titleAttributes} from './attributes';

export const cutPlugin: PluginSimple = (md) => {
    const rule: CoreRule = (state) => {
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

                const title = match[1];
                const attrs = match[2] || '';

                if (typeof title === 'undefined') {
                    throw new Error(`No title provided for cut ${match[0]}`);
                }

                const attrsParser = new AttrsParser(attrs);

                const newOpenToken = new state.Token(TokenType.CutOpen, 'details', 1);
                newOpenToken.attrSet('class', ClassNames.Cut);
                newOpenToken.map = tokens[i].map;
                newOpenToken.markup = '{%';

                attrsParser.apply(newOpenToken);

                const titleOpen = new state.Token(TokenType.TitleOpen, 'summary', 1);
                const id = newOpenToken.attrGet('id');
                for (const [name, value] of Object.entries(titleAttributes(id))) {
                    titleOpen.attrSet(name, value);
                }
                if (id) newOpenToken.attrSet('id', '');

                const titleInline = state.md.parseInline(title, state.env)[0];

                const titleClose = new state.Token(TokenType.TitleClose, 'summary', -1);

                const contentOpen = new state.Token(TokenType.ContentOpen, 'div', 1);
                contentOpen.attrSet('class', ClassNames.Content);

                if (newOpenToken.map) {
                    const contentOpenStart = newOpenToken.map[0] + 1;
                    const contentOpenEnd = newOpenToken.map[0] + 2;

                    contentOpen.map = [contentOpenStart, contentOpenEnd];
                }

                const contentClose = new state.Token(TokenType.ContentClose, 'div', -1);

                const newCloseToken = new state.Token(TokenType.CutClose, 'details', -1);
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

                state.env ??= {};
                state.env[ENV_FLAG_NAME] = true;

                i++;
            } else {
                i++;
            }
        }
    };

    try {
        md.core.ruler.before('curly_attributes', 'cut', rule);
    } catch {
        md.core.ruler.push('cut', rule);
    }
};
