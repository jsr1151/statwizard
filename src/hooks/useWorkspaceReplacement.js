import { useEffect, useRef, useState } from 'react';

export default function useWorkspaceReplacement(isDirty) {
    const pending = useRef(null);
    const [replacement, setReplacement] = useState(null);
    useEffect(() => () => pending.current?.(false), []);
    const resolveReplacement = (allow) => {
        pending.current?.(allow);
        pending.current = null;
        setReplacement(null);
    };
    const requestReplacement = (action) => {
        if (!isDirty) return Promise.resolve(true);
        if (pending.current) return Promise.resolve(false);
        setReplacement(action);
        return new Promise(resolve => { pending.current = resolve; });
    };
    return { replacement, requestReplacement, resolveReplacement };
}
