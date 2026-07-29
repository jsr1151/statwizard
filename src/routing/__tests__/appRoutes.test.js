import { describe, expect, it } from 'vitest';
import { parseAppRoute, serializeAppRoute } from '../appRoutes.js';

const validSteps = new Set(['start', 'res_one_way_anova', 'correlation_result']);
const routeOptions = {
    isValidStep: (stepId) => validSteps.has(stepId),
    isValidResultSection: (stepId, section) => (
        stepId !== 'start'
        && ['lessons', 'calculator', 'effect_size', 'power'].includes(section)
    ),
    isValidPowerMode: (_stepId, mode) => ['a_priori', 'post_hoc', 'sensitivity'].includes(mode),
};

describe('application hash routes', () => {
    it.each(['', '#', '#/', '#/menu'])('normalizes %j to the home route', (hash) => {
        expect(parseAppRoute(hash, routeOptions)).toMatchObject({
            valid: true,
            appMode: 'menu',
            currentStepId: 'start',
            canonicalHash: '#/',
        });
    });

    it.each(['modules', 'search', 'power', 'lessons'])('round-trips the %s page', (appMode) => {
        const hash = serializeAppRoute({ appMode });

        expect(parseAppRoute(hash, routeOptions)).toMatchObject({
            valid: true,
            appMode,
            currentStepId: 'start',
            canonicalHash: hash,
        });
    });

    it('supports direct wizard-module loads', () => {
        const route = parseAppRoute('#/wizard/res_one_way_anova', routeOptions);

        expect(route).toMatchObject({
            valid: true,
            appMode: 'wizard',
            currentStepId: 'res_one_way_anova',
            resultSection: null,
        });
    });

    it('round-trips result sections and power calculator modes', () => {
        const hash = serializeAppRoute({
            appMode: 'wizard',
            currentStepId: 'correlation_result',
            resultSection: 'power',
            powerMode: 'sensitivity',
        });

        expect(hash).toBe('#/wizard/correlation_result/power/sensitivity');
        expect(parseAppRoute(hash, routeOptions)).toMatchObject({
            valid: true,
            appMode: 'wizard',
            currentStepId: 'correlation_result',
            resultSection: 'power',
            powerMode: 'sensitivity',
        });
    });

    it('supports the wizard start page without an explicit step segment', () => {
        expect(parseAppRoute('#/wizard', routeOptions)).toMatchObject({
            valid: true,
            appMode: 'wizard',
            currentStepId: 'start',
            canonicalHash: '#/wizard',
        });
    });

    it.each([
        '#/unknown',
        '#/wizard/not-a-step',
        '#/wizard/start/power',
        '#/wizard/correlation_result/not-a-section',
        '#/wizard/correlation_result/lessons/sensitivity',
        '#/wizard/correlation_result/power/not-a-mode',
        '#/wizard/correlation_result/power/a_priori/extra',
        '#/%E0%A4%A',
    ])('falls back safely for invalid route %s', (hash) => {
        expect(parseAppRoute(hash, routeOptions)).toMatchObject({
            valid: false,
            appMode: 'menu',
            currentStepId: 'start',
            canonicalHash: '#/',
        });
    });
});
