const STATIC_MODES = new Set(['modules', 'search', 'power', 'lessons']);
const RESULT_SECTIONS = new Set(['lessons', 'calculator', 'effect_size', 'power']);

const homeRoute = (valid = true) => ({
    valid,
    appMode: 'menu',
    currentStepId: 'start',
    resultSection: null,
    powerMode: null,
    canonicalHash: '#/',
});

const decodeSegment = (segment) => {
    try {
        return decodeURIComponent(segment);
    } catch {
        return null;
    }
};

export const serializeAppRoute = ({
    appMode = 'menu',
    currentStepId = 'start',
    resultSection = null,
    powerMode = null,
}) => {
    if (appMode === 'menu') {
        return '#/';
    }

    if (STATIC_MODES.has(appMode)) {
        return `#/${appMode}`;
    }

    if (appMode !== 'wizard') {
        return '#/';
    }

    const segments = ['wizard'];

    if (currentStepId && currentStepId !== 'start') {
        segments.push(encodeURIComponent(currentStepId));

        if (RESULT_SECTIONS.has(resultSection)) {
            segments.push(resultSection);

            if (resultSection === 'power' && powerMode) {
                segments.push(encodeURIComponent(powerMode));
            }
        }
    }

    return `#/${segments.join('/')}`;
};

export const parseAppRoute = (hash, {
    isValidStep = () => false,
    isValidResultSection = () => true,
    isValidPowerMode = () => true,
} = {}) => {
    const normalized = typeof hash === 'string' ? hash.trim() : '';

    if (!normalized || normalized === '#' || normalized === '#/' || normalized === '#/menu') {
        return homeRoute(true);
    }

    if (!normalized.startsWith('#/')) {
        return homeRoute(false);
    }

    const rawSegments = normalized.slice(2).split('/').filter(Boolean);
    const segments = rawSegments.map(decodeSegment);

    if (segments.some((segment) => segment === null)) {
        return homeRoute(false);
    }

    const [mode, stepSegment, sectionSegment, powerModeSegment, ...extraSegments] = segments;

    if (STATIC_MODES.has(mode) && segments.length === 1) {
        return {
            valid: true,
            appMode: mode,
            currentStepId: 'start',
            resultSection: null,
            powerMode: null,
            canonicalHash: serializeAppRoute({ appMode: mode }),
        };
    }

    if (mode !== 'wizard' || extraSegments.length > 0) {
        return homeRoute(false);
    }

    const currentStepId = stepSegment || 'start';

    if (!isValidStep(currentStepId)) {
        return homeRoute(false);
    }

    if (!sectionSegment) {
        if (powerModeSegment) {
            return homeRoute(false);
        }

        return {
            valid: true,
            appMode: 'wizard',
            currentStepId,
            resultSection: null,
            powerMode: null,
            canonicalHash: serializeAppRoute({ appMode: 'wizard', currentStepId }),
        };
    }

    if (
        !RESULT_SECTIONS.has(sectionSegment)
        || !isValidResultSection(currentStepId, sectionSegment)
    ) {
        return homeRoute(false);
    }

    if (powerModeSegment && sectionSegment !== 'power') {
        return homeRoute(false);
    }

    if (powerModeSegment && !isValidPowerMode(currentStepId, powerModeSegment)) {
        return homeRoute(false);
    }

    return {
        valid: true,
        appMode: 'wizard',
        currentStepId,
        resultSection: sectionSegment,
        powerMode: powerModeSegment || null,
        canonicalHash: serializeAppRoute({
            appMode: 'wizard',
            currentStepId,
            resultSection: sectionSegment,
            powerMode: powerModeSegment || null,
        }),
    };
};
