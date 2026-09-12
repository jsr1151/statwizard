// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SimpleLinearRegressionPage from '../SimpleLinearRegressionPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { SIMPLE_REGRESSION_DRAFT_KEY as key, createSimpleRegressionDraft, readSimpleRegressionDraft, saveSimpleRegressionDraft } from '../../../utils/simpleRegressionDraft.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const table = 'X,Y,Z\n1,3,6\n2,5,5\n3,8,4\n4,8,2\n5,11,1';
let root, container, onStatsChange;
beforeEach(() => {
    localStorage.clear(); sessionStorage.clear(); library.datasets = [];
    container = document.createElement('main'); document.body.appendChild(container);
    root = createRoot(container); onStatsChange = vi.fn();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
const mount = async () => act(async () => root.render(<StrictMode><SimpleLinearRegressionPage section="calculator" darkMode={false} onStatsChange={onStatsChange} /></StrictMode>));
const reload = async () => { await act(async () => root.unmount()); root = createRoot(container); await mount(); };
const field = label => [...container.querySelectorAll('label')].find(node => node.textContent.includes(label))?.querySelector('input,select');
const change = async (node, value) => act(async () => {
    const prototype = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async label => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label).click());
const stats = () => onStatsChange.mock.lastCall[0];
const upload = async promise => act(async () => {
    const node = container.querySelector('input[type="file"]');
    Object.defineProperty(node, 'files', { configurable: true, value: [{ name: 'study.csv', text: () => promise }] });
    node.dispatchEvent(new Event('change', { bubbles: true }));
});

it('restores one coherent table, roles, confidence, prediction and plot draft without writes on mount', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    await mount(); expect(write).not.toHaveBeenCalled();
    await change(container.querySelector('textarea'), table);
    await change(field('Outcome Y'), 'Z'); await change(field('Confidence Level'), 0.99);
    await change(container.querySelector('input[type="number"]'), 8);
    await click('Hide Line'); await click('Show Confidence Band'); await click('Show Prediction Interval');
    const before = stats(); const saved = localStorage.getItem(key); write.mockClear();
    await reload();
    expect(write).not.toHaveBeenCalled(); expect(localStorage.getItem(key)).toBe(saved);
    expect(container.textContent).toContain('Recovered your calculator draft');
    expect(container.querySelector('textarea').value).toBe(table); expect(field('Outcome Y').value).toBe('Z');
    expect(field('Confidence Level').value).toBe('0.99'); expect(container.querySelector('input[type="number"]').value).toBe('8');
    expect(container.textContent).toContain('Show Line'); expect(container.textContent).toContain('Hide Confidence Band'); expect(container.textContent).toContain('Hide Prediction Interval');
    expect(stats().slope).toBe(before.slope); expect(stats().n).toBe(5);
});

it.each(['', 'X,Y\nnot-a-number,missing'])('recovers exact unfinished input %j and clears shared results', async input => {
    await mount(); await change(container.querySelector('textarea'), input); await reload();
    expect(container.querySelector('textarea').value).toBe(input); expect(stats()).toBeNull();
});

it('preserves a cleared role and blank prediction across reloads', async () => {
    await mount(); await change(container.querySelector('textarea'), table);
    await change(container.querySelector('input[type="number"]'), '');
    await change(field('Outcome Y'), ''); await reload();
    expect(field('Outcome Y').value).toBe(''); expect(stats()).toBeNull();
    await change(field('Outcome Y'), 'Y'); expect(container.querySelector('input[type="number"]').value).toBe('');
});

it('recovers uploaded text and keeps the latest settings when a slow upload finishes', async () => {
    await mount(); let finish; await upload(new Promise(resolve => { finish = resolve; }));
    await change(field('Confidence Level'), 0.9); await click('Show Prediction Interval');
    await act(async () => finish(table)); await reload();
    expect(container.querySelector('textarea').value).toBe(table); expect(container.textContent).toContain('Active source: Uploaded: study.csv.');
    expect(field('Confidence Level').value).toBe('0.9'); expect(container.textContent).toContain('Hide Prediction Interval');
});

it('does not save a late upload after a newer edit or source change', async () => {
    await mount(); let finish; await upload(new Promise(resolve => { finish = resolve; }));
    await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    await act(async () => finish('A,B\n1,2\n3,4')); expect(localStorage.getItem(key)).toBe(saved);
    await upload(new Promise(resolve => { finish = resolve; })); await click('Saved Dataset');
    const switched = localStorage.getItem(key); await act(async () => finish('A,B\n1,2\n3,4'));
    expect(localStorage.getItem(key)).toBe(switched); await reload(); await click('Paste / Upload');
    expect(container.querySelector('textarea').value).toBe(table);
});

it('reports failed reads without changing the saved table', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    await upload(Promise.reject(new Error('read failed')));
    expect(container.textContent).toContain('Could not read this file'); expect(localStorage.getItem(key)).toBe(saved);
});

it('keeps a missing saved dataset selected through delayed library loading and retains its roles', async () => {
    const { dataset } = buildDatasetFromDelimitedText({ text: table, datasetName: 'Saved study' });
    library.datasets = [dataset]; await mount(); await click('Saved Dataset');
    await change(field('Outcome Y'), dataset.columns[2].id); await change(field('Confidence Level'), 0.99);
    library.datasets = []; await reload(); expect(stats()).toBeNull();
    const { dataset: other } = buildDatasetFromDelimitedText({ text: table, datasetName: 'Other study' });
    library.datasets = [other]; await mount(); expect(stats()).toBeNull();
    library.datasets = [other, dataset]; await mount(); expect(stats().n).toBe(5);
    expect(field('Outcome Y').value).toBe(dataset.columns[2].id); expect(field('Confidence Level').value).toBe('0.99');
    library.datasets = [{ ...dataset, columns: dataset.columns.filter(c => c.id !== dataset.columns[2].id) }];
    await mount(); expect(field('Outcome Y').value).toBe(''); expect(stats()).toBeNull();
});

it('fresh Data Manager launch overrides old source, roles and settings without overwriting the old draft on mount', async () => {
    await mount(); await change(container.querySelector('textarea'), table); await change(field('Confidence Level'), 0.99);
    await click('Show Confidence Band'); const saved = localStorage.getItem(key);
    const { dataset } = buildDatasetFromDelimitedText({ text: table, datasetName: 'New study' }); library.datasets = [dataset];
    const launch = inferAnalysisLaunchSelection(dataset, 'simple_regression'); writeAnalysisLaunchPayload(launch);
    await reload(); expect(container.querySelector('textarea')).toBeNull();
    expect(field('Outcome Y').value).toBe(launch.y); expect(field('Confidence Level').value).toBe('0.95');
    expect(container.textContent).toContain('Show Confidence Band'); expect(localStorage.getItem(key)).toBe(saved);
    await change(field('Confidence Level'), 0.9); await reload();
    expect(field('Outcome Y').value).toBe(launch.y); expect(field('Confidence Level').value).toBe('0.9'); expect(stats().n).toBe(5);
});

it('cancels or confirms removal while leaving the current analysis open', async () => {
    await mount(); await change(container.querySelector('textarea'), table);
    await click('Remove saved calculator draft'); await click('Keep draft'); expect(localStorage.getItem(key)).not.toBeNull();
    expect(document.activeElement.textContent).toBe('Remove saved calculator draft');
    await click('Remove saved calculator draft'); await click('Remove draft');
    expect(localStorage.getItem(key)).toBeNull(); expect(container.querySelector('textarea').value).toBe(table);
    await reload(); expect(stats().n).toBe(14); expect(localStorage.getItem(key)).toBeNull();
    await change(field('Confidence Level'), 0.9); expect(readSimpleRegressionDraft().confidenceLevel).toBe(0.9);
});

it('keeps edits usable and the prior draft intact when saving or deletion fails', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await change(field('Confidence Level'), 0.99); expect(field('Confidence Level').value).toBe('0.99');
    expect(container.textContent).toContain('Could not save this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    await click('Remove saved calculator draft'); await click('Remove draft');
    expect(container.textContent).toContain('Could not remove this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.restoreAllMocks(); await reload(); expect(field('Confidence Level').value).toBe('0.95');
});

it.each(['{broken', JSON.stringify({ version: 2, data: createSimpleRegressionDraft(table) }), JSON.stringify({ version: 1, data: { ...createSimpleRegressionDraft(table), confidenceLevel: 25 } })])('ignores incompatible storage without replacing it', async stored => {
    localStorage.setItem(key, stored); await mount(); expect(stats().n).toBe(14); expect(localStorage.getItem(key)).toBe(stored);
});

it('preserves the last valid draft when the size limit is exceeded', () => {
    const value = createSimpleRegressionDraft(table); expect(saveSimpleRegressionDraft(value)).toBe('saved');
    const saved = localStorage.getItem(key);
    expect(saveSimpleRegressionDraft({ ...value, tableText: 'x'.repeat(250001) })).toBe('too-large');
    expect(localStorage.getItem(key)).toBe(saved);
});
