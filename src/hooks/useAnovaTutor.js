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

    // Refs for stable identity of triggerEvent
    const statsRef = useRef(stats);
    const contextRef = useRef(context);
    const idleTimeRef = useRef(idleTime);
    const activeTipRef = useRef(activeTip);
    const lastTipTimeRef = useRef(lastTipTime);
    const lastActionRef = useRef(lastAction);
    const hasInteractedRef = useRef(hasInteracted);
    const dismissedIdsRef = useRef(dismissedIds);
    const sessionDismissedIdsRef = useRef(sessionDismissedIds);

    // Update refs whenever values change
    useEffect(() => { statsRef.current = stats; }, [stats]);
    useEffect(() => { contextRef.current = context; }, [context]);
    useEffect(() => { idleTimeRef.current = idleTime; }, [idleTime]);
    useEffect(() => { activeTipRef.current = activeTip; }, [activeTip]);
    useEffect(() => { lastTipTimeRef.current = lastTipTime; }, [lastTipTime]);
    useEffect(() => { lastActionRef.current = lastAction; }, [lastAction]);
    useEffect(() => { hasInteractedRef.current = hasInteracted; }, [hasInteracted]);
    useEffect(() => { dismissedIdsRef.current = dismissedIds; }, [dismissedIds]);
    useEffect(() => { sessionDismissedIdsRef.current = sessionDismissedIds; }, [sessionDismissedIds]);

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
        if (activeTipRef.current && activeTipRef.current.id === id) {
            setHistory(prev => {
                const exists = prev.find(t => t.id === id);
                if (exists) return prev;
                return [...prev, activeTipRef.current];
            });
        }

        if (permanent) {
            setDismissedIds(prev => [...new Set([...prev, id])]);
        } else {
            setSessionDismissedIds(prev => [...new Set([...prev, id])]);
        }
        setActiveTip(null);
        setLastTipTime(Date.now());
    }, []);

    const triggerEvent = useCallback((eventData) => {
        const isSignal = !!eventData?.signal;

        const combinedState = {
            stats: statsRef.current,
            ...contextRef.current,
            ...eventData,
            idleTime: idleTimeRef.current,
            hasInteracted: hasInteractedRef.current,
            lastAction: eventData?.lastAction || lastActionRef.current,
            activeTip: activeTipRef.current
        };

        const validScripts = ANOVA_TUTOR_SCRIPTS.filter(s => {
            if (dismissedIdsRef.current.includes(s.id)) return false;
            if (sessionDismissedIdsRef.current.includes(s.id)) return false;
            return s.condition(combinedState);
        });

        if (validScripts.length === 0) return;

        const highestPriority = validScripts.sort((a, b) => b.priority - a.priority)[0];

        // Override logic
        const shouldOverride = isSignal && activeTipRef.current && activeTipRef.current.id !== highestPriority.id;
        if (activeTipRef.current && !shouldOverride && activeTipRef.current.priority >= highestPriority.priority) {
            return;
        }

        // Cooldown check
        const now = Date.now();
        const cooldown = (highestPriority.priority >= 1000 || isSignal) ? 1000 : 30000;
        const timeSinceLast = now - lastTipTimeRef.current;

        if (timeSinceLast < cooldown && !shouldOverride) {
            return;
        }

        // Save old tip to history if overriding
        if (shouldOverride && activeTipRef.current) {
            setHistory(prev => {
                const exists = prev.find(t => t.id === activeTipRef.current.id);
                if (exists) return prev;
                return [...prev, activeTipRef.current];
            });
        }

        const resolved = { ...highestPriority };
        if (typeof resolved.title === 'function') resolved.title = resolved.title(combinedState);
        if (typeof resolved.body === 'function') resolved.body = resolved.body(combinedState);

        setActiveTip(resolved);
        setLastTipTime(Date.now());
        if (isSignal) setLastAction(eventData.signal);
        resetIdle();
    }, [resetIdle]);

    // Handle signals internally
    useEffect(() => {
        const handleInteraction = (e) => {
            if (!e.detail) return;
            const eventData = typeof e.detail === 'string' ? { signal: e.detail } : e.detail;

            if (eventData.signal) {
                triggerEvent({ ...eventData, lastAction: eventData.signal });
            }
        };
        window.addEventListener('anovaTutorAction', handleInteraction);
        return () => window.removeEventListener('anovaTutorAction', handleInteraction);
    }, [triggerEvent]);

    // Periodic check
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
