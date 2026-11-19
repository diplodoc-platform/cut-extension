const assert = require('node:assert/strict');

module.exports = function checkEmptyCutAttrs(MarkdownIt, attrs, transform) {
    const open = '{% cut "Contact support" %}';
    const close = '{% endcut %}';
    const space = '\u00a0';
    const pair = (opening, closing) => [opening, '', closing].join('\n');

    function parser(mode, withCut = true) {
        const md = new MarkdownIt({html: true, breaks: true});
        if (mode !== 'absent') {
            const options = {
                custom: {leftDelimiter: '[[', rightDelimiter: ']]'},
                allowlist: {allowedAttributes: ['id']},
            }[mode];
            md.use(attrs, options);
        }
        if (withCut) md.use(transform({bundle: false}));
        if (mode === 'disabled') md.disable('curly_attributes');
        return md;
    }

    for (const mode of ['on', 'absent', 'disabled', 'custom', 'allowlist']) {
        const md = parser(mode);
        const plain = parser(mode, false);
        const source = pair(open + '\n' + space, close);
        let edges;
        md.core.ruler.before('cut', 'capture_raw_empty_cut', (state) => {
            edges = state.tokens
                .filter((token) => token.type === 'inline')
                .map((token) => ({content: token.content, map: token.map}));
        });
        const parsed = md.parse(source, {}).filter((token) => token.type === 'inline');
        assert.equal(parsed.length, 2);
        parsed.forEach((token, index) => {
            assert.equal(token.content, edges[index].content);
            assert.equal(token.map, edges[index].map);
        });
        assert.doesNotMatch(md.render(source), /<details/);
        assert.equal(md.render(source).includes('{% cut'), !['on', 'allowlist'].includes(mode));
        for (const edge of [' ', '\u00a0', '\u2003', '\u202f']) {
            for (const opening of [
                open,
                open + '{#authored}',
                open.replace('Contact support', "A 'quote'"),
                open.replace('Contact support', '*emphasis*'),
            ]) {
                const padded = pair(edge + opening + '\n' + edge, close + '\n' + edge);
                assert.equal(md.render(padded), plain.render(pair(opening, close)));
            }
        }

        for (const fallback of [
            pair(open + '\nActual text', close),
            open + '\n' + space,
            '```md\n' + source + '\n```',
            '<pre>\n' + source + '\n</pre>',
            pair('{#unrelated}\n' + space, close),
            pair(open + '  \n' + space, close),
            pair(open + '\\\n' + space, close),
            pair(open + '&#160;\n' + space, close),
        ]) {
            assert.equal(md.render(fallback), plain.render(fallback));
        }

        const real = [open, '', '**Form body**', '', close].join('\n');
        const siblings = source + '\n\nBetween\n\n' + real + '\n\nAfter';
        assert.equal(md.render(siblings), md.render(siblings.replace(space, ' ')));
        assert.match(md.render(siblings), /<strong>Form body<\/strong>/);
    }
};
