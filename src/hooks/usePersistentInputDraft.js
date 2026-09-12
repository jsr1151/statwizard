import { useState } from 'react';
import { MAX_DRAFT_CHARACTERS, readInputDraft, removeInputDraft, saveInputDraft } from '../utils/inputDraftStorage.js';

export default function usePersistentInputDraft(id, initialValue) {
    const [state, setState] = useState(() => {
        const restored = readInputDraft(id);
        return { value: restored || initialValue, status: restored ? 'restored' : 'new' };
    });
    const setValue = value => {
        // Write on user edits, not on mount or inside a React state updater.
        // This also saves the final keystroke before navigation or a reload.
        const saved = saveInputDraft(id, value);
        setState({ value, status: saved ? 'saved' : value.input.length > MAX_DRAFT_CHARACTERS ? 'too-large' : 'unsaved' });
    };
    const clear = () => {
        const removed = removeInputDraft(id);
        setState(current => ({ ...current, status: removed ? 'cleared' : 'remove-failed' }));
        return removed;
    };
    return { value: state.value, setValue, draft: { status: state.status, clear } };
}
