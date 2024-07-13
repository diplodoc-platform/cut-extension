import transform from '@diplodoc/transform';

import * as cutExtension from '../src/plugin';

const transformYfm = (text: string, opts?: cutExtension.TransformOptions) => {
    const {
        result,
    } = transform(text, {
        plugins: [cutExtension.transform({bundle: false, ...opts})],
    });
    return result;
};

describe('Cut extension - plugin', () => {
    describe.each([
        {name: 'curly syntax', syntax: 'curly'},
        {name: 'directive syntax', syntax: 'directive'}
    ] as const)('$name', ({syntax}) => {

        it('should render simple cut', () => {
            const markup = {
                curly: '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}',
                directive: '::: cut [Cut title]\n' + '\n' + 'Cut content\n' + '\n' + ':::',
            };

            expect(
                transformYfm(markup[syntax]).html.replace(/(\r\n|\n|\r)/gm, ''),
            ).toBe(
                '<div class="yfm-cut"><div class="yfm-cut-title">Cut title</div>' +
                    '<div class="yfm-cut-content"><p>Cut content</p>' +
                    '</div></div>',
            );
        });
    
        it('should render simple cut with code in it', () => {
            const markup = {
                curly: '{% cut "Cut title" %}\n' +
                        '\n' +
                        '```\n' +
                        'Code\n' +
                        '```\n' +
                        '\n' +
                        '{% endcut %}',
                directive: '::: cut [Cut title]\n' +
                            '\n' +
                            '```\n' +
                            'Code\n' +
                            '```\n' +
                            '\n' +
                            ':::',
            };

            expect(
                transformYfm(markup[syntax]).html.replace(/(\r\n|\n|\r)/gm, ''),
            ).toBe(
                '<div class="yfm-cut"><div class="yfm-cut-title">Cut title</div>' +
                    '<div class="yfm-cut-content"><pre><code>Code</code></pre>' +
                    '</div></div>',
            );
        });
    
        it('should render siblings cuts', () => {
            const markup = {
                curly: '{% cut "Cut title 1" %}\n' +
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
                directive: '::: cut [Cut title 1]\n' +
                            '\n' +
                            'Cut content 1\n' +
                            '\n' +
                            ':::\n' +
                            '\n' +
                            '::: cut [Cut title 2]\n' +
                            '\n' +
                            'Cut content 2\n' +
                            '\n' +
                            ':::',
            };

            expect(
                transformYfm(markup[syntax]).html.replace(/(\r\n|\n|\r)/gm, ''),
            ).toBe(
                '<div class="yfm-cut"><div class="yfm-cut-title">Cut title 1</div>' +
                    '<div class="yfm-cut-content"><p>Cut content 1</p></div>' +
                    '</div>' +
                    '<div class="yfm-cut"><div class="yfm-cut-title">Cut title 2</div>' +
                    '<div class="yfm-cut-content"><p>Cut content 2</p></div>' +
                    '</div>',
            );
        });
    
        it('should render nested cuts', () => {
            const markup = {
                curly: '{% cut "Outer title" %}\n' +
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
                directive: '::: cut [Outer title]\n' +
                            '\n' +
                            'Outer content\n' +
                            '\n' +
                            '::: cut [Inner title]\n' +
                            '\n' +
                            'Inner content\n' +
                            '\n' +
                            ':::\n' +
                            '\n' +
                            ':::',
            };

            expect(
                transformYfm(markup[syntax]).html.replace(/(\r\n|\n|\r)/gm, ''),
            ).toBe(
                '<div class="yfm-cut"><div class="yfm-cut-title">Outer title</div>' +
                    '<div class="yfm-cut-content"><p>Outer content</p>' +
                    '<div class="yfm-cut"><div class="yfm-cut-title">Inner title</div>' +
                    '<div class="yfm-cut-content"><p>Inner content</p></div>' +
                    '</div></div></div>',
            );
        });
    
        it('should render title with format', () => {
            const markup = {
                curly: '{% cut "**Strong cut title**" %}\n' +
                        '\n' +
                        'Content we want to hide\n' +
                        '\n' +
                        '{% endcut %}',
                directive: '::: cut [**Strong cut title**]\n' +
                            '\n' +
                            'Content we want to hide\n' +
                            '\n' +
                            ':::',
            };

            expect(
                transformYfm(markup[syntax]).html.replace(/(\r\n|\n|\r)/gm, ''),
            ).toBe(
                '<div class="yfm-cut">' +
                    '<div class="yfm-cut-title"><strong>Strong cut title</strong></div>' +
                    '<div class="yfm-cut-content"><p>Content we want to hide</p></div>' +
                    '</div>',
            );
        });
    
        it('should close all tags correctly and insert two p tags', () => {
            const markup = {
                curly: '* {% cut "Cut 1" %}\n' +
                        '\n' +
                        '  Some text\n' +
                        '\n' +
                        '  Some text\n' +
                        '\n' +
                        '{% endcut %}',
                directive: '* ::: cut [Cut 1]\n' +
                            '\n' +
                            '  Some text\n' +
                            '\n' +
                            '  Some text\n' +
                            '\n' +
                            ':::',
            }

            expect(
                transformYfm(markup[syntax]).html.replace(/(\r\n|\n|\r)/gm, ''),
            ).toBe(
                '<ul><li><div class="yfm-cut"><div class="yfm-cut-title">Cut 1</div>' +
                    '<div class="yfm-cut-content"><p>Some text</p><p>Some text</p></div></div></li></ul>',
            );
        });
    
        it('should close all tags correctly when given a bullet-list with several items', () => {
            const markup = {
                curly: '* {% cut "Cut 1" %}\n' +
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
                directive: '* ::: cut [Cut 1]\n' +
                        '\n' +
                        '  Some text\n' +
                        '\n' +
                        '  :::' +
                        '\n' +
                        '* ::: cut [Cut 2]\n' +
                        '\n' +
                        '  Some text\n' +
                        '\n' +
                        '  :::' +
                        '\n' +
                        '* ::: cut [Cut 3]\n' +
                        '\n' +
                        '  Some text\n' +
                        '\n' +
                        ':::',
            };

            expect(
                transformYfm(markup[syntax]).html.replace(/(\r\n|\n|\r)/gm, ''),
            ).toBe(
                '<ul><li><div class="yfm-cut"><div class="yfm-cut-title">Cut 1</div>' +
                    '<div class="yfm-cut-content"><p>Some text</p></div></div></li>' +
                    '<li><div class="yfm-cut"><div class="yfm-cut-title">Cut 2</div>' +
                    '<div class="yfm-cut-content"><p>Some text</p></div></div></li>' +
                    '<li><div class="yfm-cut"><div class="yfm-cut-title">Cut 3</div>' +
                    '<div class="yfm-cut-content"><p>Some text</p></div></div></li></ul>',
            );
        });
    
        it('should add default assets to meta', () => {
            const markup = {
                curly: '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}',
                directive: '::: cut [Cut title]\n' + '\n' + 'Cut content\n' + '\n' + ':::',
            };
            expect(
                transformYfm(markup[syntax]).meta
            ).toStrictEqual({ script: ['_assets/cut-extension.js'], style: ['_assets/cut-extension.css'] });
        });
    
        it('should add custom assets to meta', () => {
            const markup = {
                curly: '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}',
                directive: '::: cut [Cut title]\n' + '\n' + 'Cut content\n' + '\n' + ':::',
            };
            expect(
                transformYfm(markup[syntax], {runtime: 'yfm-cut'}).meta
            ).toStrictEqual({ script: ['yfm-cut'], style: ['yfm-cut'] });
        });
    
        it('should add custom assets to meta 2', () => {
            const markup = {
                curly: '{% cut "Cut title" %}\n' + '\n' + 'Cut content\n' + '\n' + '{% endcut %}',
                directive: '::: cut [Cut title]\n' + '\n' + 'Cut content\n' + '\n' + ':::',
            };
            expect(
                transformYfm(markup[syntax], {runtime: {script: 'yfm-cut.script', style: 'yfm-cut.style'}}).meta
            ).toStrictEqual({ script: ['yfm-cut.script'], style: ['yfm-cut.style'] });
        });
    });

    it('should dont add assets to meta if no yfm-cut is found', () => {
        const markup = 'paragraph';
        expect(transformYfm(markup).meta).toBeUndefined();
    });
});
