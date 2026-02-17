import { useState, useEffect } from 'react';
import { TUTOR_SCRIPTS } from '../data/tutorScripts';

const useTutor = (module, currentState) => {
    const [lastState, setLastState] = useState(currentState);
    const [activeScript, setActiveScript] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const scripts = TUTOR_SCRIPTS[module] || [];
        const triggered = scripts
            .filter(s => s.condition(lastState, currentState))
            .sort((a, b) => b.priority - a.priority)[0];

        if (triggered) {
            const resolved = { ...triggered };
            if (typeof resolved.content === 'function') {
                resolved.content = resolved.content(lastState, currentState);
            }
            setActiveScript(resolved);
            if (resolved.id !== activeScript?.id) {
                setHistory(prev => [resolved, ...prev].slice(0, 5));
            }
        } else if (activeScript) {
            const base = scripts.find(s => s.id === activeScript.id);
            if (base && typeof base.content === 'function') {
                const newContent = base.content(lastState, currentState);
                if (JSON.stringify(newContent) !== JSON.stringify(activeScript.content)) {
                    setActiveScript({
                        ...base,
                        content: newContent
                    });
                }
            }
        }
        setLastState(currentState);
    }, [currentState, module]);

    return { activeScript, history, setActiveScript };
};

export default useTutor;
