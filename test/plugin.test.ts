import {describe, expect, it} from 'vitest';
import MarkdownIt from 'markdown-it';
import dd from 'ts-dedent';

import * as cutExtension from '../src/plugin';

function render(text: string, opts?: cutExtension.TransformOptions) {
    const md = new MarkdownIt();
    md.use(cutExtension.transform({bundle: false, ...opts}));
    const env: {meta?: {script?: string[]; style?: string[]}} = {};
    const html = md.render(text, env);
    return {html, meta: env.meta};
}

const html = (text: string, opts?: cutExtension.TransformOptions) => render(text, opts).html;

const meta = (text: string, opts?: cutExtension.TransformOptions) => render(text, opts).meta;

const parse = (text: string, opts?: cutExtension.TransformOptions) => {
    const md = new MarkdownIt().use(cutExtension.transform({bundle: false, ...opts}));
    return md.parse(text, {});
};

describe('Cut extension - plugin', () => {
    describe('curly syntax', () => {
        it('should render simple cut', () => {
            expect(
                html(dd`
                {% cut "Cut title" %}

                Cut content

                {% endcut %}
                `),
            ).toMatchSnapshot();
        });

        it('should render simple cut with code in it', () => {
            expect(
                html(dd`
                {% cut "Cut title" %}

                \`\`\`
                Code
                \`\`\`

                {% endcut %}
                `),
            ).toMatchSnapshot();
        });

        it('should render siblings cuts', () => {
            expect(
                html(dd`
                {% cut "Cut title 1" %}

                Cut content 1

                {% endcut %}

                {% cut "Cut title 2" %}

                Cut content 2

                {% endcut %}
                `),
            ).toMatchSnapshot();
        });

        it('should render nested cuts', () => {
            expect(
                html(dd`
                {% cut "Outer title" %}

                Outer content

                {% cut "Inner title" %}

                Inner content

                {% endcut %}

                {% endcut %}
                `),
            ).toMatchSnapshot();
        });

        it('should render title with format', () => {
            expect(
                html(dd`
                {% cut "**Strong cut title**" %}

                Content we want to hide

                {% endcut %}
                `),
            ).toMatchSnapshot();
        });

        it('should close all tags correctly and insert two p tags', () => {
            expect(
                html(dd`
                * {% cut "Cut 1" %}

                  Some text

                  Some text

                  {% endcut %}
                `),
            ).toMatchSnapshot();
        });

        it('should close all tags correctly when given a bullet-list with several items', () => {
            expect(
                html(dd`
                * {% cut "Cut 1" %}

                  Some text

                  {% endcut %}

                * {% cut "Cut 2" %}

                  Some text

                  {% endcut %}

                * {% cut "Cut 3" %}

                  Some text

                  {% endcut %}
                `),
            ).toMatchSnapshot();
        });

        it('should dont add assets to meta if no yfm-cut is found', () => {
            expect(meta('paragraph')).toBeUndefined();
        });

        it('should add default assets to meta', () => {
            expect(
                meta(dd`
                {% cut "Cut title" %}

                Cut content

                {% endcut %}
                `),
            ).toStrictEqual({
                script: ['_assets/cut-extension.js'],
                style: ['_assets/cut-extension.css'],
            });
        });

        it('should add custom assets to meta', () => {
            expect(
                meta(
                    dd`
                    {% cut "Cut title" %}

                    Cut content

                    {% endcut %}
                    `,
                    {runtime: 'yfm-cut'},
                ),
            ).toStrictEqual({
                script: ['yfm-cut'],
                style: ['yfm-cut'],
            });
        });

        it('should add custom assets to meta 2', () => {
            expect(
                meta(
                    dd`
                {% cut "Cut title" %}

                Cut content

                {% endcut %}
                `,
                    {
                        runtime: {script: 'yfm-cut.script', style: 'yfm-cut.style'},
                    },
                ),
            ).toStrictEqual({script: ['yfm-cut.script'], style: ['yfm-cut.style']});
        });

        it('should parse markup with cut to token stream', () => {
            expect(
                parse(dd`


                {% cut "Cut _title_" %}

                Cut content

                {% endcut %}


                `),
            ).toMatchSnapshot();
        });
    });

    describe('directive syntax', () => {
        it('should render directive cut', () => {
            expect(
                html(
                    dd`
                :::cut[Cut title]
                Cut content
                :::
                `,
                    {directiveSyntax: 'only'},
                ),
            ).toMatchSnapshot();
        });

        it('should render nested cut', () => {
            expect(
                html(
                    dd`
                :::cut[Outer title]
                Outer content

                :::cut[Inner title]
                Inner content
                :::
                :::
                `,
                    {directiveSyntax: 'only'},
                ),
            ).toMatchSnapshot();
        });

        it('should render cut with inline markup in title', () => {
            expect(
                html(
                    dd`
                :::cut[**Strong cut title**]
                Content we want to hide
                :::
                `,
                    {directiveSyntax: 'only'},
                ),
            ).toMatchSnapshot();
        });

        it('should dont add assets to meta if no yfm-cut is found', () => {
            expect(meta('paragraph', {directiveSyntax: 'only'})).toBeUndefined();
        });

        it('should add assets to meta', () => {
            expect(
                meta(
                    dd`
                :::cut[Cut title]
                Cut content
                :::
                `,
                    {directiveSyntax: 'only'},
                ),
            ).toStrictEqual({
                script: ['_assets/cut-extension.js'],
                style: ['_assets/cut-extension.css'],
            });
        });

        it('should parse markup with cut to token stream', () => {
            expect(
                parse(
                    dd`


                :::cut[Cut _title_]
                Cut content
                :::


                `,
                    {directiveSyntax: 'only'},
                ),
            ).toMatchSnapshot();
        });

        it('should render cut with empty title', () => {
            expect(
                html(
                    dd`
                :::cut
                Cut content
                :::`,
                    {directiveSyntax: 'only'},
                ),
            ).toMatchSnapshot();
        });

        it('should not render leaf cut', () => {
            expect(
                html(
                    dd`
                ::cut[Title]
                `,
                    {directiveSyntax: 'only'},
                ),
            ).toMatchSnapshot();
        });

        it('should not add assets with leaf cut', () => {
            expect(
                meta(
                    dd`
                ::cut[Title]
                `,
                    {directiveSyntax: 'only'},
                ),
            ).toBeUndefined();
        });
    });

    describe('Options: directiveSyntax', () => {
        const markup = dd`
            {% cut "Old cut" %}

            Old cut content

            {% endcut %}

            :::cut[Directive cut]
            Directive cut content
            :::
            `;

        it('should render only old (curly) cut', () => {
            expect(html(markup, {directiveSyntax: 'disabled'})).toMatchSnapshot();
        });

        it('should render only new (directive) cut', () => {
            expect(html(markup, {directiveSyntax: 'only'})).toMatchSnapshot();
        });

        it('should render both cuts', () => {
            expect(html(markup, {directiveSyntax: 'enabled'})).toMatchSnapshot();
        });
    });
});
