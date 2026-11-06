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
        // Native parsers differ in whether they retain paragraph-edge Unicode whitespace.
        tokens[i + 1].content.trim().match(CUT_REGEXP)
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
 * Keep native13's inline representation of a standalone, unrendered empty Cut.
 * @param tokens - Original block tokens.
 * @param i - Unrendered opening paragraph offset.
 * @param attributes - Raw suffix after the opening marker.
 * @returns Nothing. Updates inline children in place and keeps the raw content and line maps.
 */
export function normalizeEmptyCutEdges(tokens: CutToken[], i: number, attributes: string): void {
    if (
        tokens[i + 2]?.type !== 'paragraph_close' ||
        tokens[i + 5]?.type !== 'paragraph_close' ||
        !matchCloseToken(tokens, i + 3)
    ) {
        return;
    }
    const tail = attributes.trim();
    if (tail && !(tail.startsWith('{') && tail.endsWith('}'))) return;

    // An authored hard break may come from a literal backslash. Leave that fallback untouched.
    const boundaries = [tokens[i + 1], tokens[i + 4]];
    if (boundaries.some(({children}) => children?.some((child) => child.type === 'hardbreak'))) {
        return;
    }
    for (const inline of boundaries) {
        const children = inline.children;
        if (!children || inline.content === inline.content.trim()) continue;

        const padding = (child: (typeof children)[number]) =>
            child.type === 'softbreak' || (child.type === 'text' && !child.content.trim());
        let start = 0;
        let end = children.length;
        while (start < end && padding(children[start])) start++;
        while (end > start && padding(children[end - 1])) end--;
        if (start === end) continue;

        const first = children[start];
        const last = children[end - 1];
        if (first.type === 'text') first.content = first.content.trimStart();
        if (last.type === 'text') last.content = last.content.trimEnd();
        if (start || end !== children.length) inline.children = children.slice(start, end);
    }
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
