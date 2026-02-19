import { useState, useCallback, useRef, useEffect } from 'react';

// Specialized tutor for Factorial ANOVA
const useFactorialAnovaTutor = (results, context) => {
    const [activeTip, setActiveTip] = useState(null);

    // Stub for now - can be expanded with real rules later
    const triggerEvent = useCallback((event) => {
        if (event.signal === 'significant_interaction') {
            setActiveTip({
                id: 'sig_interaction',
                title: 'Interaction Found!',
                body: 'The interaction effect is significant. This means the effect of one factor depends on the level of the other. You should look at simple effects rather than just main effects.'
            });
        }
    }, []);

    const dismissTip = useCallback(() => setActiveTip(null), []);

    return {
        activeTip,
        dismissTip,
        triggerEvent,
        resetIdle: () => { },
        history: []
    };
};

export default useFactorialAnovaTutor;
