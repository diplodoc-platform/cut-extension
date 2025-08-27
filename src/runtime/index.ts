import {GLOBAL_KEY} from './const';
import {YfmCutController} from './controller';
import './styles/cut.scss';

export type {CutScrollOptions} from './controller';

if (typeof window !== 'undefined' && !window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = new YfmCutController();
}

declare global {
    interface Window {
        [GLOBAL_KEY]: YfmCutController;
    }
}
