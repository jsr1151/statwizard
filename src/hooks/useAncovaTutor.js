import { useState, useCallback, useRef, useEffect } from 'react';
import { ANCOVA_TUTOR_SCRIPTS } from '../data/ancovaTutorScripts';

const useAncovaTutor = (results, context) => {
    const [activeTip, setActiveTip] = useState(null);
    const [dismissedIds, setDismissedIds] = useState(() => {
        try {
            const saved = localStorage.getItem('ancova_tutor_dismissed');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    });
    const [sessionDismissedIds, setSessionDismissedIds] = useState([]);
    const [lastTipTime, setLastTipTime] = useState(0);
    const [idleTime, setIdleTime] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [lastAction, setLastAction] = useState(null);
    const [history, setHistory] = useState([]);

    const timerRef = useRef(null);
    const resultsRef = useRef(results);
    const contextRef = useRef(context);
    const idleTimeRef = useRef(idleTime);
    const activeTipRef = useRef(activeTip);
    const lastTipTimeRef = useRef(lastTipTime);
    const lastActionRef = useRef(lastAction);
    const hasInteractedRef = useRef(hasInteracted);
    const dismissedIdsRef = useRef(dismissedIds);
    const sessionDismissedIdsRef = useRef(sessionDismissedIds);

    useEffect(() => { resultsRef.current = results; }, [results]);
    useEffect(() => { contextRef.current = context; }, [context]);
    useEffect(() => { idleTimeRef.current = idleTime; }, [idleTime]);
    useEffect(() => { activeTipRef.current = activeTip; }, [activeTip]);
    useEffect(() => { lastTipTimeRef.current = lastTipTime; }, [lastTipTime]);
    useEffect(() => { lastActionRef.current = lastAction; }, [lastAction]);
    useEffect(() => { hasInteractedRef.current = hasInteracted; }, [hasInteracted]);
    useEffect(() => { dismissedIdsRef.current = dismissedIds; }, [dismissedIds]);
    useEffect(() => { sessionDismissedIdsRef.current = sessionDismissedIds; }, [sessionDismissedIds]);

    useEffect(() => {
        localStorage.setItem('ancova_tutor_dismissed', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

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
        const state = {
            results: resultsRef.current,
            ...contextRef.current,
            ...eventData,
            idleTime: idleTimeRef.current,
            hasInteracted: hasInteractedRef.current,
            lastAction: eventData?.signal || lastActionRef.current,
            activeTip: activeTipRef.current
        };

        const validScripts = ANCOVA_TUTOR_SCRIPTS.filter(s => {
            if (Array.isArray(dismissedIdsRef.current) && dismissedIdsRef.current.includes(s.id)) return false;
            if (Array.isArray(sessionDismissedIdsRef.current) && sessionDismissedIdsRef.current.includes(s.id)) return false;
            return s.condition(state);
        });

        if (validScripts.length === 0) return;

        const highestPriority = validScripts.sort((a, b) => b.priority - a.priority)[0];

        // Cooldown and override logic
        const shouldOverride = isSignal && activeTipRef.current && activeTipRef.current.id !== highestPriority.id;
        if (activeTipRef.current && !shouldOverride && activeTipRef.current.priority >= highestPriority.priority) {
            return;
        }

        const now = Date.now();
        const cooldown = (highestPriority.priority >= 100) ? 500 : 10000;
        if (now - lastTipTimeRef.current < cooldown && !shouldOverride) return;

        setActiveTip(highestPriority);
        setLastTipTime(now);
        if (isSignal) setLastAction(eventData.signal);
        resetIdle();
    }, [resetIdle]);

    // Internal loop
    useEffect(() => {
        const interval = setInterval(() => triggerEvent({}), 2000);
        return () => clearInterval(interval);
    }, [triggerEvent]);

    return {
        activeTip,
        dismissTip,
        triggerEvent,
        resetIdle,
        history
    };
};

export default useAncovaTutor;
