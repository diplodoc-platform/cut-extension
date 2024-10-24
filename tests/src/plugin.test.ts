import transform from '@diplodoc/transform';
import dedent from 'ts-dedent';

import * as cutExtension from '../../src/plugin';

const html = (text: string, opts?: cutExtension.TransformOptions) => {
    const {result} = transform(text, {
        plugins: [cutExtension.transform({bundle: false, ...opts})],
    });

    return result.html;
};

const meta = (text: string, opts?: cutExtension.TransformOptions) => {
    const {result} = transform(text, {
        plugins: [cutExtension.transform({bundle: false, ...opts})],
    });

    return result.meta;
};

describe('Cut extension - plugin', () => {
    it('should render simple cut', () => {
        expect(
            html(dedent`
            {% cut "Cut title" %}

            Cut content

            {% endcut %}
        `),
        ).toMatchSnapshot();
    });

    it('should render simple cut with code in it', () => {
        expect(
            html(dedent`
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
            html(dedent`
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
            html(dedent`
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
            html(dedent`
            {% cut "**Strong cut title**" %}

            Content we want to hide

            {% endcut %}
        `),
        ).toMatchSnapshot();
    });

    it('should close all tags correctly and insert two p tags', () => {
        expect(
            html(dedent`
            * {% cut "Cut 1" %}

              Some text

              Some text

              {% endcut %}
        `),
        ).toMatchSnapshot();
    });

    it('should close all tags correctly when given a bullet-list with several items', () => {
        expect(
            html(dedent`
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
            meta(dedent`
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
                dedent`
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
                dedent`
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
});
