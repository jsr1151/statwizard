import { STEPS } from '../data/wizardSteps.js';
import { parseAppRoute } from './appRoutes.js';
import { getResultPage, getTestConfig } from './resultPageConfig.js';

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

export const resolveAppHistory = (hash, storedState) => {
    const route = parseAppRoute(hash, {
        isValidStep,
        isValidResultSection: (stepId, section) => getResultPage(stepId)
            .availableResultSections.some(item => item.id === section),
        isValidPowerMode: (stepId, mode) => {
            const config = getTestConfig(stepId)?.power;
            return (config?.implementedPowerModes || []).includes(mode);
        },
    });
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

    // The address is authoritative for the visible section, including when
    // returning to an older entry that only stored page/step information.
    if (route.resultSection) state.resultSection = route.resultSection;
    if (route.powerMode) state.powerMode = route.powerMode;

    // Match the shell's home spelling to avoid adding a history entry on mount.
    return { state, hash: route.appMode === 'menu' ? '#/menu' : route.canonicalHash };
};

export const initializeAppHistory = (browserWindow = window) => {
    const { state, hash } = resolveAppHistory(browserWindow.location.hash, browserWindow.history.state);
    browserWindow.history.replaceState(state, '', hash);
};
