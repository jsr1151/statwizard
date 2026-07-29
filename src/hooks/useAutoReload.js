import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 30_000;     // Check every 30 seconds
const VERSION_URL = import.meta.env.BASE_URL + 'version.json';

/**
 * Polls /version.json for deployment changes.
 * A new build is announced without replacing the user's active page or data.
 */
const useAutoReload = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const initialBuildRef = useRef(null);
    const availableBuildRef = useRef(null);
    const dismissedBuildRef = useRef(null);
    const timerRef = useRef(null);

    const checkForUpdate = useCallback(async () => {
        try {
            const res = await fetch(VERSION_URL, { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();

            if (!initialBuildRef.current) {
                // First load — store the current build ID
                initialBuildRef.current = data.buildTime;
                return;
            }

            if (
                data.buildTime !== initialBuildRef.current
                && data.buildTime !== dismissedBuildRef.current
            ) {
                availableBuildRef.current = data.buildTime;
                setUpdateAvailable(true);
            }
        } catch {
            // Network errors are fine — we'll retry on the next poll
        }
    }, []);

    const reload = useCallback(() => {
        window.location.reload();
    }, []);

    const dismiss = useCallback(() => {
        dismissedBuildRef.current = availableBuildRef.current;
        setUpdateAvailable(false);
    }, []);

    useEffect(() => {
        // Only poll in production (deployed on GitHub Pages)
        if (import.meta.env.DEV) return;

        checkForUpdate(); // Capture initial build ID immediately
        timerRef.current = setInterval(checkForUpdate, POLL_INTERVAL);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [checkForUpdate]);

    return { updateAvailable, reload, dismiss };
};

export default useAutoReload;
