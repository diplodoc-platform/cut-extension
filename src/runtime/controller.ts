import {Selector} from './const';

export type CutScrollOptions = {
    offset: number;
    behavior: 'smooth' | 'instant' | 'auto';
};

export class YfmCutController {
    focusActiveCut(options: Partial<CutScrollOptions> = {}) {
        const cutId = window.location.hash.slice(1);
        if (!cutId) {
            return;
        }

        const cutNode = document.getElementById(cutId) as HTMLDetailsElement | null;
        if (!(cutNode instanceof HTMLElement) || !cutNode.matches(Selector.CUT)) {
            return;
        }

        this.openCut(cutNode);

        setTimeout(() => {
            cutNode.classList.add('cut-highlight');
            scrollIntoView(cutNode, options);
        }, 70);

        setTimeout(() => {
            cutNode.classList.remove('cut-highlight');
        }, 1000);
    }

    private openCut(element: HTMLElement) {
        let node: HTMLElement | null | undefined = element.closest<HTMLElement>(Selector.CUT);
        if (!node) {
            return;
        }

        while (node) {
            node.setAttribute('open', 'true');
            node = node.parentElement?.closest(Selector.CUT);
        }
    }
}

function scrollIntoView(element: Element, options: Partial<CutScrollOptions>) {
    const {offset, behavior} = {offset: 0, behavior: 'instant' as const, ...options};
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    if (window.scrollY - offset < elementPosition) {
        return;
    }

    window.scrollTo({
        top: offsetPosition,
        behavior,
    });
}
