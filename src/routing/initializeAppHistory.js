import { STEPS } from '../data/wizardSteps.js';
import { parseAppRoute } from './appRoutes.js';

const isValidStep = (stepId) => typeof stepId === 'string' && Object.hasOwn(STEPS, stepId);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const canRestoreState = (state, route) => (
    route.valid
    && isRecord(state)
    && state.appMode === route.appMode
    && isValidStep(state.currentStepId)
    && (route.appMode !== 'wizard' || state.currentStepId === route.currentStepId)
    && Array.isArray(state.history)
    && state.history.length > 0
    && state.history.every(isValidStep)
    && isRecord(state.answers)
);

// App restores history.state on mount. Seed it from the address before React
// mounts so fresh deep links follow the same path as a browser reload.
export const initializeAppHistory = (browserWindow = window) => {
    const route = parseAppRoute(browserWindow.location.hash, {
        isValidStep,
        // The current shell only serializes pages and wizard steps. Section
        // routing needs its own shell integration before these URLs can open.
        isValidResultSection: () => false,
    });
    const storedState = browserWindow.history.state;
    const state = canRestoreState(storedState, route) ? {
        appMode: storedState.appMode,
        currentStepId: storedState.currentStepId,
        history: storedState.history,
        answers: storedState.answers,
    } : {
        appMode: route.appMode,
        currentStepId: route.currentStepId,
        history: ['start'],
        answers: {},
    };

    // Match the shell's home spelling to avoid adding a history entry on mount.
    const hash = route.appMode === 'menu' ? '#/menu' : route.canonicalHash;
    browserWindow.history.replaceState(state, '', hash);
};
