import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 10_000;     // Check every 10 seconds
const RELOAD_DELAY = 3_000;      // Show toast for 3 seconds before reloading
const VERSION_URL = import.meta.env.BASE_URL + 'version.json';

/**
 * Polls /version.json for deployment changes.
 * When a new build is detected, sets `updateAvailable` to true
 * and auto-reloads after a brief delay.
 */
const useAutoReload = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const initialBuildRef = useRef(null);
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

            if (data.buildTime !== initialBuildRef.current) {
                // New deployment detected!
                setUpdateAvailable(true);
                setCountdown(3);

                // Countdown 3 → 2 → 1 → reload
                let sec = 3;
                const interval = setInterval(() => {
                    sec -= 1;
                    setCountdown(sec);
                    if (sec <= 0) {
                        clearInterval(interval);
                        window.location.reload();
                    }
                }, 1000);
            }
        } catch {
            // Network errors are fine — we'll retry on the next poll
        }
    }, []);

    useEffect(() => {
        // Only poll in production (deployed on GitHub Pages)
        if (import.meta.env.DEV) return;

        checkForUpdate(); // Capture initial build ID immediately
        timerRef.current = setInterval(checkForUpdate, POLL_INTERVAL);

        const handleVisibilityRefresh = () => {
            if (!document.hidden) {
                checkForUpdate();
            }
        };

        window.addEventListener('focus', checkForUpdate);
        document.addEventListener('visibilitychange', handleVisibilityRefresh);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.removeEventListener('focus', checkForUpdate);
            document.removeEventListener('visibilitychange', handleVisibilityRefresh);
        };
    }, [checkForUpdate]);

    return { updateAvailable, countdown };
};

export default useAutoReload;
