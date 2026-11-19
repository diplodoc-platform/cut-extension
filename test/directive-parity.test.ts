// @vitest-environment jsdom
import {describe, expect, it, vi} from 'vitest';
import MarkdownIt from 'markdown-it';
import {directiveParser, registerContainerDirective} from '@diplodoc/directive';

import {transform} from '../src/plugin';

function render(source: string, onDiagnostic = vi.fn()) {
    const md = new MarkdownIt().use(
        transform({bundle: false, directiveSyntax: 'enabled', onDiagnostic}),
    );
    const env: {meta?: unknown} = {};
    return {html: md.render(source, env), meta: env.meta, onDiagnostic};
}

describe('cut directive parity', () => {
    it('matches the legacy DOM and resources for equivalent attributes', () => {
        const legacy = render(
            '{% cut "**Title**" %}{#anchor .extra open name=group}\n\nBody\n\n{% endcut %}',
        );
        const directive = render(
            ':::cut [**Title**] {id=anchor class=extra open=true name=group}\nBody\n:::',
        );
        const structure = (html: string) => {
            const doc = document.implementation.createHTMLDocument('');
            doc.body.innerHTML = html;
            const element = (node: Element): unknown => ({
                tag: node.tagName,
                attrs: Array.from(node.attributes, ({name, value}) => [name, value]).sort(),
                children: Array.from(node.childNodes).flatMap((child) => {
                    if (child.nodeType === 1) return [element(child as Element)];
                    const text = child.textContent?.trim();
                    return text ? [text] : [];
                }),
            });
            const root = doc.body.firstElementChild;
            if (!root) throw new Error('Expected a cut element');
            return element(root);
        };
        expect(structure(directive.html)).toEqual(structure(legacy.html));
        expect(directive.meta).toEqual(legacy.meta);
    });

    it('retains source maps for old and new wrappers', () => {
        const md = new MarkdownIt().use(transform({bundle: false, directiveSyntax: 'enabled'}));
        const oldTokens = md.parse('{% cut "Title" %}\n\nBody\n\n{% endcut %}', {});
        const newTokens = md.parse(':::cut [Title]\nBody\n:::', {});
        expect(oldTokens.find((token) => token.type === 'yfm_cut_open')?.map).toEqual([0, 1]);
        expect(newTokens.find((token) => token.type === 'yfm_cut_open')?.map).toEqual([0, 3]);
        expect(newTokens.find((token) => token.type === 'yfm_cut_content_open')?.map).toEqual([
            1, 2,
        ]);
    });

    it('maps explicit attributes and inline title to the legacy structure', () => {
        const result = render(
            ':::cut [**Title**] {id=anchor class=extra class=more open=true name=group}\nBody\n:::',
        );
        expect(result.html).toContain(
            '<details class="yfm-cut extra more" id="" name="group" open="true">',
        );
        expect(result.html).toContain(
            '<summary class="yfm-cut-title" id="anchor"><strong>Title</strong></summary>',
        );
        expect(result.html).toContain('<div class="yfm-cut-content">');
        expect(result.meta).toEqual({
            script: ['_assets/cut-extension.js'],
            style: ['_assets/cut-extension.css'],
        });
        expect(result.onDiagnostic).not.toHaveBeenCalled();
    });

    it('omits false open, keeps nested blocks outside title and preserves legacy and new forms together', () => {
        const result = render(
            '{% cut "Legacy" %}\n\nOld\n\n{% endcut %}\n\n:::cut [New] {open=false}\n- nested\n:::',
        );
        expect(result.html.match(/<details/g)).toHaveLength(2);
        expect(result.html).not.toContain('open=');
        expect(result.html).toContain('</summary>\n<div class="yfm-cut-content">\n<ul>');
    });

    it.each(['{unknown=x}', '{id=a id=b}', '{open=maybe}', '{constructor=x}', '{bad}', '(url)'])(
        'reports invalid %s and falls back to ordinary Markdown',
        (parameter) => {
            const source = `:::cut [Title] ${parameter}\nbody\n:::`;
            const result = render(source);
            expect(result.onDiagnostic).toHaveBeenCalledOnce();
            expect(result.onDiagnostic.mock.calls[0][0].line).toBe(1);
            expect(result.html).not.toContain('<details');
            expect(result.html).toContain(':::cut');
            expect(result.meta).toBeUndefined();
        },
    );

    it('keeps a title when an earlier Markdown reference has the same name', () => {
        const result = render('[Title]: /url\n\n:::cut [Title]\nbody\n:::');
        expect(result.html).toContain('<summary class="yfm-cut-title">Title</summary>');
        expect(result.onDiagnostic).not.toHaveBeenCalled();
    });

    it('rejects an explicit reference destination', () => {
        const result = render('[ref]: /url\n\n:::cut [Title][ref]\nbody\n:::');
        expect(result.html).not.toContain('<details');
        expect(result.onDiagnostic).toHaveBeenCalledOnce();
    });

    it('leaves independently parsed nested cuts available in ordinary fallback', () => {
        const result = render(':::cut {unknown=x}\n\n:::cut [nested]\nbody\n:::\n\n:::');
        expect(result.onDiagnostic).toHaveBeenCalledOnce();
        expect(result.html).toContain(':::cut {unknown=x}');
        expect(result.html).toContain('<details class="yfm-cut">');
    });

    it('does not replace a previously registered cut handler', () => {
        const md = new MarkdownIt().use(directiveParser());
        registerContainerDirective(md, 'cut', () => false);
        expect(() => md.use(transform({bundle: false, directiveSyntax: 'enabled'}))).toThrow(
            'Block directive already registered: cut',
        );
    });
});
