import type {DirectiveBlockState, DirectiveInlineState} from '@diplodoc/directive';
import type {CutCoreState, CutHost, CutToken} from './markdown-it';

import {AttrsParser} from '@diplodoc/utils';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';
import {normalizeEmptyCutEdges} from './helpers';
import {legacyPairs} from './legacy-pairs';
import {titleAttributes} from './attributes';

export const cutPlugin = <
    T extends CutToken,
    C extends CutCoreState<T>,
    B extends DirectiveBlockState,
    I extends DirectiveInlineState,
>(
    md: CutHost<T, C, B, I>,
) => {
    const rule = (state: C) => {
        const tokens = state.tokens;
        const openings = legacyPairs(tokens);
        if (!openings) return;

        const closingEdges = new Map<number, [T, T]>();
        const result: T[] = [];
        let i = 0;

        while (i < tokens.length) {
            const opening = openings.get(i);
            const closeTokenIdx = opening?.close;
            if (opening && closeTokenIdx !== undefined) {
                const match = opening.match;
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

                // Utils 2.3.7-transform5.0 uses only attrJoin(name, string) here.
                const apply = attrsParser.apply as (
                    this: AttrsParser,
                    target: Pick<CutToken, 'attrJoin'>,
                ) => void;
                apply.call(attrsParser, newOpenToken);

                const titleOpen = new state.Token(TokenType.TitleOpen, 'summary', 1);
                const id = newOpenToken.attrGet('id');
                for (const [name, value] of Object.entries(
                    titleAttributes(id ? String(id) : null),
                )) {
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

                result.push(newOpenToken, titleOpen, titleInline, titleClose, contentOpen);
                closingEdges.set(closeTokenIdx, [contentClose, newCloseToken]);

                state.env ??= {};
                state.env[ENV_FLAG_NAME] = true;

                i += 3;
            } else {
                const closing = closingEdges.get(i);
                if (closing) {
                    result.push(closing[0], closing[1]);
                    i += 3;
                    continue;
                }
                if (opening && !closingEdges.has(i + 3)) {
                    normalizeEmptyCutEdges(tokens, i, opening.match[2] || '');
                }
                result.push(tokens[i++]);
            }
        }
        if (closingEdges.size) {
            tokens.length = 0;
            for (const token of result) tokens.push(token);
        }
    };

    try {
        md.core.ruler.before('curly_attributes', 'cut', rule);
    } catch {
        md.core.ruler.push('cut', rule);
    }
};
