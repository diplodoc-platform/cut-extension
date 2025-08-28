import {ClassNames} from '../plugin/const';

export class YfmCutController {
    private disposers: Function[] = [];

    constructor() {
        this.disposers.push(this.init());
    }

    init() {
        let mouseEvent = false;
        const keepMouse = () => {
            mouseEvent = true;
        };
        const amendMouse = () => {
            mouseEvent = false;
        };
        const onFocus = (event: Event) => {
            if (isSummary(event.target) && !mouseEvent) {
                this.focusActiveCut(event.target);
            }
        };

        document.addEventListener('mousedown', keepMouse);
        document.addEventListener('mouseup', amendMouse);
        document.addEventListener('focus', onFocus, true);

        return () => {
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

        setTimeout(() => {
            cutNode.classList.add(ClassNames.Highlight);
        }, 70);

        setTimeout(() => {
            cutNode.classList.remove(ClassNames.Highlight);
        }, 1000);
    }
}

function isDetails(element: unknown): element is HTMLElement {
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
