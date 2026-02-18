import { useState, useEffect, useCallback, useRef } from 'react';
import { ANOVA_TUTOR_SCRIPTS } from '../data/anovaTutorScripts';

const useAnovaTutor = (stats, context) => {
    const [activeTip, setActiveTip] = useState(null);
    const [dismissedIds, setDismissedIds] = useState(() => {
        const saved = localStorage.getItem('anova_tutor_dismissed');
        return saved ? JSON.parse(saved) : [];
    });
    const [sessionDismissedIds, setSessionDismissedIds] = useState([]);
    const [lastTipTime, setLastTipTime] = useState(0);
    const [idleTime, setIdleTime] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [lastAction, setLastAction] = useState(null);

    const timerRef = useRef(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('anova_tutor_dismissed', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    // Idle Timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setIdleTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    const resetIdle = useCallback(() => {
        setIdleTime(0);
        setHasInteracted(true);
    }, []);

    const dismissTip = useCallback((id, permanent = false) => {
        if (permanent) {
            setDismissedIds(prev => [...new Set([...prev, id])]);
        } else {
            setSessionDismissedIds(prev => [...new Set([...prev, id])]);
        }
        setActiveTip(null);
        setLastTipTime(Date.now());
    }, []);

    const triggerEvent = useCallback((eventData) => {
        // Check for high priority error tips first (bypass cooldown)
        const validScripts = ANOVA_TUTOR_SCRIPTS.filter(s => {
            if (dismissedIds.includes(s.id)) return false;
            if (sessionDismissedIds.includes(s.id)) return false;

            const combinedState = {
                stats,
                ...context,
                ...eventData,
                idleTime,
                hasInteracted,
                lastAction,
                activeTip
            };

            // Handle title/body functions
            const evalScript = { ...s };
            if (typeof s.title === 'function') evalScript.title = s.title(combinedState);
            if (typeof s.body === 'function') evalScript.body = s.body(combinedState);

            return s.condition(combinedState);
        });

        if (validScripts.length === 0) return;

        const highestPriority = validScripts.sort((a, b) => b.priority - a.priority)[0];

        // Safety check: Don't show if active tip is already higher priority
        if (activeTip && activeTip.priority >= highestPriority.priority) return;

        // Cooldown check (bypass if priority > 1000 i.e. errors)
        const now = Date.now();
        const cooldown = 30000; // 30s base
        const timeSinceLast = now - lastTipTime;

        if (highestPriority.priority < 1000 && timeSinceLast < cooldown) return;

        // Resolve functions for title/body one last time for the winner
        const combinedState = { stats, ...context, ...eventData, idleTime, hasInteracted, lastAction, activeTip };
        const resolved = { ...highestPriority };
        if (typeof resolved.title === 'function') resolved.title = resolved.title(combinedState);
        if (typeof resolved.body === 'function') resolved.body = resolved.body(combinedState);

        setActiveTip(resolved);
    }, [stats, context, idleTime, hasInteracted, activeTip, dismissedIds, sessionDismissedIds, lastTipTime, resetIdle]);

    // Periodic check for hesitation/stuck triggers
    useEffect(() => {
        const checkInterval = setInterval(() => {
            triggerEvent({});
        }, 1000);
        return () => clearInterval(checkInterval);
    }, [triggerEvent]);

    return {
        activeTip,
        dismissTip,
        triggerEvent,
        resetIdle,
        setLastAction
    };
};

export default useAnovaTutor;
