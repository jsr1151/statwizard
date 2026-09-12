// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import MultipleRegressionPage from '../MultipleRegressionPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { MULTIPLE_REGRESSION_DRAFT_KEY as key, createMultipleRegressionDraft, multipleRegressionDraftStorage as storage } from '../../../utils/multipleRegressionDraft.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const table = 'X1,X2,X3,Y\n-1,-1,-1,4\n-1,-1,1,6\n-1,1,-1,10\n-1,1,1,12\n1,-1,-1,8\n1,-1,1,10\n1,1,-1,14\n1,1,1,17';
let root, container, onStatsChange;
beforeEach(() => {
    localStorage.clear(); sessionStorage.clear(); library.datasets = [];
    container = document.createElement('main'); document.body.appendChild(container);
    root = createRoot(container); onStatsChange = vi.fn();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
const mount = async () => act(async () => root.render(<StrictMode><MultipleRegressionPage section="calculator" darkMode={false} onStatsChange={onStatsChange} /></StrictMode>));
const reload = async () => { await act(async () => root.unmount()); root = createRoot(container); await mount(); };
const field = label => [...container.querySelectorAll('label')].find(node => node.textContent.includes(label) && node.querySelector('input,select'))?.querySelector('input,select');
const outcome = () => container.querySelector('select[aria-label="Outcome Variable (Y)"]') || field('Outcome Variable (Y)');
const prediction = label => [...container.querySelectorAll('label')].find(node => node.textContent.trim().startsWith(label) && node.textContent.includes('Observed range'))?.querySelector('input');
const change = async (node, value) => act(async () => {
    const prototype = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async label => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label).click());
const checkbox = label => [...container.querySelectorAll('label')].find(node => node.textContent.trim().startsWith(label) && node.querySelector('input[type="checkbox"]'))?.querySelector('input');
const toggle = async label => act(async () => checkbox(label).click());
const stats = () => onStatsChange.mock.lastCall[0];
const dataset = name => buildDatasetFromDelimitedText({ text: table, datasetName: name }).dataset;
const upload = async promise => act(async () => {
    const node = container.querySelector('input[type="file"]');
    Object.defineProperty(node, 'files', { configurable: true, value: [{ name: 'study.csv', text: () => promise }] });
    node.dispatchEvent(new Event('change', { bubbles: true }));
});

it('recovers table, selected predictors, confidence and out-of-range predictions without mount writes', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem'); await mount(); expect(write).not.toHaveBeenCalled();
    await change(container.querySelector('textarea'), table); await toggle('X3');
    await change(prediction('X1'), 7); await change(prediction('X2'), -5); await change(field('Confidence Level'), 0.99);
    expect(prediction('X1').value).toBe('7'); expect(container.textContent).toContain('extrapolation');
    const before = stats(); write.mockClear(); await reload(); expect(write).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Recovered your calculator draft'); expect(container.querySelector('textarea').value).toBe(table);
    expect(checkbox('X3').checked).toBe(false); expect(stats()).toMatchObject({ n: 8, predictorCount: 2 });
    expect(stats().coefficients).toEqual(before.coefficients); expect(field('Confidence Level').value).toBe('0.99');
    expect(prediction('X1').value).toBe('7'); expect(prediction('X2').value).toBe('-5'); expect(container.textContent).toContain('extrapolation');
});

it('preserves blank predictions and reports that a prediction is incomplete', async () => {
    await mount(); await change(container.querySelector('textarea'), table); await change(prediction('X1'), '');
    await change(field('Confidence Level'), 0.9); await reload();
    expect(prediction('X1').value).toBe(''); expect(stats().ok).toBe(true);
    expect(container.textContent).toContain('Enter a numeric value for every predictor');
    await change(prediction('X1'), 0); expect(container.textContent).not.toContain('Enter a numeric value for every predictor');
});

it('does not reselect cleared predictors or an outcome after edits and reloads', async () => {
    await mount(); await change(container.querySelector('textarea'), table);
    await toggle('X1'); await toggle('X2'); await toggle('X3'); await change(field('Confidence Level'), 0.99); await reload();
    expect(stats()).toBeNull(); expect(container.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(0);
    await click('Reset variable choices'); expect(stats().predictorCount).toBe(3);
    await change(outcome(), ''); await reload(); expect(outcome().value).toBe(''); expect(stats()).toBeNull();
    await click('Load example data'); expect(stats().n).toBe(15);
});

it.each(['', 'X1,X2,Y\nnope,missing,bad'])('retains unfinished table %j without showing stale results', async text => {
    await mount(); await change(container.querySelector('textarea'), text); await reload();
    expect(container.querySelector('textarea').value).toBe(text); expect(stats()).toBeNull();
});

it('keeps saved and pasted predictor profiles separate, including datasets with matching labels', async () => {
    const first = dataset('First'); const second = dataset('Second'); library.datasets = [first, second];
    await mount(); await change(container.querySelector('textarea'), table); await change(prediction('X1'), 7);
    await click('Saved Dataset'); await change(prediction('X1'), 11); await toggle('X3');
    await change(field('Saved Dataset'), second.id); expect(prediction('X1').value).toBe('0'); expect(stats().predictorCount).toBe(3);
    await change(prediction('X1'), 22); await reload(); expect(prediction('X1').value).toBe('22');
    await change(field('Saved Dataset'), first.id); expect(prediction('X1').value).toBe('11'); expect(stats().predictorCount).toBe(2);
    await click('Paste / Upload'); expect(prediction('X1').value).toBe('7'); expect(stats().predictorCount).toBe(3);
});

it('waits for the saved dataset and blocks a removed predictor instead of fitting a smaller model', async () => {
    const study = dataset('Study'); library.datasets = [study]; await mount(); await click('Saved Dataset'); await change(prediction('X1'), 9);
    library.datasets = []; await reload(); expect(stats()).toBeNull();
    library.datasets = [dataset('Unrelated')]; await mount(); expect(stats()).toBeNull();
    library.datasets = [study]; await mount(); expect(stats().predictorCount).toBe(3);
    library.datasets = [{ ...study, columns: study.columns.filter(column => column.label !== 'X3') }]; await mount();
    expect(stats()).toBeNull(); expect(container.textContent).toContain('A selected predictor is unavailable');
    await reload(); expect(stats()).toBeNull(); await click('Reset variable choices'); expect(stats().predictorCount).toBe(2);
    expect(prediction('X1').value).toBe('9');
});

it('follows saved column IDs across label changes and rejects an outcome that is no longer numeric', async () => {
    const study = dataset('Study'); library.datasets = [study]; await mount(); await click('Saved Dataset'); await change(prediction('X1'), 9);
    library.datasets = [{ ...study, columns: study.columns.map(column => column.label === 'X1' ? { ...column, label: 'Renamed predictor' } : column) }];
    await reload(); expect(prediction('Renamed predictor').value).toBe('9'); expect(stats().predictorCount).toBe(3);
    library.datasets = [{ ...study, columns: study.columns.map(column => column.label === 'Y' ? { ...column, summary: { ...column.summary, detectedType: 'categorical' } } : column) }];
    await mount(); expect(outcome().value).toBe(''); expect(stats()).toBeNull();
});

it('fresh launches override older roles, settings and prediction values until the next edit saves the new draft', async () => {
    await mount(); await change(container.querySelector('textarea'), table); await toggle('X3'); await change(field('Confidence Level'), 0.99);
    await change(prediction('X1'), 7); const saved = localStorage.getItem(key);
    const study = dataset('New launch'); library.datasets = [study]; writeAnalysisLaunchPayload(inferAnalysisLaunchSelection(study, 'multiple_regression'));
    await reload(); expect(container.querySelector('textarea')).toBeNull(); expect(stats().predictorCount).toBe(3);
    expect(field('Confidence Level').value).toBe('0.95'); expect(prediction('X1').value).toBe('0'); expect(localStorage.getItem(key)).toBe(saved);
    await change(field('Confidence Level'), 0.9); await reload(); expect(field('Confidence Level').value).toBe('0.9'); expect(stats().predictorCount).toBe(3);
});

it('a late upload preserves newer settings but cannot overwrite newer text or a source switch', async () => {
    await mount(); let finish; await upload(new Promise(resolve => { finish = resolve; })); await change(field('Confidence Level'), 0.99);
    await act(async () => finish(table)); await reload(); expect(field('Confidence Level').value).toBe('0.99');
    expect(container.textContent).toContain('Active source: Uploaded: study.csv.');
    await upload(new Promise(resolve => { finish = resolve; })); await change(container.querySelector('textarea'), table + '\n,1,1,20');
    const saved = localStorage.getItem(key); await act(async () => finish(table)); expect(localStorage.getItem(key)).toBe(saved);
    await upload(new Promise(resolve => { finish = resolve; })); await click('Saved Dataset'); const switched = localStorage.getItem(key);
    await act(async () => finish(table)); expect(localStorage.getItem(key)).toBe(switched);
});

it('failed file reads keep the current draft and report the failure', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    await upload(Promise.reject(new Error('read failed'))); expect(container.textContent).toContain('Could not read this file'); expect(localStorage.getItem(key)).toBe(saved);
});

it('confirms removal without clearing the open analysis and saves again only after another edit', async () => {
    await mount(); await change(container.querySelector('textarea'), table);
    await click('Remove saved calculator draft'); await click('Keep draft'); expect(localStorage.getItem(key)).not.toBeNull();
    expect(document.activeElement.textContent).toBe('Remove saved calculator draft');
    await click('Remove saved calculator draft'); await click('Remove draft'); expect(localStorage.getItem(key)).toBeNull(); expect(stats().n).toBe(8);
    await reload(); expect(stats().n).toBe(15); expect(localStorage.getItem(key)).toBeNull();
    await change(field('Confidence Level'), 0.9); expect(storage.read().confidenceLevel).toBe(0.9);
});

it('failed saves and removal preserve the prior draft and leave current edits usable', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); }); await change(field('Confidence Level'), 0.99);
    expect(container.textContent).toContain('Could not save this draft'); expect(field('Confidence Level').value).toBe('0.99'); expect(localStorage.getItem(key)).toBe(saved);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); }); await click('Remove saved calculator draft'); await click('Remove draft');
    expect(container.textContent).toContain('Could not remove this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.restoreAllMocks(); await reload(); expect(field('Confidence Level').value).toBe('0.95');
});

it.each(['{broken', JSON.stringify({ version: 2, data: createMultipleRegressionDraft(table) }), JSON.stringify({ version: 1, data: { ...createMultipleRegressionDraft(table), pastedRoles: { outcome: 'Y', predictors: ['X1', 'X1'] } } })])('does not overwrite invalid or incompatible storage on mount', async saved => {
    localStorage.setItem(key, saved); await mount(); expect(stats().n).toBe(15); expect(localStorage.getItem(key)).toBe(saved);
});

it('reports the size limit while preserving the last valid draft', async () => {
    await mount(); await change(container.querySelector('textarea'), table); const saved = localStorage.getItem(key);
    await change(container.querySelector('textarea'), ' '.repeat(250001)); expect(container.textContent).toContain('250,000-character limit');
    expect(localStorage.getItem(key)).toBe(saved); expect(stats()).toBeNull();
});
