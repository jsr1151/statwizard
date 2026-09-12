// @vitest-environment jsdom
import { act, StrictMode, startTransition } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import useAnovaTutor from '../useAnovaTutor.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, tutor;
const Harness = ({ active = true }) => {
    tutor = useAnovaTutor(null, {}, null, active);
    return null;
};
beforeEach(() => {
    vi.useFakeTimers(); localStorage.clear();
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); localStorage.clear(); });
const render = active => root.render(<StrictMode><Harness active={active} /></StrictMode>);

it('keeps the original tip in history when an override is interrupted by deactivation', async () => {
    await act(async () => render(true));
    await act(async () => tutor.triggerEvent({ signal: 'change_tab_fdist', lastAction: 'change_tab_fdist' }));
    expect(tutor.activeTip.id).toBe('tab_fdist_info');
    await act(async () => {
        startTransition(() => tutor.triggerEvent({ signal: 'change_tab_means', lastAction: 'change_tab_means' }));
        flushSync(() => render(false));
    });
    expect(tutor.history.map(tip => tip.id)).toEqual(['tab_fdist_info']);
});

it('keeps a dismissed tip in history when the active tip is cleared before a pending update commits', async () => {
    await act(async () => render(true));
    await act(async () => tutor.triggerEvent({ signal: 'change_tab_fdist', lastAction: 'change_tab_fdist' }));
    await act(async () => {
        startTransition(() => tutor.dismissTip('tab_fdist_info'));
        flushSync(() => render(false));
    });
    expect(tutor.history.map(tip => tip.id)).toEqual(['tab_fdist_info']);
});
