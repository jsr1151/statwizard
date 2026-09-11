// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { initializeAppHistory } from '../initializeAppHistory.js';
import { STEPS } from '../../data/wizardSteps.js';
import { getResultPage } from '../resultPageConfig.js';

const savedState = {
    appMode: 'wizard',
    currentStepId: 'res_probability',
    history: ['start', 'res_probability'],
    answers: { start: 'saved answer' },
};

const initialize = (hash, state = null) => {
    window.history.replaceState(state, '', `/statwizard/?source=test${hash}`);
    const length = window.history.length;
    initializeAppHistory(window);
    expect(window.history.length).toBe(length);
    expect(window.location.pathname).toBe('/statwizard/');
    expect(window.location.search).toBe('?source=test');
    return window.history.state;
};

describe('initial application history', () => {
    it('accepts every section exposed by the application and rejects sections on wizard questions', () => {
        for (const stepId of Object.keys(STEPS)) {
            for (const { id } of getResultPage(stepId).availableResultSections) {
                expect(initialize(`#/wizard/${stepId}/${id}`)).toMatchObject({
                    appMode: 'wizard', currentStepId: stepId, resultSection: id,
                });
            }
        }
        expect(initialize('#/wizard/start/calculator').appMode).toBe('menu');
        expect(initialize('#/wizard/correlation_result/power/unsupported').appMode).toBe('menu');
    });
    it('opens a pasted probability module URL without existing history state', () => {
        expect(initialize('#/wizard/res_probability')).toEqual({
            appMode: 'wizard', currentStepId: 'res_probability',
            history: ['start'], answers: {},
        });
        expect(window.location.hash).toBe('#/wizard/res_probability');
    });

    it.each(['modules', 'search', 'lessons', 'power', 'data_manager'])('opens the %s page', (appMode) => {
        expect(initialize(`#/${appMode}`)).toMatchObject({ appMode, currentStepId: 'start' });
        expect(window.location.hash).toBe(`#/${appMode}`);
    });

    it.each(['#/wizard', '#/wizard/start'])('opens the wizard start at %s', (hash) => {
        expect(initialize(hash)).toMatchObject({ appMode: 'wizard', currentStepId: 'start' });
        expect(window.location.hash).toBe('#/wizard');
    });

    it.each(['', '#', '#/', '#/menu', '#/unknown', '#/wizard/missing',
        '#/wizard/toString', '#/wizard/__proto__', '#/%E0%A4%A',
        '#/wizard/res_probability/power'])('uses Home for empty or unsupported route %j', (hash) => {
        expect(initialize(hash)).toEqual({
            appMode: 'menu', currentStepId: 'start', history: ['start'], answers: {},
        });
        expect(window.location.hash).toBe('#/menu');
    });

    it.each(['lessons', 'calculator', 'simulations', 'demos', 'equation'])('restores the probability %s section', (section) => {
        expect(initialize(`#/wizard/res_probability/${section}`)).toMatchObject({
            appMode: 'wizard', currentStepId: 'res_probability', resultSection: section,
        });
    });

    it.each(['a_priori', 'post_hoc', 'sensitivity'])('restores the %s power mode', (powerMode) => {
        expect(initialize(`#/wizard/correlation_result/power/${powerMode}`)).toMatchObject({
            appMode: 'wizard', currentStepId: 'correlation_result', resultSection: 'power', powerMode,
        });
    });

    it('uses the section in the URL instead of stored section state', () => {
        expect(initialize('#/wizard/res_probability/demos', {
            ...savedState, resultSection: 'calculator', powerMode: 'sensitivity',
        })).toEqual({ ...savedState, resultSection: 'demos' });
    });

    it('preserves wizard progress on reload and repeated initialization', () => {
        expect(initialize('#/wizard/res_probability', savedState)).toEqual(savedState);
        const length = window.history.length;
        initializeAppHistory(window);
        expect(window.history.state).toEqual(savedState);
        expect(window.history.length).toBe(length);
    });

    it('preserves valid background wizard progress when reloading a static page', () => {
        const state = { ...savedState, appMode: 'modules' };
        expect(initialize('#/modules', state)).toEqual(state);
    });

    it('uses the address instead of stale state from another page or step', () => {
        expect(initialize('#/modules', savedState)).toEqual({
            appMode: 'modules', currentStepId: 'start', history: ['start'], answers: {},
        });
        expect(initialize('#/wizard', savedState)).toEqual({
            appMode: 'wizard', currentStepId: 'start', history: ['start'], answers: {},
        });
    });

    it.each([
        {}, 'invalid', [], { ...savedState, history: null },
        { ...savedState, history: [] }, { ...savedState, history: ['missing'] },
        { ...savedState, currentStepId: 'toString' },
        { ...savedState, answers: null }, { ...savedState, answers: [] },
    ])('repairs malformed stored state %#', (state) => {
        expect(initialize('#/wizard/res_probability', state)).toEqual({
            appMode: 'wizard', currentStepId: 'res_probability',
            history: ['start'], answers: {},
        });
    });
});
