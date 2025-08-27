import {Selector} from './const';

export class YfmCutController {
    focusActiveCut() {
        const cutId = window.location.hash.slice(1);
        const cutNode = document.getElementById(cutId) as HTMLDetailsElement | null;

        if (!(cutNode instanceof HTMLElement)) {
            return;
        }

        if (!cutNode.matches(Selector.CUT)) {
            return;
        }

        cutNode.classList.toggle(ClassName.OPEN);
        cutNode.setAttribute('open', 'true');

        setTimeout(() => {
            cutNode.classList.add('cut-highlight');
            cutNode.scrollIntoView();
        }, 70);

        setTimeout(() => {
            cutNode.classList.remove('cut-highlight');
        }, 1000);
    }
}
