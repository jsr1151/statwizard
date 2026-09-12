// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CentralTendencyPage from '../CentralTendencyPage.jsx';
import VariabilityPage from '../VariabilityPage.jsx';
import FrequencyPage from '../FrequencyPage.jsx';
import { saveInputDraft, MAX_DRAFT_CHARACTERS } from '../../../utils/inputDraftStorage.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const pages = [['Central tendency', CentralTendencyPage, 'symmetric'], ['Variability', VariabilityPage, 'compact'], ['Frequency', FrequencyPage, 'ratings']];
let container, root, onStatsChange;
beforeEach(() => {
    localStorage.clear();
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container);
    onStatsChange = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue() } });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); });
const mount = async (Page, section = 'calculator') => act(async () => root.render(<StrictMode><Page darkMode={false} section={section} onStatsChange={onStatsChange} /></StrictMode>));
const click = async text => act(async () => [...container.querySelectorAll('button')].find(n => n.textContent.trim() === text).click());
const edit = async value => act(async () => {
    const input = container.querySelector('textarea:not([readonly])');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
});

it.each(pages)('%s identifies sources, focuses results, retains input in explorer, and resets explicitly', async (_, Page, example) => {
    await mount(Page);
    expect(container.textContent).toContain(`Active source: Example: ${example}.`);
    await edit('1, 2, 2, 3');
    expect(container.textContent).toContain('Results source: Entered values. 4 of 4 nonempty entries included; 0 excluded.');
    expect(onStatsChange.mock.lastCall[0].n).toBe(4);
    await click('Go to results'); expect(document.activeElement.getAttribute('aria-label')).toBe('Descriptive results');
    await mount(Page, 'explorer'); expect(container.querySelector('textarea').value).toBe('1, 2, 2, 3');
    await click('Load default example'); expect(container.textContent).toContain(`Results source: Example: ${example}.`);
    await edit('  , ; \n'); expect(onStatsChange.mock.lastCall[0]).toBeNull();
    expect(container.textContent).toContain('0 of 0 nonempty entries included');
    expect([...container.querySelectorAll('button')].some(n => n.textContent === 'Go to results')).toBe(false);
});

it.each(pages.slice(0, 2))('%s counts invalid values and includes source, inputs, exclusions, and results when copied', async (_, Page) => {
    await mount(Page); await edit('1, nope, 2, 3, Infinity');
    expect(container.textContent).toContain('3 of 5 nonempty entries included; 2 excluded.');
    expect(container.querySelector('details').textContent).toContain('nope');
    expect(onStatsChange.mock.lastCall[0].n).toBe(3);
    await click('Copy summary');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Source: Entered values\nIncluded: 3; excluded: 2\nExcluded entries: nope, Infinity\nInput: 1, nope, 2, 3, Infinity'));
    expect(container.textContent).toContain('Copied.');
    await edit('nope'); expect(onStatsChange.mock.lastCall[0]).toBeNull();
    expect(container.textContent).toContain('0 of 1 nonempty entries included; 1 excluded.');
});

it('keeps categorical labels and missing-value labels explicit in frequency counts', async () => {
    await mount(FrequencyPage); await edit('New York, Boston, New York, NA,,');
    expect(container.textContent).toContain('Labels such as NA count as categories');
    expect(onStatsChange.mock.lastCall[0].n).toBe(4);
    await click('Copy frequency table');
    const text = navigator.clipboard.writeText.mock.lastCall[0];
    expect(text).toContain('Source: Entered values'); expect(text).toContain('New York\t2\t50%'); expect(text).toContain('NA\t1\t25%');
});

it.each(pages)('%s provides selectable summary text when clipboard access is denied', async (_, Page) => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('Denied'));
    await mount(Page); await click(Page === FrequencyPage ? 'Copy frequency table' : 'Copy summary');
    expect(container.textContent).toContain('Copy unavailable. Select and copy the text below.');
    expect(container.querySelector('textarea[readonly]').value).toContain('Source: Example:');
    await edit('5, 6, 7'); expect(container.querySelector('textarea[readonly]')).toBeNull();
});

it('does not report a stale copy as current after the inputs change', async () => {
    let resolveCopy; navigator.clipboard.writeText.mockImplementation(() => new Promise(resolve => { resolveCopy = resolve; }));
    await mount(CentralTendencyPage); await click('Copy summary'); await edit('9, 10, 11');
    await act(async () => resolveCopy()); expect(container.textContent).not.toContain('Copied.');
});

it.each(pages)('%s restores the exact input, including invalid entries, after leaving and returning', async (_, Page) => {
    await mount(Page); await edit('1, nope, 2, 3');
    expect(container.textContent).toContain('Input draft saved in this browser.');
    await act(async () => root.unmount()); root = createRoot(container); await mount(Page);
    expect(container.querySelector('textarea').value).toBe('1, nope, 2, 3');
    expect(container.textContent).toContain('Recovered your saved input draft');
    await edit(''); await act(async () => root.unmount()); root = createRoot(container); await mount(Page);
    expect(container.querySelector('textarea').value).toBe('');
});

it('keeps drafts separate and removes only the requested saved input after confirmation', async () => {
    await mount(CentralTendencyPage); await edit('10, 20, 30');
    await mount(VariabilityPage); expect(container.textContent).toContain('Example: compact'); await edit('4, 5, 6');
    await mount(CentralTendencyPage); expect(container.querySelector('textarea').value).toBe('10, 20, 30');
    await click('Remove saved input draft'); await click('Keep draft');
    expect(document.activeElement.textContent).toBe('Remove saved input draft');
    await click('Remove saved input draft'); await click('Remove draft');
    expect(container.querySelector('textarea').value).toBe('10, 20, 30');
    await mount(VariabilityPage); expect(container.querySelector('textarea').value).toBe('4, 5, 6');
    await mount(CentralTendencyPage); expect(container.textContent).toContain('Example: symmetric');
});

it('preserves the previous draft and current edits when browser writes fail', async () => {
    await mount(CentralTendencyPage); await edit('1, 2, 3');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
    await edit('4, 5, 6'); expect(container.textContent).toContain('Input draft could not be saved');
    expect(container.querySelector('textarea').value).toBe('4, 5, 6');
    await act(async () => root.unmount()); root = createRoot(container); await mount(CentralTendencyPage);
    expect(container.querySelector('textarea').value).toBe('1, 2, 3');
});

it.each(['not json', 'null', JSON.stringify({ version: 2, data: { input: '99', source: 'Entered values' } }), JSON.stringify({ version: 1, data: { input: 99, source: 'Entered values' } })])('recovers safely from invalid draft storage: %s', async text => {
    localStorage.setItem('statwizard.input-draft.central-tendency', text);
    await mount(CentralTendencyPage); expect(container.textContent).toContain('Active source: Example: symmetric');
    expect(localStorage.getItem('statwizard.input-draft.central-tendency')).toBe(text);
});

it('handles unavailable storage and failed removal without blocking calculator edits', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Blocked'); });
    await mount(FrequencyPage); await edit('A, B, A'); expect(onStatsChange.mock.lastCall[0].n).toBe(3);
    await click('Remove saved input draft'); await click('Remove draft');
    expect(container.textContent).toContain('could not be removed');
    expect(container.textContent).toContain('Keep draft');
});

it('does not overwrite a recoverable draft with an oversized input', () => {
    saveInputDraft('central-tendency', { input: '1, 2, 3', source: 'Entered values' });
    const before = localStorage.getItem('statwizard.input-draft.central-tendency');
    expect(saveInputDraft('central-tendency', { input: '9'.repeat(MAX_DRAFT_CHARACTERS + 1), source: 'Entered values' })).toBe(false);
    expect(localStorage.getItem('statwizard.input-draft.central-tendency')).toBe(before);
});
