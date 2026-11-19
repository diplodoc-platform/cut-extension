import type {CutBoundaryToken} from '../src/plugin/helpers';

import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {recognizeCutBoundary} from '../src/plugin/helpers';
import {transform} from '../src/plugin/transform';

const whitespace = [
    ' ',
    '\t',
    '\u00a0',
    '\u1680',
    '\u2003',
    '\u202f',
    '\u205f',
    '\u3000',
    '\ufeff',
];

function paragraph(content: string): CutBoundaryToken[] {
    return [
        {type: 'paragraph_open', content: '', map: [3, 6]},
        {type: 'inline', content, map: [3, 6]},
        {type: 'paragraph_close', content: '', map: null},
    ];
}

describe('legacy Cut paragraph-edge whitespace', () => {
    it.each(whitespace)(
        'recognizes padded markers without changing the observed source: %j',
        (space) => {
            const content = `${space}\n${space}{% cut " *Title\u00a0with spaces* " %}{#anchor .extra}${space}\n${space}`;
            const tokens = paragraph(content);
            const before = JSON.stringify(tokens);

            expect(recognizeCutBoundary(tokens, 0)).toEqual({
                kind: 'open',
                title: ' *Title\u00a0with spaces* ',
                rawAttributes: '{#anchor .extra}',
                raw: content,
                map: [3, 6],
            });
            expect(JSON.stringify(tokens)).toBe(before);
            expect(recognizeCutBoundary(tokens, 0)?.map).not.toBe(tokens[0].map);

            const close = `${space}\n{% endcut %}\n${space}`;
            expect(recognizeCutBoundary(paragraph(close), 0)).toEqual({
                kind: 'close',
                raw: close,
                map: [3, 6],
            });
        },
    );

    it.each([
        '{% cut "Title" %}\nActual body',
        '{% cut "Title" %}\n\u00a0Actual body\u00a0',
        'Actual body\n{% cut "Title" %}',
        '{% cut "Multi\nline" %}',
        '{% cut "Unclosed %}',
        '{% cut missing-quotes %}',
        '{% endcut %}\nActual body',
        '\\{% cut "Escaped" %}',
        '\u200b{% cut "Zero-width is not whitespace" %}',
    ])('does not discard real content or repair malformed markers: %j', (content) => {
        const tokens = paragraph(content);
        const before = JSON.stringify(tokens);
        expect(recognizeCutBoundary(tokens, 0)).toBeUndefined();
        expect(JSON.stringify(tokens)).toBe(before);
    });

    it.each(["{% cut 'Title' %}", '{% cut |Title| %}', '{% cut \'Title" %}'])(
        'retains the existing permissive quote grammar: %s',
        (marker) => {
            expect(recognizeCutBoundary(paragraph(`\u00a0${marker}\n\u00a0`), 0)).toMatchObject({
                kind: 'open',
                title: 'Title',
            });
        },
    );

    it('keeps authored body and formatted titles when a parser retains marker padding', () => {
        const source =
            '{% cut " *Title\u00a0with spaces* " %}{#anchor .extra}\n\nBody **text**.\n\n{% endcut %}';
        const render = (padded: boolean) => {
            const md = new MarkdownIt().use(transform({bundle: false}));
            if (padded) {
                md.core.ruler.before('cut', 'native15-marker-padding', (state) => {
                    for (const token of state.tokens) {
                        if (token.type === 'inline' && token.content.startsWith('{%')) {
                            token.content = `\u00a0${token.content}\n\u00a0`;
                        }
                    }
                });
            }
            const env = {};
            return {html: md.render(source, env), env};
        };

        const expected = render(false);
        expect(expected.html).toContain('<em>Title\u00a0with spaces</em>');
        expect(expected.html).toContain('<p>Body <strong>text</strong>.</p>');
        expect(render(true)).toEqual(expected);
    });

    it('handles large whitespace edges and repeated quotes without changing marker grammar', () => {
        const padding = '\u00a0'.repeat(100_000);
        const title = '"'.repeat(100_000);
        expect(
            recognizeCutBoundary(paragraph(`${padding}{% cut "${title}" %}\n${padding}`), 0),
        ).toMatchObject({
            kind: 'open',
            title,
        });
        expect(
            recognizeCutBoundary(paragraph(`${padding}{% cut "${title}\nbody${padding}`), 0),
        ).toBeUndefined();
    });
});
