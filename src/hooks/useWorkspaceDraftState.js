import { useEffect, useState } from 'react';
import { useDatasetLibraryContext } from './useDatasetLibrary.js';

// The library provider outlives page navigation. Drafts remain separate from saved datasets.
export default function useWorkspaceDraftState(key, initialValue) {
    const { workspaceDraft } = useDatasetLibraryContext();
    const [value, setValue] = useState(() => Object.hasOwn(workspaceDraft.current, key)
        ? workspaceDraft.current[key]
        : typeof initialValue === 'function' ? initialValue() : initialValue);
    useEffect(() => { workspaceDraft.current[key] = value; }, [workspaceDraft, key, value]);
    return [value, setValue];
}
