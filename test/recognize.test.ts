import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {recognizeCutBoundary} from '../src/plugin/helpers';
import {transform} from '../src/plugin/transform';

function inspect(source: string) {
    const tokens = new MarkdownIt({html: true}).parse(source, {});
    return tokens.flatMap((_, index) => {
        const boundary = recognizeCutBoundary(tokens, index);
        return boundary ? [boundary] : [];
    });
}

describe('canonical legacy Cut edges', () => {
    it('retains authored Markdown titles and raw attributes', () => {
        expect(inspect('{% cut "*Title*" %}{#details .extra}')).toEqual([
            {
                kind: 'open',
                map: [0, 1],
                raw: '{% cut "*Title*" %}{#details .extra}',
                title: '*Title*',
                rawAttributes: '{#details .extra}',
            },
        ]);
    });

    it('reports empty and independently unclosed nested openers', () => {
        const events = inspect('{% cut "" %}\n\n{% cut "Inner" %}\n\n{% endcut %}');
        expect(events.map(({kind}) => kind)).toEqual(['open', 'open', 'close']);
        expect(events[0]).toMatchObject({kind: 'open', title: '', rawAttributes: ''});
    });

    it('uses the exact permissive legacy recognizer without claiming migration eligibility', () => {
        for (const source of ["{% cut 'Title' %}", '{% cut |Title| %}', '{% cut \'Title" %}']) {
            expect(inspect(source)[0]).toMatchObject({kind: 'open', title: 'Title'});
        }
        expect(inspect('{% cut missing-quotes %}')).toEqual([]);
    });

    it('keeps a detached map and never changes original tokens', () => {
        const tokens = new MarkdownIt().parse('{% cut "Title" %}', {});
        const before = JSON.stringify(tokens);
        const event = recognizeCutBoundary(tokens, 0);
        expect(JSON.stringify(tokens)).toBe(before);
        expect(event?.map).not.toBe(tokens[0].map);
        if (tokens[0].map) tokens[0].map[1] = 42;
        expect(event?.map).toEqual([0, 1]);
        expect(recognizeCutBoundary(tokens, -1)).toBeUndefined();
        expect(recognizeCutBoundary(tokens, tokens.length)).toBeUndefined();
    });

    it('uses native Markdown code, HTML and escape boundaries with BOM and CRLF', () => {
        const events = inspect(
            '\uFEFF# 😀\r\n\r\n```md\r\n{% cut "Code" %}\r\n```\r\n\r\n    {% cut "Indented" %}\r\n\r\n<div>\r\n{% cut "HTML" %}\r\n</div>\r\n\r\n\\{% cut "Escaped" %}\r\n\r\n> {% cut "Quote" %}\r\n>\r\n> {% endcut %}\r\n\r\n- {% cut "List" %}\r\n\r\n  {% endcut %}\r\n',
        );
        expect(
            events.map((event) => [event.kind, event.kind === 'open' ? event.title : null]),
        ).toEqual([
            ['open', 'Quote'],
            ['close', null],
            ['open', 'List'],
            ['close', null],
        ]);
    });

    it('observes legacy edges inside an actual colon Cut before core mutation', () => {
        const md = new MarkdownIt().use(transform({bundle: false, directiveSyntax: 'enabled'}));
        const tokens: ReturnType<typeof md.parse> = [];
        md.block.parse(
            ':::cut [Outer]\n\n{% cut "Inner" %}\n\nBody\n\n{% endcut %}\n\n:::',
            md,
            {},
            tokens,
        );
        const events = tokens.flatMap((_, index) => {
            const event = recognizeCutBoundary(tokens, index);
            return event ? [event] : [];
        });
        expect(events.map(({kind}) => kind)).toEqual(['open', 'close']);
    });

    it.each([
        '{% cut "Title" %}\n\nBody\n\n{% endcut %}',
        '{% cut "" %}\n\n{% cut "Nested" %}\n\nBody\n\n{% endcut %}\n\n{% endcut %}',
        '{% cut "Greedy \\"title\\"" %}{#anchor .extra}\n\nBody\n\n{% endcut %}',
        '{% cut "Raw" %} trailing pseudo-attributes\n\nBody\n\n{% endcut %}',
        ':::cut [Colon]\n\n{% cut "Legacy" %}\n\nBody\n\n{% endcut %}\n\n:::',
    ])('does not change subsequent rendering or resources: %s', (source) => {
        const run = (observe: boolean) => {
            const md = new MarkdownIt().use(transform({bundle: false, directiveSyntax: 'enabled'}));
            if (observe) {
                md.core.ruler.before('cut', 'observe-legacy-cut', (state) => {
                    const before = JSON.stringify(state.tokens);
                    state.tokens.forEach((_, index) => recognizeCutBoundary(state.tokens, index));
                    expect(JSON.stringify(state.tokens)).toBe(before);
                });
            }
            const env = {};
            const tokens = md.parse(source, env);
            return {tokens, env, html: md.renderer.render(tokens, md.options, env)};
        };
        expect(run(true)).toEqual(run(false));
    });
});
