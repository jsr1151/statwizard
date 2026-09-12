import { useCallback, useRef, useState } from 'react';
import { readAnalysisLaunchPayload } from '../utils/analysisLaunch.js';

export default function usePersistentCalculatorDraft({ analysisId, create, read, save, remove }, example) {
    const [initial] = useState(() => {
        const launch = readAnalysisLaunchPayload(analysisId);
        const restored = launch ? null : read();
        return { value: restored || create(example, launch), status: launch ? 'launched' : restored ? 'restored' : 'new' };
    });
    const [state, setState] = useState(initial);
    const current = useRef(initial.value);
    // Called by input events and completed uploads, never inside a React state updater.
    const patch = useCallback(change => {
        const value = { ...current.current, ...(typeof change === 'function' ? change(current.current) : change) };
        current.current = value;
        setState({ value, status: save(value) });
    }, [save]);
    const clear = useCallback(() => {
        const removed = remove();
        setState(previous => ({ ...previous, status: removed ? 'cleared' : 'remove-failed' }));
        return removed;
    }, [remove]);
    return { value: state.value, patch, draft: { status: state.status, clear } };
}
