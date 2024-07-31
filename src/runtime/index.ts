import {GLOBAL_KEY} from './const';
import {YfmCutContoller} from './contoller';

import './styles/cut.scss';

if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = new YfmCutContoller(document);
}

declare global {
    interface Window {
        [GLOBAL_KEY]: YfmCutContoller;
    }
}
