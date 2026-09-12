// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import MultipleRegressionPage from '../MultipleRegressionPage.jsx';
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
const render = () => root.render(<StrictMode><DatasetLibraryProvider><MultipleRegressionPage {...props} /></DatasetLibraryProvider></StrictMode>);
const mount = async (section = 'calculator') => {
    props = { section, darkMode: true, onStatsChange: vi.fn(), testConfig: POWER_TEST_BY_STEP_ID.multiple_regression_result };
    container = document.createElement('main');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => render());
};
const rerender = async changes => {
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
const field = text => [...container.querySelectorAll('label')].find(node => node.textContent.includes(text))?.querySelector('input,select');
const change = async (node, value) => act(async () => {
    const prototype = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async text => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim().startsWith(text)).click());
const toggle = async text => act(async () => field(text).click());
const stats = () => props.onStatsChange.mock.lastCall[0];
const table = 'X1,X2,Y\n-1,-1,4\n-1,-1,6\n-1,1,10\n-1,1,12\n1,-1,8\n1,-1,10\n1,1,14\n1,1,16';

it('fits known conditional slopes and updates confidence and prediction inputs', async () => {
    await mount();
    await change(container.querySelector('textarea'), table);
    expect(stats()).toMatchObject({ ok: true, n: 8, predictorCount: 2 });
    expect(stats().intercept).toBeCloseTo(10);
    expect(stats().coefficients.find(c => c.label === 'X1').estimate).toBeCloseTo(2);
    expect(stats().coefficients.find(c => c.label === 'X2').estimate).toBeCloseTo(3);
    expect(stats().rSquared).toBeCloseTo(13 / 14);
    await change(field('Confidence Level'), 0.99);
    expect(container.textContent).toContain('99%');
    const prediction = [...container.querySelectorAll('label')].find(node => node.textContent.includes('X1') && node.textContent.includes('Observed range')).querySelector('input');
    const modelUpdates = props.onStatsChange.mock.calls.length;
    await change(prediction, 1);
    expect(prediction.value).toBe('1');
    expect(props.onStatsChange).toHaveBeenCalledTimes(modelUpdates);
});

it('excludes incomplete rows and rejects a singular model before recovering', async () => {
    await mount();
    await change(container.querySelector('textarea'), table + '\n,1,12');
    expect(stats().n).toBe(8);
    await change(container.querySelector('textarea'), 'X1,X2,Y\n1,2,3\n2,4,5\n3,6,8\n4,8,10\n5,10,12');
    expect(container.textContent).toContain('Complete the model setup');
    await change(container.querySelector('textarea'), '');
    expect(container.textContent).toContain('Complete the model setup');
    await click('Load example data');
    expect(stats()).toMatchObject({ ok: true, n: 15 });
});

it('uploads data and preserves calculator settings across sections and themes', async () => {
    await mount();
    const upload = container.querySelector('input[type="file"]');
    Object.defineProperty(upload, 'files', { configurable: true, value: [{ text: async () => table }] });
    await act(async () => upload.dispatchEvent(new Event('change', { bubbles: true })));
    await change(field('Confidence Level'), 0.9);
    await rerender({ section: 'lessons' });
    await rerender({ section: 'calculator', darkMode: false });
    expect(container.querySelector('textarea').value).toBe(table);
    expect(field('Confidence Level').value).toBe('0.9');
    expect(stats().n).toBe(8);
});

it('preserves lesson scenarios, context, outliers, and visibility independently of calculator data', async () => {
    await mount('lessons');
    await click('Competing Slopes');
    expect(field('Strength of X2').value).toBe('-0.85');
    await click('Study + Attendance');
    expect(container.textContent).toContain('Exam score');
    await toggle('Add influential outlier');
    await toggle('Show residual plot');
    expect(container.textContent).toContain('Pinned Residual Plot');
    await rerender({ section: 'calculator' });
    expect(stats().n).toBe(15);
    await rerender({ section: 'lessons' });
    expect(field('Add influential outlier').checked).toBe(true);
    expect(field('Strength of X2').value).toBe('-0.85');
    expect(container.textContent).toContain('Exam score');
    expect(container.textContent).toContain('Pinned Residual Plot');
}, 15000); // Real plots and repeated model fits also run under parallel suite load.

it('switches lesson visualizations and regenerates the active sample', async () => {
    await mount('lessons');
    const points = () => [...container.querySelectorAll('circle')].map(n => [n.getAttribute('cx'), n.getAttribute('cy')]);
    const before = points();
    await click('Regenerate Sample');
    expect(points()).not.toEqual(before);
    await click('3D Plane View');
    expect(container.textContent).toContain('3D Regression Plane');
    await click('Partial Effect of Predictor X1');
    expect(container.textContent).toContain('conditional slope');
}, 15000);

it('retains effect-size edits across assumptions and opens the supplied power mode', async () => {
    await mount('effect_size');
    await change(field('Model Fit (R^2)'), 0.5);
    await change(field('Sample Size (N)'), 80);
    await rerender({ section: 'assumptions' });
    expect(container.textContent).toContain('Multiple regression assumptions');
    await rerender({ section: 'effect_size' });
    expect(field('Model Fit (R^2)').value).toBe('0.5');
    expect(field('Sample Size (N)').value).toBe('80');
    await rerender({ section: 'power', initialPowerMode: 'sensitivity' });
    expect([...container.querySelectorAll('button')].find(n => n.textContent.trim() === 'Sensitivity').getAttribute('aria-pressed')).toBe('true');
});

it('applies saved dataset launch roles and keeps complete cases after navigation', async () => {
    const { dataset } = buildDatasetFromDelimitedText({ text: table + '\n,1,12', datasetName: 'Conditional slopes' });
    loadStoredDatasets.mockResolvedValue([dataset]);
    writeAnalysisLaunchPayload({ analysisId: 'multiple_regression', datasetId: dataset.id, outcome: dataset.columns[2].id, predictors: dataset.columns.slice(0, 2).map(c => c.id) });
    await mount();
    expect(container.querySelector('textarea')).toBeNull();
    expect(stats()).toMatchObject({ ok: true, n: 8, predictorCount: 2 });
    expect(props.onStatsChange.mock.calls.some(([value]) => value?.ok && value.n === 15)).toBe(false);
    expect(stats().intercept).toBeCloseTo(10);
    await rerender({ section: 'lessons' });
    await rerender({ section: 'calculator' });
    expect(container.querySelector('textarea')).toBeNull();
    expect(stats().rSquared).toBeCloseTo(13 / 14);
});

it('returns from an empty saved library to pasted data', async () => {
    await mount();
    await click('Saved Dataset');
    expect(container.textContent).toContain('Save a dataset in Data Manager first');
    await click('Paste / Upload');
    expect(stats().n).toBe(15);
});
