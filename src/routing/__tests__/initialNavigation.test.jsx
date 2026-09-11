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
