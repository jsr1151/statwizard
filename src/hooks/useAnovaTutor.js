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
    const [history, setHistory] = useState([]);

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
        if (activeTip && activeTip.id === id) {
            setHistory(prev => {
                const exists = prev.find(t => t.id === id);
                if (exists) return prev;
                return [...prev, activeTip];
            });
        }

        if (permanent) {
            setDismissedIds(prev => [...new Set([...prev, id])]);
        } else {
            setSessionDismissedIds(prev => [...new Set([...prev, id])]);
        }
        setActiveTip(null);
        setLastTipTime(Date.now());
    }, [activeTip]);

    const triggerEvent = useCallback((eventData) => {
        // Resolve functions for title/body one last time for evaluation
        const combinedState = { stats, ...context, ...eventData, idleTime, hasInteracted, lastAction: eventData?.lastAction || lastAction, activeTip };

        const validScripts = ANOVA_TUTOR_SCRIPTS.filter(s => {
            if (dismissedIds.includes(s.id)) return false;
            if (sessionDismissedIds.includes(s.id)) return false;

            return s.condition(combinedState);
        });

        if (validScripts.length === 0) return;

        const highestPriority = validScripts.sort((a, b) => b.priority - a.priority)[0];

        // Safety check: Don't show if active tip is already higher priority
        if (activeTip && activeTip.priority >= highestPriority.priority) return;

        // Cooldown check
        const now = Date.now();
        // Reduce cooldown to 3s if triggered by a signal (interaction), otherwise 30s
        const isSignal = !!eventData?.signal;
        const cooldown = (highestPriority.priority >= 1000 || isSignal) ? 3000 : 30000;
        const timeSinceLast = now - lastTipTime;

        if (timeSinceLast < cooldown) return;

        // Resolve functions for title/body one last time for the winner
        const resolved = { ...highestPriority };
        if (typeof resolved.title === 'function') resolved.title = resolved.title(combinedState);
        if (typeof resolved.body === 'function') resolved.body = resolved.body(combinedState);

        setActiveTip(resolved);
    }, [stats, context, idleTime, hasInteracted, lastAction, activeTip, dismissedIds, sessionDismissedIds, lastTipTime, resetIdle]);

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
        setLastAction,
        history
    };
};

export default useAnovaTutor;
