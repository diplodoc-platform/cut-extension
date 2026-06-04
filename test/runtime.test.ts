// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {YfmCutController} from '../src/runtime/controller';

// `<summary>` is not focusable on its own in jsdom; tabindex makes `.focus()`
// set it as `document.activeElement`, which is what the controller reads on blur.
function buildCollapsedCut() {
    document.body.innerHTML = `
        <details class="yfm-cut">
            <summary class="yfm-cut-title" tabindex="-1">Title</summary>
            <div class="yfm-cut-content">Content</div>
        </details>`;

    const details = document.querySelector('details.yfm-cut') as HTMLDetailsElement;
    const summary = document.querySelector('summary.yfm-cut-title') as HTMLElement;
    return {details, summary};
}

// Real `.focus()`: sets `document.activeElement` and dispatches a `focus` event
// the capture-phase listener on `document` receives. This mirrors the browser,
// where the restored focus the controller suppresses goes through activeElement.
const focusElement = (element: HTMLElement) => element.focus();

// Re-focusing the already-active element is a no-op in jsdom (no second event).
// Drop focus first so the next `.focus()` dispatches, mirroring a genuine
// re-focus after the browser-restored one.
const refocus = (element: HTMLElement) => {
    (document.activeElement as HTMLElement | null)?.blur();
    element.focus();
};

// Window blur leaves `document.activeElement` intact, exactly as a real browser
// does when another window takes focus; only the window is no longer active.
const blurWindow = () => window.dispatchEvent(new Event('blur'));

describe('YfmCutController - focus on tab return', () => {
    let controller: YfmCutController;

    beforeEach(() => {
        controller = new YfmCutController();
    });

    afterEach(() => {
        controller.dispose();
        document.body.innerHTML = '';
    });

    it('keeps the cut collapsed when the browser restores focus to it on tab return', () => {
        const {details, summary} = buildCollapsedCut();

        // The summary was active, the window lost focus, then the browser
        // re-focuses that same summary on return.
        focusElement(summary); // becomes the active element
        details.open = false; // user had it collapsed
        blurWindow();
        refocus(summary); // browser-restored focus: suppressed

        expect(details.open).toBe(false);
    });

    it('opens the cut on focus without a preceding window blur (anchor case)', () => {
        const {details, summary} = buildCollapsedCut();

        // Navigating to `#anchor` inside a collapsed cut focuses the summary
        // within the active tab, no window blur involved.
        focusElement(summary);

        expect(details.open).toBe(true);
    });

    it('suppresses only the restored focus, the next focus opens', () => {
        const {details, summary} = buildCollapsedCut();

        focusElement(summary);
        details.open = false;
        blurWindow();
        refocus(summary); // restored focus: suppressed
        expect(details.open).toBe(false);

        refocus(summary); // genuine focus again: opens
        expect(details.open).toBe(true);
    });

    it('opens another cut focused on tab return (multi-cut)', () => {
        document.body.innerHTML = `
            <details class="yfm-cut" id="a">
                <summary class="yfm-cut-title" tabindex="-1">A</summary>
                <div class="yfm-cut-content">A</div>
            </details>
            <details class="yfm-cut" id="b">
                <summary class="yfm-cut-title" tabindex="-1">B</summary>
                <div class="yfm-cut-content">B</div>
            </details>`;
        const detailsB = document.querySelector('#b') as HTMLDetailsElement;
        const summaryA = document.querySelector('#a summary') as HTMLElement;
        const summaryB = document.querySelector('#b summary') as HTMLElement;

        // Cut A was active on blur; on return the user tabs onto cut B.
        focusElement(summaryA);
        blurWindow();
        focusElement(summaryB);

        expect(detailsB.open).toBe(true);
    });

    it('opens the cut when a non-summary was active on blur', () => {
        const {details, summary} = buildCollapsedCut();
        const input = document.createElement('input');
        document.body.appendChild(input);

        // A non-summary held focus when the window blurred, so there is nothing
        // to restore onto the summary. A later focus on the cut is genuine.
        focusElement(input);
        blurWindow();
        focusElement(summary);

        expect(details.open).toBe(true);
    });

    it('does not let a non-summary focus keep the suppression armed', () => {
        const {details, summary} = buildCollapsedCut();
        const input = document.createElement('input');
        document.body.appendChild(input);

        // Summary active on blur, but on return focus first lands elsewhere;
        // that disarms the pending suppression, so the next focus on the
        // summary opens it.
        focusElement(summary);
        details.open = false;
        blurWindow();
        focusElement(input); // disarms
        refocus(summary); // genuine focus: opens

        expect(details.open).toBe(true);
    });

    it('does not let a click keep the suppression armed', () => {
        const {details, summary} = buildCollapsedCut();

        // Summary active on blur; on return the user clicks somewhere, then
        // later focuses the cut by keyboard. The click disarms suppression.
        focusElement(summary);
        details.open = false;
        blurWindow();
        document.dispatchEvent(new Event('mousedown', {bubbles: true}));
        document.dispatchEvent(new Event('mouseup', {bubbles: true}));
        refocus(summary); // genuine keyboard focus: opens

        expect(details.open).toBe(true);
    });
});
