// @vitest-environment jsdom
import { StrictMode, act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '../../App.jsx';
import { initializeAppHistory } from '../initializeAppHistory.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let container;

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));

afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
    root = null;
    vi.restoreAllMocks();
});

const mountAt = async (hash, state = null) => {
    window.history.replaceState(state, '', `/statwizard/${hash}`);
    const length = window.history.length;
    initializeAppHistory();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<StrictMode><App /></StrictMode>));
    return length;
};

it('renders a fresh probability deep link under StrictMode without pushing history', async () => {
    const length = await mountAt('#/wizard/res_probability');
    await vi.waitFor(async () => {
        await act(async () => {});
        expect(container.querySelector('.probability-workspace')).not.toBeNull();
    }, { timeout: 5000 });
    expect(window.location.hash).toBe('#/wizard/res_probability');
    expect(window.history.length).toBe(length);
    expect(container.textContent).toContain('Probability');
});

it('replaces stale module state with the requested home page', async () => {
    const length = await mountAt('#/', {
        appMode: 'wizard', currentStepId: 'res_probability', history: ['start'], answers: {},
    });
    await vi.waitFor(async () => {
        await act(async () => {});
        expect(container.textContent).toContain('Stat Modules');
    }, { timeout: 5000 });
    expect(window.location.hash).toBe('#/menu');
    expect(window.history.length).toBe(length);
    expect(container.querySelector('.probability-workspace')).toBeNull();
});

it('switches probability sections and returns home through the header', async () => {
    await mountAt('#/wizard/res_probability');
    await vi.waitFor(async () => {
        await act(async () => {});
        expect(container.querySelector('.probability-workspace')).not.toBeNull();
    }, { timeout: 5000 });
    const button = (label) => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label);
    await act(async () => button('Demos').click());
    expect(container.textContent).toContain('Monty');
    expect(window.location.hash).toBe('#/wizard/res_probability/demos');
    expect(button('Demos').getAttribute('aria-pressed')).toBe('true');
    await act(async () => button('Calculator').click());
    expect(container.textContent).toContain('Exact binomial probability');
    await act(async () => container.querySelector('[aria-label="Return to StatWizard home"]').click());
    expect(container.textContent).toContain('Stat Modules');
});

const waitForView = async (assertion) => vi.waitFor(async () => {
    await act(async () => { await vi.dynamicImportSettled(); });
    assertion();
}, { timeout: 5000 });
const clickLabel = async (label) => act(async () => {
    [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label).click();
});

it.each(['calculator', 'equation', 'power'])('keeps repeated-measures %s deep links out of the independent-groups engine', async section => {
    await mountAt('#/wizard/res_rm_anova/' + section);
    await waitForView(() => expect(container.textContent).toContain('An on-site repeated-measures calculator is not available'));
    expect(container.textContent).not.toContain('ANOVA OBSERVED RESULTS');
    expect(container.textContent).not.toContain('Live Solver');
    expect(container.textContent).toContain('Error(sub/time)');
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(0);
});

it('shows test-specific Wilcoxon instructions without the shape fallback', async () => {
    await mountAt('#/wizard/res_wilcoxon');
    await waitForView(() => expect(container.textContent).toContain('paired = TRUE'));
    expect(container.textContent).not.toContain('Describing Shape');
    expect(container.textContent).not.toContain('Formula not rendered');
});

it('routes noncontinuous prediction outcomes to an explicit unsupported-design page', async () => {
    await mountAt('#/wizard/relationship_type');
    await waitForView(() => expect(container.textContent).toContain('predict an outcome variable'));
    await clickLabel('Yes, I want to predict an outcome variable');
    await clickLabel('No, or I am not sure');
    await waitForView(() => expect(container.textContent).toContain('No test has been selected'));
    expect(location.hash).toBe('#/wizard/res_unsupported_design');
});

it('restores sections with browser Back and Forward without extra history entries', async () => {
    const length = await mountAt('#/wizard/res_probability/demos');
    await waitForView(() => expect(container.textContent).toContain('Monty'));
    await clickLabel('Calculator');
    expect(window.history.length).toBe(length + 1);
    await act(async () => { window.history.back(); await new Promise(resolve => setTimeout(resolve, 20)); });
    await waitForView(() => expect(container.textContent).toContain('Monty'));
    expect(window.location.hash).toBe('#/wizard/res_probability/demos');
    await act(async () => { window.history.forward(); await new Promise(resolve => setTimeout(resolve, 20)); });
    await waitForView(() => expect(container.textContent).toContain('Exact binomial probability'));
    expect(window.location.hash).toBe('#/wizard/res_probability/calculator');
    expect(window.history.length).toBe(length + 1);
});

it('handles state-free hash navigation and malformed history after mounting', async () => {
    await mountAt('#/menu');
    await act(async () => {
        window.location.hash = '#/wizard/res_probability/simulations';
        await new Promise(resolve => setTimeout(resolve, 20));
    });
    await waitForView(() => expect(container.querySelector('.probability-workspace')).not.toBeNull());
    expect(window.history.state.resultSection).toBe('simulations');
    await act(async () => {
        window.history.replaceState({ appMode: 'wizard', history: null }, '', '#/wizard/toString');
        window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    await waitForView(() => expect(container.textContent).toContain('Stat Modules'));
    expect(window.location.hash).toBe('#/menu');
});

it('opens a power-mode deep link and reflects mode changes in the URL', async () => {
    await mountAt('#/wizard/correlation_result/power/sensitivity');
    await waitForView(() => expect(container.textContent).toContain('Pearson correlation power planning'));
    await clickLabel('A Priori');
    expect(window.location.hash).toBe('#/wizard/correlation_result/power/a_priori');
    await act(async () => { window.history.back(); await new Promise(resolve => setTimeout(resolve, 20)); });
    await waitForView(() => expect(window.location.hash).toBe('#/wizard/correlation_result/power/sensitivity'));
    const selected = [...container.querySelectorAll('button')].find(node => node.textContent.trim() === 'Sensitivity');
    expect(selected.getAttribute('aria-pressed')).toBe('true');
});

it('retains wizard answers when moving through questions and browser history', async () => {
    await mountAt('#/wizard');
    await waitForView(() => expect(container.textContent).toContain('Question 1'));
    const option = [...container.querySelectorAll('main button')].find(node => node.querySelector('.lucide-arrow-right'));
    expect(option).toBeDefined();
    await act(async () => option.click());
    expect(window.history.state.history).toHaveLength(2);
    expect(window.history.state.answers.start).toBeTruthy();
    await act(async () => { window.history.back(); await new Promise(resolve => setTimeout(resolve, 20)); });
    await waitForView(() => expect(container.textContent).toContain('Question 1'));
    expect(window.history.state.answers).toEqual({});
});
