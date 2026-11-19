import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {legacyPairs} from '../src/plugin/legacy-pairs';
import {transform} from '../src/plugin/transform';

function tokens(sequence: string, onRead?: () => void) {
    return [...sequence].flatMap((symbol) => {
        const token = (type: string, value = '') => ({
            type,
            map: null,
            get content() {
                onRead?.();
                return value;
            },
        });
        if (symbol === '-') return [token('hr')];
        const value = {O: '{% cut "Open" %}\n\u00a0', C: '{% endcut %}', B: 'Body'}[symbol];
        return [token('paragraph_open'), token('inline', value), token('paragraph_close')];
    });
}

describe('legacy Cut pairing', () => {
    // Offsets from the original forward search, including its four-token start.
    it.each<[string, number[][]]>([
        ['OC', []],
        ['OBC', [[0, 6]]],
        [
            'OOBCBC',
            [
                [0, 9],
                [3, 15],
            ],
        ],
        ['OCOBC', [[6, 12]]],
        [
            'OOCC',
            [
                [0, 6],
                [3, 9],
            ],
        ],
        ['OCOCC', [[0, 12]]],
        [
            'O-COBC',
            [
                [0, 4],
                [7, 13],
            ],
        ],
        [
            'OOCOBCC',
            [
                [0, 6],
                [3, 18],
                [9, 15],
            ],
        ],
        ['OOBC', [[0, 9]]],
    ])('retains the claiming order for %s', (sequence, expected) => {
        const openings = legacyPairs(tokens(sequence));
        const pairs = [...(openings ?? [])].flatMap(([open, {close}]) =>
            close === undefined ? [] : [[open, close]],
        );
        expect(pairs).toEqual(expected);
    });

    it.each(['', 'C'])('reads repeated empty cuts linearly, with trailing %s', (trailing) => {
        for (const size of [16, 32, 64, 128]) {
            let reads = 0;
            legacyPairs(tokens('OC'.repeat(size) + trailing, () => reads++));
            expect(reads).toBeLessThanOrEqual(4 * size + 4);
        }
    });

    it('retains the block token array and processes titles in source order', () => {
        const md = new MarkdownIt().use(transform({bundle: false}));
        let original: ReturnType<typeof md.parse> | undefined;
        md.core.ruler.before('cut', 'remember-block-array', (state) => {
            if (!state.inlineMode) original = state.tokens;
        });
        const result = md.parse(
            '{% cut "Outer" %}\n\n{% cut "Inner" %}\n\nInner body\n\n{% endcut %}\n\nTail\n\n{% endcut %}',
            {},
        );
        expect(result).toBe(original);
        expect(
            result.filter((token) => token.type === 'inline').map((token) => token.content),
        ).toEqual(['Outer', 'Inner', 'Inner body', 'Tail']);
    });
});
