// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OneSampleTTestPage from '../OneSampleTTestPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { ONE_SAMPLE_DRAFT_KEY as key, createOneSampleDraft, oneSampleDraftStorage as storage } from '../../../utils/oneSampleDraft.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
vi.mock('../../visuals/NormalDistributionVisual.jsx', () => ({ default: () => <p>Lesson visual</p> }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, onStatsChange;
beforeEach(() => {
    localStorage.clear(); sessionStorage.clear(); library.datasets = [];
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container); onStatsChange = vi.fn();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
const mount = async (section = 'calculator') => act(async () => root.render(<StrictMode><OneSampleTTestPage section={section} darkMode={false} onStatsChange={onStatsChange} /></StrictMode>));
const reload = async () => { await act(async () => root.unmount()); root = createRoot(container); await mount(); };
const field = label => container.querySelector(`[aria-label="${label}"]`);
const change = async (node, value) => act(async () => {
    const proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, String(value)); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async label => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label).click());
const stats = () => onStatsChange.mock.lastCall[0];
const study = name => {
    const dataset = buildDatasetFromDelimitedText({ text: 'Value,Other\n1,9\n2,8\n3,7\n4,6\n5,3\n,2\nnope,1', datasetName: name }).dataset;
    dataset.columns[0].manualTags = ['outcome'];
    return dataset;
};

it('restores summary inputs and all inference settings without writing on mount', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem'); await mount(); expect(write).not.toHaveBeenCalled();
    await change(field('Sample mean'), 8.1); await change(field('Sample standard deviation'), 1.7); await change(field('Sample size'), 12);
    await change(field('Null population mean'), 8); await change(field('Significance level'), 0.1);
    await change(field('Alternative hypothesis'), 'less'); await change(field('Confidence interval type'), 'one-sided');
    const before = stats(); write.mockClear(); await reload(); expect(write).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Recovered your calculator draft'); expect(field('Sample mean').value).toBe('8.1');
    expect(field('Sample size').value).toBe('12'); expect(field('Alternative hypothesis').value).toBe('less'); expect(field('Confidence interval type').value).toBe('one-sided');
    expect(stats().t).toBe(before.t); expect(stats().p).toBe(before.p); expect(stats().confidenceInterval).toEqual(before.confidenceInterval); expect(container.textContent).toContain('-Infinity');
});

it('recovers exact raw inputs, excludes invalid entries, and preserves full precision', async () => {
    await mount(); await click('Raw data'); await change(field('Sample raw values'), ' 1.123456789, 2.234567891; 4.345678912\n5.456789123, nope, 12oops '); await change(field('Null population mean'), 0);
    const before = stats(); await reload(); expect(field('Sample raw values').value).toContain('1.123456789');
    expect(stats().n).toBe(4); expect(stats().mean).toBeCloseTo(3.29012317875, 12); expect(stats().p).toBe(before.p);
    expect(container.textContent).toContain('4 of 6 nonempty entries included; 2 excluded'); expect(container.textContent).toContain('12oops');
});

it.each(['', 'nope', '1', '3,3,3'])('keeps unusable raw input %j and suppresses stale results', async raw => {
    await mount(); await click('Raw data'); await change(field('Sample raw values'), raw); await reload();
    expect(field('Sample raw values').value).toBe(raw); expect(stats()).toBeNull(); expect(container.textContent).toContain('Complete the test inputs');
});

it.each([['Sample mean', ''], ['Sample standard deviation', '-1'], ['Sample size', '2.5'], ['Null population mean', '']])('preserves invalid %s input without coercion', async (label, value) => {
    await mount(); await change(field(label), value); await reload(); expect(field(label).value).toBe(value); expect(stats()).toBeNull();
});

it('keeps raw and summary inputs through mode, section, and source changes', async () => {
    await mount(); await change(field('Sample mean'), 8); await click('Raw data'); await change(field('Sample raw values'), '1,2,3,6');
    await mount('lessons'); expect(container.textContent).toContain('Lesson visual'); await mount(); expect(field('Sample raw values').value).toBe('1,2,3,6');
    await click('Summary statistics'); expect(field('Sample mean').value).toBe('8'); await click('Saved dataset'); expect(stats()).toBeNull();
    await click('Example / manual input'); expect(field('Sample mean').value).toBe('8'); await click('Raw data'); expect(stats().n).toBe(4);
});

it('updates a saved dataset with unchanged row count and makes edits only through an explicit manual copy', async () => {
    const dataset = study('Study'); library.datasets = [dataset]; writeAnalysisLaunchPayload(inferAnalysisLaunchSelection(dataset, 'one_sample_t_test')); await mount();
    expect(stats().n).toBe(5); expect(stats().mean).toBe(3); expect(field('Sample raw values').readOnly).toBe(true);
    await change(field('Null population mean'), 0); await reload();
    const outcome = field('Sample variable').value;
    library.datasets = [{ ...dataset, rows: dataset.rows.map((row, index) => index === 0 ? { ...row, [outcome]: 11 } : row) }]; await mount(); expect(stats().mean).toBe(5);
    await click('Edit a copy'); expect(field('Sample raw values').readOnly).toBe(false); expect(container.textContent).toContain('Edited copy of Study');
    await change(field('Sample raw values'), '10,20,30'); await reload(); expect(stats().mean).toBe(20); expect(field('Sample raw values').readOnly).toBe(false);
    await click('Saved dataset'); expect(stats().mean).toBe(5); await click('Example / manual input'); expect(stats().mean).toBe(20);
});

it('waits for the referenced dataset and respects cleared, missing, and changed-type sample variables', async () => {
    const dataset = study('Study'); library.datasets = [dataset]; writeAnalysisLaunchPayload(inferAnalysisLaunchSelection(dataset, 'one_sample_t_test')); await mount(); await change(field('Null population mean'), 0);
    library.datasets = []; await reload(); expect(stats()).toBeNull(); library.datasets = [study('Other')]; await mount(); expect(stats()).toBeNull();
    library.datasets = [dataset]; await mount(); expect(stats().n).toBe(5); await change(field('Sample variable'), ''); await reload(); expect(stats()).toBeNull();
    await change(field('Sample variable'), dataset.columns[0].id); expect(stats().n).toBe(5);
    library.datasets = [{ ...dataset, columns: dataset.columns.map((column, index) => index === 0 ? { ...column, summary: { ...column.summary, detectedType: 'categorical' } } : column) }]; await mount(); expect(stats()).toBeNull();
});

it('remembers different saved variable choices and gives fresh launches priority over an old draft', async () => {
    const first = study('First'), second = study('Second'); library.datasets = [first, second];
    writeAnalysisLaunchPayload(inferAnalysisLaunchSelection(first, 'one_sample_t_test')); await mount(); await change(field('Sample variable'), first.columns[1].id);
    const datasetSelect = () => container.querySelector('[aria-label="Saved dataset setup"] select:not([aria-label])');
    await change(datasetSelect(), second.id); await change(field('Sample variable'), second.columns[0].id); await change(field('Alternative hypothesis'), 'less'); await change(field('Null population mean'), 4);
    await reload(); expect(field('Sample variable').value).toBe(second.columns[0].id); await change(datasetSelect(), first.id); expect(field('Sample variable').value).toBe(first.columns[1].id);
    const saved = localStorage.getItem(key); writeAnalysisLaunchPayload(inferAnalysisLaunchSelection(second, 'one_sample_t_test')); await reload();
    expect(field('Null population mean').value).toBe('100'); expect(field('Alternative hypothesis').value).toBe('two-sided'); expect(localStorage.getItem(key)).toBe(saved);
});

it('saves the hypothesis atomically and makes a one-sided bound direction explicit for a two-sided test', async () => {
    await mount(); const write = vi.spyOn(Storage.prototype, 'setItem'); await change(field('Alternative hypothesis'), 'less'); expect(write).toHaveBeenCalledOnce(); expect(storage.read()).toMatchObject({ tails: 1, direction: 'less' });
    await change(field('Alternative hypothesis'), 'two-sided'); await change(field('Confidence interval type'), 'one-sided'); await change(field('One-sided bound'), 'greater'); await reload();
    expect(stats().tails).toBe(2); expect(stats().confidenceInterval.upper).toBe(Infinity); expect(field('One-sided bound').value).toBe('greater');
});

it('keeps current inputs open when removing the draft and leaves other calculators untouched', async () => {
    localStorage.setItem('other-calculator', 'untouched'); await mount(); await change(field('Sample mean'), 9);
    await click('Remove saved calculator draft'); await click('Keep draft'); expect(document.activeElement.textContent).toBe('Remove saved calculator draft');
    await click('Remove saved calculator draft'); await click('Remove draft'); expect(localStorage.getItem(key)).toBeNull(); expect(field('Sample mean').value).toBe('9'); expect(localStorage.getItem('other-calculator')).toBe('untouched');
    await reload(); expect(field('Sample mean').value).toBe('105'); expect(localStorage.getItem(key)).toBeNull();
});

it('reports failed saves and deletion without losing current or previously saved values', async () => {
    await mount(); await change(field('Sample mean'), 9); const saved = localStorage.getItem(key);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); }); await change(field('Sample mean'), 11);
    expect(field('Sample mean').value).toBe('11'); expect(container.textContent).toContain('Could not save this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); }); await click('Remove saved calculator draft'); await click('Remove draft'); expect(container.textContent).toContain('Could not remove this draft');
    vi.restoreAllMocks(); await reload(); expect(field('Sample mean').value).toBe('9');
});

it.each(['{broken', JSON.stringify({ version: 2, data: createOneSampleDraft() }), JSON.stringify({ version: 1, data: { ...createOneSampleDraft(), alpha: -0.5 } })])('ignores incompatible or malformed drafts without overwriting them', async saved => {
    localStorage.setItem(key, saved); await mount(); expect(stats().n).toBe(30); expect(localStorage.getItem(key)).toBe(saved);
});

it('reports oversized input without replacing the last saved draft', async () => {
    await mount(); await click('Raw data'); await change(field('Sample raw values'), '1,2,3'); const saved = localStorage.getItem(key);
    await change(field('Sample raw values'), ' '.repeat(250001)); expect(container.textContent).toContain('250,000-character limit'); expect(localStorage.getItem(key)).toBe(saved);
});

it('focuses results and offers a selectable report when copying is denied', async () => {
    await mount(); await change(field('Alternative hypothesis'), 'less'); await change(field('Confidence interval type'), 'one-sided');
    await click('Go to results'); expect(document.activeElement.getAttribute('aria-label')).toBe('One-sample t-test results');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => { throw new Error('denied'); }) } });
    await click('Copy test report'); const text = container.querySelector('textarea[readonly]').value;
    expect(text).toContain('One-sample t-test'); expect(text).toContain('Source: Example starting values.'); expect(text).toContain('null mean = 100'); expect(text).toContain('-Infinity');
});
