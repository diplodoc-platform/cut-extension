import type {CutToken} from './markdown-it';

const CUT_REGEXP = /^{%\s*cut\s*["|'](.*)["|']\s*%}(.*)?$/;

export type CutBoundaryToken = {
    readonly type: string;
    readonly content: string;
    readonly map: readonly [number, number] | null;
};

export type CutBoundary = {
    readonly map: readonly [number, number] | null;
    readonly raw: string;
} & (
    | {readonly kind: 'open'; readonly title: string; readonly rawAttributes: string}
    | {readonly kind: 'close'}
);

export function matchOpenToken(tokens: readonly CutBoundaryToken[], i: number) {
    return (
        tokens[i].type === 'paragraph_open' &&
        tokens[i + 1].type === 'inline' &&
        tokens[i + 1].content.match(CUT_REGEXP)
    );
}

export function matchCloseToken(tokens: readonly CutBoundaryToken[], i: number) {
    return (
        tokens[i].type === 'paragraph_open' &&
        tokens[i + 1].type === 'inline' &&
        tokens[i + 1].content.trim() === '{% endcut %}'
    );
}

/**
 * Classify a canonical legacy edge before semantic token replacement.
 * @param tokens - Original block tokens from the native parser.
 * @param i - Candidate paragraph index.
 * @returns A detached snapshot; pairing and source offsets belong to the caller.
 */
export function recognizeCutBoundary(
    tokens: readonly CutBoundaryToken[],
    i: number,
): CutBoundary | undefined {
    if (!tokens[i] || !tokens[i + 1]) return undefined;
    const match = matchOpenToken(tokens, i);
    const close = !match && matchCloseToken(tokens, i);
    if (!match && !close) return undefined;
    const map = tokens[i].map;
    const common = {map: map ? ([map[0], map[1]] as const) : null, raw: tokens[i + 1].content};
    return match
        ? {kind: 'open', ...common, title: match[1], rawAttributes: match[2] ?? ''}
        : {kind: 'close', ...common};
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
