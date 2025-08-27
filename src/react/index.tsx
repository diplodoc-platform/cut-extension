import type {CutScrollOptions} from '../runtime';

import {useEffect} from 'react';

import {GLOBAL_KEY} from '../runtime/const';

export const CutRuntime = (options: Partial<CutScrollOptions> = {}) => {
    useEffect(() => {
        window[GLOBAL_KEY].focusActiveCut(options);
    });

    return false;
};
