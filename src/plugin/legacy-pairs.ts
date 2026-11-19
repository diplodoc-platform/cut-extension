import type {CutBoundaryToken} from './helpers';

import {matchCloseToken, matchOpenToken} from './helpers';

type Opening = {match: RegExpMatchArray; close?: number; next?: Opening};
type Queue = {first: Opening; last: Opening};

/**
 * Pair original boundaries in the order in which the legacy rule claimed closing markers.
 * Its four-token offset can skip a nested opener at the start of a body, so a stack of
 * syntactically nested markers would change the output. At the same scan depth the oldest
 * eligible opener claims the closer first. Later searches skip that claimed closer,
 * so their queue follows the scan to the next lower level without changing their order.
 * @param tokens - Original block tokens.
 * @returns Openings and their optional closing positions, or nothing when there are no openings.
 */
export function legacyPairs(tokens: readonly CutBoundaryToken[]) {
    const first = tokens.findIndex((_, index) => matchOpenToken(tokens, index));
    if (first < 0) return;

    const openings = new Map<number, Opening>();
    const waiting = new Map<number, Queue>();
    let level = 0;
    for (let i = first; i < tokens.length; i++) {
        // The original search starts four tokens after the opener, past the next block's first token.
        const ready = openings.get(i - 4);
        if (ready) {
            const queue = waiting.get(level);
            if (queue) {
                queue.last.next = ready;
                queue.last = ready;
            } else {
                waiting.set(level, {first: ready, last: ready});
            }
        }

        const match = matchOpenToken(tokens, i);
        if (match) {
            openings.set(i, {match});
            level++;
        } else if (matchCloseToken(tokens, i)) {
            const queue = waiting.get(level);
            if (queue) {
                const winner = queue.first;
                winner.close = i;
                waiting.delete(level);
                // Only earlier searches saw this closer. The remaining searches skip the claimed edge.
                if (winner.next) {
                    const older = waiting.get(level - 1);
                    if (older) {
                        older.last.next = winner.next;
                        older.last = queue.last;
                    } else {
                        waiting.set(level - 1, {first: winner.next, last: queue.last});
                    }
                }
            }
            level--;
        }
    }
    return openings;
}
