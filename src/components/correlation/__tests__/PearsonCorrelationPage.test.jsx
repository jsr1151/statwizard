// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import PearsonCorrelationPage from '../PearsonCorrelationPage.jsx';
import { DatasetLibraryProvider } from '../../../hooks/useDatasetLibrary.js';
import { loadStoredDatasets } from '../../../utils/datasetStore.js';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { POWER_TEST_BY_STEP_ID } from '../../../power/testRegistry.js';

vi.mock('../../../utils/datasetStore.js', () => ({
    loadStoredDatasets: vi.fn(async () => []),
    persistDatasetRecord: vi.fn(),
    removeDatasetRecord: vi.fn(),
}));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let container;
let props;
const render = () => root.render(<DatasetLibraryProvider><PearsonCorrelationPage {...props} /></DatasetLibraryProvider>);
const mount = async (section = 'calculator') => {
    props = { section, darkMode: true, onStatsChange: vi.fn(), testConfig: POWER_TEST_BY_STEP_ID.correlation_result };
    container = document.createElement('main');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => render());
};
const rerender = async (changes) => {
    props = { ...props, ...changes };
    await act(async () => render());
};
afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
    root = null;
    sessionStorage.clear();
    loadStoredDatasets.mockResolvedValue([]);
});
const field = (text) => [...container.querySelectorAll('label')].find(node => node.textContent.includes(text))?.querySelector('input,select');
const change = async (node, value) => act(async () => {
    const prototype = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async (text) => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === text).click());
const stats = () => props.onStatsChange.mock.lastCall[0];
const table = 'X,Y\n1,3\n2,5\n3,8\n4,8\n5,11';

it('calculates correlation and updates direction, confidence, and the nonzero null test', async () => {
    await mount();
    await change(container.querySelector('textarea'), table);
    expect(stats()).toMatchObject({ ok: true, n: 5 });
    expect(stats().r).toBeCloseTo(19 / Math.sqrt(382));
    const twoTailedP = stats().hypothesisTest.pValue;
    await click('Positive');
    expect(stats().hypothesisTest.pValue).toBeCloseTo(twoTailedP / 2);
    await click('Negative');
    expect(stats().hypothesisTest.pValue).toBeGreaterThan(0.99);
    await change(field('Confidence Level'), 0.99);
    expect(container.textContent).toContain('99% CI for r');
    await change(field('Null Population Correlation'), 0.4);
    expect(stats().hypothesisTest.method).toBe('fisher_z');
});

it('rejects identical columns and invalid data, then recovers with sample data', async () => {
    await mount();
    await change(field('Y Variable'), field('X Variable').value);
    expect(container.textContent).toContain('Choose two different numeric columns');
    await change(container.querySelector('textarea'), 'X,Y\n1,2\n1,3\n1,4');
    expect(container.textContent).not.toContain('95% CI for r');
    await change(container.querySelector('textarea'), '');
    expect(container.textContent).not.toContain('95% CI for r');
    await click('Load example data');
    expect(stats().n).toBe(11);
    expect(container.textContent).toContain('95% CI for r');
});

it('uploads data and preserves calculator options across sections and themes', async () => {
    await mount();
    const upload = container.querySelector('input[type="file"]');
    Object.defineProperty(upload, 'files', { configurable: true, value: [{ text: async () => table }] });
    await act(async () => upload.dispatchEvent(new Event('change', { bubbles: true })));
    await click('Show Band');
    await click('Hide Line');
    await change(field('Confidence Level'), 0.9);
    await rerender({ section: 'lessons' });
    await rerender({ section: 'calculator', darkMode: false });
    expect(container.querySelector('textarea').value).toBe(table);
    expect(stats().n).toBe(5);
    expect(container.textContent).toContain('Hide Band');
    expect(container.textContent).toContain('Show Line');
    expect(field('Confidence Level').value).toBe('0.9');
});

it('preserves lesson controls independently of calculator data', async () => {
    await mount('lessons');
    const points = () => container.querySelectorAll('circle').length;
    const before = points();
    await click('Add Outlier');
    expect(points()).toBe(before + 1);
    await click('Show Band');
    await change(container.querySelector('input[type="range"]'), 50);
    await rerender({ section: 'calculator' });
    expect(stats().n).toBe(11);
    await rerender({ section: 'lessons' });
    expect(container.textContent).toContain('Remove Outlier');
    expect(container.textContent).toContain('Hide Band');
    expect(container.querySelector('input[type="range"]').value).toBe('50');
});

it('explains restricted range and regenerates the selected pattern', async () => {
    await mount('lessons');
    await click('Restricted Range');
    expect(container.textContent).toContain('Why the restricted-range preset looks weaker');
    const plot = () => [...container.querySelectorAll('svg')].find(node => node.querySelectorAll('circle').length > 10);
    const sample = plot().innerHTML;
    await click('Regenerate Sample');
    expect(plot().innerHTML).not.toBe(sample);
});

it('translates signed effect sizes and retains edits across assumptions', async () => {
    await mount('effect_size');
    await change(field('Sample Correlation'), -0.5);
    expect(field('Variance Explained').value).toBe('0.250');
    await change(field('Variance Explained'), 0.64);
    expect(field('Sample Correlation').value).toBe('-0.8');
    await rerender({ section: 'assumptions' });
    expect(container.textContent).toContain('Pearson correlation assumptions');
    await rerender({ section: 'effect_size' });
    expect(field('Sample Correlation').value).toBe('-0.8');
});

it('opens the supplied power mode', async () => {
    await mount('power');
    await rerender({ initialPowerMode: 'sensitivity' });
    const selected = [...container.querySelectorAll('button')].find(node => node.textContent.trim() === 'Sensitivity');
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain('Pearson correlation power planning');
});

it('shows an empty saved library and returns to pasted data', async () => {
    await mount();
    await click('Saved Dataset');
    expect(container.textContent).toContain('Save a dataset in Data Manager first');
    await click('Paste / Upload');
    expect(stats().n).toBe(11);
    expect(container.querySelector('textarea')).not.toBeNull();
});

it('applies launch roles after saved datasets load and retains complete cases across sections', async () => {
    const { dataset } = buildDatasetFromDelimitedText({
        text: 'Unused,X,Y\n8,1,3\n7,2,5\n6,3,8\n5,4,8\n4,5,11\n3,,12', datasetName: 'Paired observations',
    });
    loadStoredDatasets.mockResolvedValue([dataset]);
    writeAnalysisLaunchPayload({ analysisId: 'pearson_correlation', datasetId: dataset.id, x: dataset.columns[1].id, y: dataset.columns[2].id });
    await mount();
    expect(container.querySelector('textarea')).toBeNull();
    expect(container.textContent).toContain('5 of 6 rows are usable');
    expect(stats().n).toBe(5);
    expect(stats().r).toBeCloseTo(19 / Math.sqrt(382));
    await rerender({ section: 'lessons' });
    await rerender({ section: 'calculator' });
    expect(container.textContent).toContain('5 of 6 rows are usable');
    expect(stats().r).toBeCloseTo(19 / Math.sqrt(382));
});
