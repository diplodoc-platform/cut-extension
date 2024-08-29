import transform from '@diplodoc/transform';

import * as cutExtension from '../../src/plugin';

const transformYfm = (text: string, opts?: cutExtension.TransformOptions) => {
    const {result} = transform(text, {
        plugins: [cutExtension.transform({bundle: false, ...opts})],
    });
    return result;
};

describe('Cut extension - plugin', () => {
    it('should render simple cut', () => {
        expect(
            transformYfm(
                '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}',
            ).html.replace(/(\r\n|\n|\r)/gm, ''),
        ).toBe(
            '<details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Cut title</summary>' +
                '<div class="yfm-cut-content"><p>Cut content</p></div>' +
                '</details>',
        );
    });

    it('should render simple cut with code in it', () => {
        expect(
            transformYfm(
                '{% cut "Cut title" %}\n' +
                    '\n' +
                    '```\n' +
                    'Code\n' +
                    '```\n' +
                    '\n' +
                    '{% endcut %}',
            ).html.replace(/(\r\n|\n|\r)/gm, ''),
        ).toBe(
            '<details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Cut title</summary>' +
                '<div class="yfm-cut-content">' +
                '<pre><code>Code</code></pre>' +
                '</div>' +
                '</details>',
        );
    });

    it('should render siblings cuts', () => {
        expect(
            transformYfm(
                '{% cut "Cut title 1" %}\n' +
                    '\n' +
                    'Cut content 1\n' +
                    '\n' +
                    '{% endcut %}\n' +
                    '\n' +
                    '{% cut "Cut title 2" %}\n' +
                    '\n' +
                    'Cut content 2\n' +
                    '\n' +
                    '{% endcut %}',
            ).html.replace(/(\r\n|\n|\r)/gm, ''),
        ).toBe(
            '<details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Cut title 1</summary>' +
                '<div class="yfm-cut-content"><p>Cut content 1</p>' +
                '</div></details>' +
                '<details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Cut title 2</summary>' +
                '<div class="yfm-cut-content">' +
                '<p>Cut content 2</p>' +
                '</div></details>',
        );
    });

    it('should render nested cuts', () => {
        expect(
            transformYfm(
                '{% cut "Outer title" %}\n' +
                    '\n' +
                    'Outer content\n' +
                    '\n' +
                    '{% cut "Inner title" %}\n' +
                    '\n' +
                    'Inner content\n' +
                    '\n' +
                    '{% endcut %}\n' +
                    '\n' +
                    '{% endcut %}',
            ).html.replace(/(\r\n|\n|\r)/gm, ''),
        ).toBe(
            '<details class="yfm-cut"><summary class="yfm-cut-title">' +
                'Outer title</summary><div class="yfm-cut-content">' +
                '<p>Outer content</p><details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Inner title</summary>' +
                '<div class="yfm-cut-content"><p>Inner content</p>' +
                '</div></details></div></details>',
        );
    });

    it('should render title with format', () => {
        expect(
            transformYfm(
                '{% cut "**Strong cut title**" %}\n' +
                    '\n' +
                    'Content we want to hide\n' +
                    '\n' +
                    '{% endcut %}',
            ).html.replace(/(\r\n|\n|\r)/gm, ''),
        ).toBe(
            '<details class="yfm-cut"><summary class="yfm-cut-title">' +
                '<strong>Strong cut title</strong>' +
                '</summary><div class="yfm-cut-content">' +
                '<p>Content we want to hide</p>' +
                '</div></details>',
        );
    });

    it('should close all tags correctly and insert two p tags', () => {
        expect(
            transformYfm(
                '* {% cut "Cut 1" %}\n' +
                    '\n' +
                    '  Some text\n' +
                    '\n' +
                    '  Some text\n' +
                    '\n' +
                    '{% endcut %}',
            ).html.replace(/(\r\n|\n|\r)/gm, ''),
        ).toBe(
            '<ul><li>' +
                '<details class="yfm-cut"><summary class="yfm-cut-title">Cut 1</summary>' +
                '<div class="yfm-cut-content"><p>Some text</p>' +
                '<p>Some text</p>' +
                '</div></details></li></ul>',
        );
    });

    it('should close all tags correctly when given a bullet-list with several items', () => {
        expect(
            transformYfm(
                '* {% cut "Cut 1" %}\n' +
                    '\n' +
                    '  Some text\n' +
                    '\n' +
                    '  {% endcut %}' +
                    '\n' +
                    '* {% cut "Cut 2" %}\n' +
                    '\n' +
                    '  Some text\n' +
                    '\n' +
                    '  {% endcut %}' +
                    '\n' +
                    '* {% cut "Cut 3" %}\n' +
                    '\n' +
                    '  Some text\n' +
                    '\n' +
                    '{% endcut %}',
            ).html.replace(/(\r\n|\n|\r)/gm, ''),
        ).toBe(
            '<ul><li>' +
                '<details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Cut 1</summary>' +
                '<div class="yfm-cut-content"><p>Some text</p></div>' +
                '</details></li>' +
                '<li><details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Cut 2</summary><div class="yfm-cut-content">' +
                '<p>Some text</p></div></details></li><li><details class="yfm-cut">' +
                '<summary class="yfm-cut-title">Cut 3</summary>' +
                '<div class="yfm-cut-content"><p>Some text</p></div></details></li></ul>',
        );
    });

    it('should dont add assets to meta if no yfm-cut is found', () => {
        const markup = 'paragraph';
        expect(transformYfm(markup).meta).toBeUndefined();
    });

    it('should add default assets to meta', () => {
        const markup = '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}';
        expect(transformYfm(markup).meta).toStrictEqual({
            script: ['_assets/cut-extension.js'],
            style: ['_assets/cut-extension.css'],
        });
    });

    it('should add custom assets to meta', () => {
        const markup = '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}';
        expect(transformYfm(markup, {runtime: 'yfm-cut'}).meta).toStrictEqual({
            script: ['yfm-cut'],
            style: ['yfm-cut'],
        });
    });

    it('should add custom assets to meta 2', () => {
        const markup = '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}';
        expect(
            transformYfm(markup, {runtime: {script: 'yfm-cut.script', style: 'yfm-cut.style'}})
                .meta,
        ).toStrictEqual({script: ['yfm-cut.script'], style: ['yfm-cut.style']});
    });
});
