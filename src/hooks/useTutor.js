import { useState, useEffect, useRef } from 'react';
import { TUTOR_SCRIPTS } from '../data/tutorScripts';

const useTutor = (module, currentState) => {
    const [tipsEnabled, setTipsEnabled] = useState(() => {
        try {
            return localStorage.getItem('statwizard_tooltips_enabled') !== 'false';
        } catch {
            return true;
        }
    });
    const lastStateRef = useRef(currentState);
    const [activeScript, setActiveScript] = useState(null);
    const [history, setHistory] = useState([]);
    const activeScriptRef = useRef(activeScript);

    useEffect(() => {
        activeScriptRef.current = activeScript;
    }, [activeScript]);

    useEffect(() => {
        const handlePreferenceChange = (event) => {
            const enabled = event.detail !== false;
            setTipsEnabled(enabled);
            if (!enabled) setActiveScript(null);
        };
        window.addEventListener('statwizardTooltipsChanged', handlePreferenceChange);
        return () => window.removeEventListener('statwizardTooltipsChanged', handlePreferenceChange);
    }, []);

    useEffect(() => {
        if (!tipsEnabled) {
            activeScriptRef.current = null;
            setActiveScript(null);
            lastStateRef.current = currentState;
            return;
        }
        const lastState = lastStateRef.current;
        const scripts = TUTOR_SCRIPTS[module] || [];
        const triggered = scripts
            .filter(s => s.condition(lastState, currentState))
            .sort((a, b) => b.priority - a.priority)[0];

        if (triggered) {
            const resolved = { ...triggered };
            if (typeof resolved.content === 'function') {
                resolved.content = resolved.content(lastState, currentState);
            }
            if (resolved.id !== activeScriptRef.current?.id) {
                setHistory(historyItems => [resolved, ...historyItems].slice(0, 5));
            }

            activeScriptRef.current = resolved;
            setActiveScript(resolved);
        } else {
            const previous = activeScriptRef.current;

            if (previous) {
                const base = scripts.find(s => s.id === previous.id);

                if (base && typeof base.content === 'function') {
                    const newContent = base.content(lastState, currentState);

                    if (JSON.stringify(newContent) !== JSON.stringify(previous.content)) {
                        const updated = { ...base, content: newContent };
                        activeScriptRef.current = updated;
                        setActiveScript(updated);
                    }
                }
            }
        }
        lastStateRef.current = currentState;
    }, [currentState, module, tipsEnabled]);

    return { activeScript, history, setActiveScript };
};

export default useTutor;
