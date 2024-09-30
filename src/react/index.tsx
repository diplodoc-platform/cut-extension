import {useEffect} from 'react';

import {GLOBAL_KEY} from '../runtime/const';

export const CutRuntime = () => {
    useEffect(() => {
        window[GLOBAL_KEY].focusActiveCut();
    });

    return false;
};
