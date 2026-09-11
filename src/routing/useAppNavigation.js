import { useCallback, useEffect, useRef, useState } from 'react';
import { serializeAppRoute } from './appRoutes.js';
import { resolveAppHistory } from './initializeAppHistory.js';

const readLocation = () => resolveAppHistory(window.location.hash, window.history.state);

export default function useAppNavigation() {
    const [state, setState] = useState(() => readLocation().state);
    const [restoreCount, setRestoreCount] = useState(0);
    const current = useRef(state);
    const lastLocation = useRef(null);

    useEffect(() => {
        const restore = () => {
            const resolved = readLocation();
            // Native hash navigation can emit both popstate and hashchange.
            const signature = JSON.stringify(resolved);
            if (signature === lastLocation.current) return;
            lastLocation.current = signature;
            window.history.replaceState(resolved.state, '', resolved.hash);
            current.current = resolved.state;
            setState(resolved.state);
            setRestoreCount(count => count + 1);
        };
        restore();
        window.addEventListener('popstate', restore);
        window.addEventListener('hashchange', restore);
        return () => {
            window.removeEventListener('popstate', restore);
            window.removeEventListener('hashchange', restore);
        };
    }, []);

    const navigate = useCallback((next) => {
        const candidate = typeof next === 'function' ? next(current.current) : next;
        const resolved = resolveAppHistory(serializeAppRoute(candidate), candidate);
        const method = window.location.hash === resolved.hash ? 'replaceState' : 'pushState';
        window.history[method](resolved.state, '', resolved.hash);
        lastLocation.current = JSON.stringify(resolved);
        current.current = resolved.state;
        setState(resolved.state);
    }, []);

    const openPage = useCallback((appMode) => navigate(previous => ({
        ...previous, appMode, resultSection: null, powerMode: null,
    })), [navigate]);

    const openStep = useCallback((currentStepId, { section = null, mode = null } = {}) => navigate(previous => ({
        ...previous, appMode: 'wizard', currentStepId, resultSection: section, powerMode: mode,
    })), [navigate]);

    const selectSection = useCallback((resultSection) => navigate(previous => ({
        ...previous, resultSection, powerMode: null,
    })), [navigate]);

    const selectPowerMode = useCallback((powerMode) => navigate(previous => ({
        ...previous, resultSection: 'power', powerMode,
    })), [navigate]);

    const chooseOption = useCallback((option) => navigate(previous => ({
        ...previous,
        currentStepId: option.next,
        history: [...previous.history, option.next],
        answers: { ...previous.answers, [previous.currentStepId]: option.label },
        resultSection: null, powerMode: null,
    })), [navigate]);

    const restart = useCallback(() => navigate({
        appMode: 'menu', currentStepId: 'start', history: ['start'], answers: {},
    }), [navigate]);

    return { ...state, restoreCount, openPage, openStep, selectSection, selectPowerMode, chooseOption, restart };
}
