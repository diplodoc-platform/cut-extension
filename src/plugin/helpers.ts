import type {CutToken} from './markdown-it';

const CUT_REGEXP = /^{%\s*cut\s*["|'](.*)["|']\s*%}(.*)?$/;

export function matchOpenToken(tokens: CutToken[], i: number) {
    return (
        tokens[i].type === 'paragraph_open' &&
        tokens[i + 1].type === 'inline' &&
        tokens[i + 1].content.match(CUT_REGEXP)
    );
}

export function matchCloseToken(tokens: CutToken[], i: number) {
    return (
        tokens[i].type === 'paragraph_open' &&
        tokens[i + 1].type === 'inline' &&
        tokens[i + 1].content.trim() === '{% endcut %}'
    );
}

export function findCloseTokenIdx(tokens: CutToken[], idx: number) {
    let level = 0;
    let i = idx;
    while (i < tokens.length) {
        if (matchOpenToken(tokens, i)) {
            level++;
        } else if (matchCloseToken(tokens, i)) {
            if (level === 0) {
                return i;
            }
            level--;
        }

        i++;
    }

    return null;
}
