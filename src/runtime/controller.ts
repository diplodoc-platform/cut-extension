import {ClassNames} from '../plugin/const';

export class YfmCutController {
    private disposers: Function[] = [];

    constructor() {
        this.disposers.push(this.init());
    }

    init() {
        let mouseEvent = false;
        // Summary whose browser-restored focus we ignore once after a blur.
        let summaryAtBlur: EventTarget | null = null;
        const keepMouse = () => {
            mouseEvent = true;
            // A click is a deliberate action: drop any pending suppression.
            summaryAtBlur = null;
        };
        const amendMouse = () => {
            mouseEvent = false;
        };
        const onWindowBlur = () => {
            // On window re-focus the browser restores focus to whatever was
            // active here, so read it straight off `document.activeElement`.
            const active = document.activeElement;
            summaryAtBlur = isSummary(active) ? active : null;
        };
        const onFocus = (event: Event) => {
            // Suppress one restored focus; any other focus disarms it first.
            const restored = event.target === summaryAtBlur;
            summaryAtBlur = null;
            if (restored) {
                return;
            }

            if (isSummary(event.target) && !mouseEvent) {
                this.focusActiveCut(event.target);
            }
        };

        window.addEventListener('blur', onWindowBlur);
        document.addEventListener('mousedown', keepMouse);
        document.addEventListener('mouseup', amendMouse);
        document.addEventListener('focus', onFocus, true);

        return () => {
            window.removeEventListener('blur', onWindowBlur);
            document.removeEventListener('mousedown', keepMouse);
            document.removeEventListener('mouseup', amendMouse);
            document.removeEventListener('focus', onFocus, true);
        };
    }

    dispose() {
        for (const disposer of this.disposers) {
            disposer();
        }
    }

    private focusActiveCut(summary: HTMLElement) {
        const cutNode = summary.parentNode;
        if (!isDetails(cutNode)) {
            return;
        }

        let node: HTMLElement | null = cutNode;
        while (node) {
            if (isDetails(node)) {
                node.open = true;
            }
            node = node.parentElement;
        }

        setTimeout(() => {
            cutNode.classList.add(ClassNames.Highlight);
        }, 70);

        setTimeout(() => {
            cutNode.classList.remove(ClassNames.Highlight);
        }, 1000);
    }
}

function isDetails(element: unknown): element is HTMLDetailsElement {
    return (
        (element as HTMLElement)?.tagName?.toLowerCase() === 'details' &&
        (element as HTMLElement)?.classList.contains(ClassNames.Cut)
    );
}

function isSummary(element: unknown): element is HTMLElement {
    return (
        (element as HTMLElement)?.tagName?.toLowerCase() === 'summary' &&
        (element as HTMLElement)?.classList.contains(ClassNames.Title)
    );
}
