import {ClassName, Selector} from './const';
import {getEventTarget, isCustom} from './utils';

export class YfmCutContoller {
    private readonly __doc: Document;

    constructor(doc: Document) {
        this.__doc = doc;
        this.__doc.addEventListener('click', this._onDocClick);
    }

    destroy() {
        this.__doc.removeEventListener('click', this._onDocClick);
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
