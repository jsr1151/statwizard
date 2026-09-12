// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PearsonCorrelationPage from '../PearsonCorrelationPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { PEARSON_DRAFT_KEY as key, createPearsonDraft, pearsonDraftStorage as storage } from '../../../utils/pearsonDraft.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const table = 'X,Y,Z\n1,3,6\n2,5,5\n3,8,4\n4,8,2\n5,11,1\n,12,0\n7,,0';
let root, container, onStatsChange;
beforeEach(() => {
    localStorage.clear(); sessionStorage.clear(); library.datasets = [];
    container = document.createElement('main'); document.body.appendChild(container);
    root = createRoot(container); onStatsChange = vi.fn();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
const mount = async () => act(async () => root.render(<StrictMode><PearsonCorrelationPage section="calculator" darkMode={false} onStatsChange={onStatsChange} /></StrictMode>));
const reload = async () => { await act(async () => root.unmount()); root = createRoot(container); await mount(); };
const field = text => [...container.querySelectorAll('label')].find(node => node.textContent.trim().startsWith(text) && node.querySelector('input,select'))?.querySelector('input,select');
const role = name => container.querySelector(`select[aria-label="${name} Variable"]`);
const change = async (node, value) => act(async () => {
    const prototype = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const button = label => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label);
const click = async label => act(async () => button(label).click());
const stats = () => onStatsChange.mock.lastCall[0];
const dataset = name => buildDatasetFromDelimitedText({ text: table, datasetName: name }).dataset;
const upload = async promise => act(async () => {
    const node = container.querySelector('input[type="file"]');
    Object.defineProperty(node, 'files', { configurable: true, value: [{ name: 'study.csv', text: () => promise }] });
    node.dispatchEvent(new Event('change', { bubbles: true }));
});

it('restores a coherent table, roles, hypothesis, confidence, null value, and plot settings without mount writes', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem'); await mount(); expect(write).not.toHaveBeenCalled();
    await change(container.querySelector('textarea'), table); await change(role('Y'), 'Z'); await click('Negative');
    await change(field('Confidence Level'), 0.99); await change(field('Null Population'), 0.4); await click('Hide Line'); await click('Show Band');
    const before = stats(); const saved = localStorage.getItem(key); write.mockClear(); await reload();
    expect(write).not.toHaveBeenCalled(); expect(localStorage.getItem(key)).toBe(saved);
    expect(container.textContent).toContain('Recovered your calculator draft'); expect(container.querySelector('textarea').value).toBe(table);
    expect(role('Y').value).toBe('Z'); expect(field('Confidence Level').value).toBe('0.99'); expect(field('Null Population').value).toBe('0.4');
    expect(button('Negative').getAttribute('aria-pressed')).toBe('true'); expect(button('Show Line').getAttribute('aria-pressed')).toBe('false'); expect(button('Hide Band').getAttribute('aria-pressed')).toBe('true');
    expect(stats().r).toBe(before.r); expect(stats().hypothesisTest).toEqual(before.hypothesisTest); expect(stats().hypothesisTest.method).toBe('fisher_z');
});

it('saves hypothesis tails and direction in one write and recovers the same test', async () => {
    await mount(); const write = vi.spyOn(Storage.prototype, 'setItem'); await click('Negative'); expect(write).toHaveBeenCalledOnce();
    expect(storage.read()).toMatchObject({ tails: 1, direction: 'less' }); await reload();
    expect(stats()).toMatchObject({ tails: 1, direction: 'less' });
    await click('Two-tailed'); await reload(); expect(stats().tails).toBe(2); expect(button('Two-tailed').getAttribute('aria-pressed')).toBe('true');
});

it.each(['', '1.2', '-1.2'])('preserves unfinished or out-of-range null input %j without substituting a test value', async value => {
    await mount(); await change(field('Null Population'), value); await reload();
    expect(field('Null Population').value).toBe(value); expect(field('Null Population').getAttribute('aria-invalid')).toBe('true');
    expect(stats()).toBeNull(); expect(container.textContent).toContain('Enter a null population correlation between -0.95 and 0.95');
    await change(field('Null Population'), 0); expect(stats().ok).toBe(true);
});

it('retains paired row positions and exclusion details after recovery', async () => {
    await mount(); await change(container.querySelector('textarea'), table); await reload();
    expect(stats().n).toBe(5); expect(stats().pairs.map(pair => [pair.x, pair.y])).toEqual([[1, 3], [2, 5], [3, 8], [4, 8], [5, 11]]);
    const summary = container.querySelector('[aria-label="Analysis data summary"]');
    expect(summary.textContent).toContain('5 of 7 rows are usable; 2 excluded'); expect(summary.textContent).toContain('Data row 6: X'); expect(summary.textContent).toContain('Data row 7: Y');
});

it.each(['', 'X,Y\nnope,bad'])('recovers exact unfinished table %j and clears shared results', async value => {
    await mount(); await change(container.querySelector('textarea'), value); await reload(); expect(container.querySelector('textarea').value).toBe(value); expect(stats()).toBeNull();
});

it('keeps cleared and unavailable pasted roles empty until corrected or the example is loaded', async () => {
    await mount(); await change(container.querySelector('textarea'), table); await change(role('Y'), ''); await reload();
    expect(role('Y').value).toBe(''); expect(stats()).toBeNull(); expect(container.textContent).not.toContain('0 of 0 rows');
    await change(role('Y'), 'Z'); await change(container.querySelector('textarea'), 'X,Y,W\n1,2,3\n2,4,5\n3,7,4\n4,9,1'); await reload();
    expect(role('Y').value).toBe(''); expect(stats()).toBeNull(); await click('Load example data'); expect(stats().n).toBe(11);
});

it('keeps variable choices separate across saved datasets and pasted data', async () => {
    const first = dataset('First'); const second = dataset('Second'); library.datasets = [first, second];
    await mount(); await change(container.querySelector('textarea'), table); await change(role('Y'), 'Z');
    await click('Saved Dataset'); await change(role('X'), first.columns[2].id); await change(role('Y'), first.columns[0].id);
    await change(field('Saved Dataset'), second.id); await change(role('Y'), second.columns[2].id); await change(role('X'), second.columns[1].id); await reload();
    expect(role('X').value).toBe(second.columns[1].id); expect(role('Y').value).toBe(second.columns[2].id);
    await change(field('Saved Dataset'), first.id); expect(role('X').value).toBe(first.columns[2].id); expect(role('Y').value).toBe(first.columns[0].id);
    await click('Paste / Upload'); expect(role('X').value).toBe('X'); expect(role('Y').value).toBe('Z');
});

it('waits for a missing saved dataset, preserves stable IDs across renames, and blocks changed variable types', async () => {
    const study = dataset('Study'); library.datasets = [study]; await mount(); await click('Saved Dataset'); await change(field('Confidence Level'), 0.99);
    library.datasets = []; await reload(); expect(stats()).toBeNull(); library.datasets = [dataset('Other')]; await mount(); expect(stats()).toBeNull();
    library.datasets = [{ ...study, columns: study.columns.map(column => column.label === 'X' ? { ...column, label: 'Renamed X' } : column) }]; await mount();
    expect(role('X').value).toBe(study.columns[0].id); expect(container.textContent).toContain('Renamed X'); expect(stats().n).toBe(5);
    library.datasets = [{ ...study, columns: study.columns.map(column => column.label === 'Y' ? { ...column, summary: { ...column.summary, detectedType: 'categorical' } } : column) }];
    await mount(); expect(role('Y').value).toBe(''); expect(stats()).toBeNull();
    library.datasets = [study]; await mount(); await change(role('Y'), ''); await reload(); expect(role('Y').value).toBe(''); expect(stats()).toBeNull();
});

it('gives a fresh Data Manager launch priority over the previous draft and saves it on the next edit', async () => {
    await mount(); await change(container.querySelector('textarea'), table); await click('Negative'); await change(field('Null Population'), 0.4); await change(field('Confidence Level'), 0.99); await click('Show Band');
    const saved = localStorage.getItem(key); const study = dataset('New study'); library.datasets = [study]; const launch = inferAnalysisLaunchSelection(study, 'pearson_correlation'); writeAnalysisLaunchPayload(launch);
    await reload(); expect(container.querySelector('textarea')).toBeNull(); expect(role('X').value).toBe(launch.x); expect(role('Y').value).toBe(launch.y);
    expect(field('Confidence Level').value).toBe('0.95'); expect(field('Null Population').value).toBe('0'); expect(button('Two-tailed').getAttribute('aria-pressed')).toBe('true'); expect(button('Show Band')).toBeTruthy();
    expect(localStorage.getItem(key)).toBe(saved); await click('Positive'); await reload(); expect(stats()).toMatchObject({ tails: 1, direction: 'greater' });
});

it('retains updated inference settings when an upload finishes and ignores late reads after newer edits or source switches', async () => {
    await mount(); let finish; await upload(new Promise(resolve => { finish = resolve; })); await click('Negative'); await change(field('Null Population'), 0.4);
    await act(async () => finish(table)); await reload(); expect(container.textContent).toContain('Uploaded: study.csv'); expect(stats()).toMatchObject({ tails: 1, direction: 'less', rho0: 0.4 });
    await upload(new Promise(resolve => { finish = resolve; })); await change(container.querySelector('textarea'), table + '\n8,4,9'); const saved = localStorage.getItem(key);
    await act(async () => finish(table)); expect(localStorage.getItem(key)).toBe(saved);
    await upload(new Promise(resolve => { finish = resolve; })); await click('Saved Dataset'); const switched = localStorage.getItem(key);
    await act(async () => finish(table)); expect(localStorage.getItem(key)).toBe(switched);
});

it('reports failed file reads without replacing the current draft', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    await upload(Promise.reject(new Error('read failed'))); expect(container.textContent).toContain('Could not read this file'); expect(localStorage.getItem(key)).toBe(saved);
});

it('confirms removal, preserves the open analysis, and leaves other calculator drafts untouched', async () => {
    const otherKey = 'statwizard.calculator-draft.simple-regression'; localStorage.setItem(otherKey, 'other draft');
    await mount(); await change(container.querySelector('textarea'), table); await click('Remove saved calculator draft'); await click('Keep draft');
    expect(localStorage.getItem(key)).not.toBeNull(); expect(document.activeElement.textContent).toBe('Remove saved calculator draft');
    await click('Remove saved calculator draft'); await click('Remove draft'); expect(localStorage.getItem(key)).toBeNull(); expect(stats().n).toBe(5); expect(localStorage.getItem(otherKey)).toBe('other draft');
    await reload(); expect(stats().n).toBe(11); expect(localStorage.getItem(key)).toBeNull(); await click('Negative'); expect(storage.read().direction).toBe('less');
});

it('leaves edits usable and the previous draft intact when writes or removal fail', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); }); await click('Negative');
    expect(stats().direction).toBe('less'); expect(container.textContent).toContain('Could not save this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); }); await click('Remove saved calculator draft'); await click('Remove draft');
    expect(container.textContent).toContain('Could not remove this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.restoreAllMocks(); await reload(); expect(stats().tails).toBe(2);
});

it.each(['{broken', JSON.stringify({ version: 2, data: createPearsonDraft(table) }), JSON.stringify({ version: 1, data: { ...createPearsonDraft(table), tails: 3 } })])('does not overwrite invalid or incompatible storage on mount', async saved => {
    localStorage.setItem(key, saved); await mount(); expect(stats().n).toBe(11); expect(localStorage.getItem(key)).toBe(saved);
});

it('reports the size limit and preserves the last valid draft', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    await change(container.querySelector('textarea'), ' '.repeat(250001)); expect(container.textContent).toContain('250,000-character limit'); expect(stats()).toBeNull(); expect(localStorage.getItem(key)).toBe(saved);
});
