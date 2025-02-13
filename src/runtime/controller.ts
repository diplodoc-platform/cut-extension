import {ClassName, Selector} from './const';
import {getEventTarget, isCustom} from './utils';

export class YfmCutController {
    private readonly __doc: Document;

    constructor(doc: Document) {
        this.__doc = doc;
        this.__doc.addEventListener('click', this._onDocClick);
    }

    destroy() {
        this.__doc.removeEventListener('click', this._onDocClick);
    }

    focusActiveCut() {
        const cutId = window.location.hash.slice(1);
        const cutNode = document.getElementById(cutId) as HTMLDetailsElement | null;

        if (!(cutNode instanceof HTMLElement) || !cutNode.matches(Selector.CUT)) {
            return;
        }

        cutNode.classList.toggle(ClassName.OPEN);
        cutNode.setAttribute('open', 'true');

        cutNode.classList.add('cut-highlight');
        cutNode.scrollIntoView();

        cutNode.addEventListener('animationend', function removeHighlight() {
            cutNode.classList.remove('cut-highlight');
            cutNode.removeEventListener('animationend', removeHighlight);
        });
    }

    private _onDocClick = (event: MouseEvent) => {
        if (isCustom(event)) {
            return;
        }

        const title = this._findTitleInPath(event);
        if (title) {
            this._toggleCut(title);
        }
    };

    private _findTitleInPath(event: MouseEvent): HTMLElement | undefined {
        const target = getEventTarget(event);
        if (this._matchTitle(target)) {
            return target as HTMLElement;
        }

        const path = event.composedPath?.();
        return path?.find(this._matchTitle) as HTMLElement | undefined;
    }

    private _matchTitle = (target: EventTarget | null) => {
        if (target instanceof HTMLElement) {
            return target?.matches?.(Selector.TITLE);
        }
        return false;
    };

    private _toggleCut(element: HTMLElement) {
        const cutNode = element.parentElement;
        cutNode?.classList.toggle(ClassName.OPEN);
    }
}
