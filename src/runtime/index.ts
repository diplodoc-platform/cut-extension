import {GLOBAL_KEY} from './const';
import {YfmCutController} from './controller';

import './styles/cut.scss';

if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = new YfmCutController(document);
}

declare global {
    interface Window {
        [GLOBAL_KEY]: YfmCutController;
    }
}
