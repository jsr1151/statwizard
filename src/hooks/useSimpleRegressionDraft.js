import { useCallback, useRef, useState } from 'react';
import { readAnalysisLaunchPayload } from '../utils/analysisLaunch.js';
import { createSimpleRegressionDraft, readSimpleRegressionDraft, saveSimpleRegressionDraft, removeSimpleRegressionDraft } from '../utils/simpleRegressionDraft.js';

export default function useSimpleRegressionDraft(example) {
    const [initial] = useState(() => {
        const launch = readAnalysisLaunchPayload('simple_regression');
        const restored = launch ? null : readSimpleRegressionDraft();
        return { value: restored || createSimpleRegressionDraft(example, launch), status: launch ? 'launched' : restored ? 'restored' : 'new' };
    });
    const [state, setState] = useState(initial);
    const current = useRef(initial.value);
    // Called by input events and completed uploads, never inside a React state updater.
    const patch = useCallback(change => {
        const value = { ...current.current, ...(typeof change === 'function' ? change(current.current) : change) };
        current.current = value;
        setState({ value, status: saveSimpleRegressionDraft(value) });
    }, []);
    const clear = useCallback(() => {
        const removed = removeSimpleRegressionDraft();
        setState(previous => ({ ...previous, status: removed ? 'cleared' : 'remove-failed' }));
        return removed;
    }, []);
    return { value: state.value, patch, draft: { status: state.status, clear } };
}
