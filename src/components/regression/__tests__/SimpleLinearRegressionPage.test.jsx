// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import SimpleLinearRegressionPage from '../SimpleLinearRegressionPage.jsx';
import { POWER_TEST_BY_STEP_ID } from '../../../power/testRegistry.js';

vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => ({ datasets: [] }) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let container;
let props;
const mount = async (section = 'calculator') => {
    props = { section, darkMode: true, onStatsChange: vi.fn(), testConfig: POWER_TEST_BY_STEP_ID.regression_result };
    container = document.createElement('main');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<SimpleLinearRegressionPage {...props} />));
};
const rerender = async (changes) => {
    props = { ...props, ...changes };
    await act(async () => root.render(<SimpleLinearRegressionPage {...props} />));
};
afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
    root = null;
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

it('fits entered data, reports coefficients, and warns about extrapolation', async () => {
    await mount();
    await change(container.querySelector('textarea'), table);
    expect(stats()).toMatchObject({ ok: true, n: 5 });
    expect(stats().slope).toBeCloseTo(1.9);
    expect(stats().intercept).toBeCloseTo(1.3);
    expect(container.textContent).toContain('Y = 1.3 + 1.9 x X');
    await change(container.querySelector('input[type="number"]'), 10);
    expect(container.textContent).toContain('20.3');
    expect(container.textContent).toContain('extrapolation');
    await change(field('Confidence Level'), 0.99);
    expect(container.textContent).toContain('99% Mean CI');
});

it('rejects identical columns and invalid data, then recovers with sample data', async () => {
    await mount();
    await change(field('Outcome Y'), field('Predictor X').value);
    expect(container.textContent).toContain('Choose two different numeric columns');
    await change(container.querySelector('textarea'), 'X,Y\n1,2\n1,3\n1,4');
    expect(container.textContent).not.toContain('Coefficient summary');
    await change(container.querySelector('textarea'), '');
    expect(container.textContent).not.toContain('Coefficient summary');
    await click('Load example data');
    expect(stats().n).toBe(14);
    expect(container.textContent).toContain('Coefficient summary');
});

it('preserves calculator data, prediction, and plot toggles across sections and themes', async () => {
    await mount();
    await change(container.querySelector('textarea'), table);
    await change(container.querySelector('input[type="number"]'), 4);
    await click('Show Confidence Band');
    await click('Show Prediction Interval');
    await rerender({ section: 'lessons' });
    await rerender({ section: 'calculator', darkMode: false });
    expect(container.querySelector('textarea').value).toBe(table);
    expect(container.querySelector('input[type="number"]').value).toBe('4');
    expect(container.textContent).toContain('Hide Confidence Band');
    expect(container.textContent).toContain('Hide Prediction Interval');
    expect(stats().slope).toBeCloseTo(1.9);
});

it('keeps lesson controls and outlier sample changes independent of the calculator', async () => {
    await mount('lessons');
    const points = () => container.querySelectorAll('circle').length;
    const before = points();
    await click('Add Outlier');
    expect(points()).toBe(before + 1);
    await click('Show Residual Overlay');
    await click('Downward Slope / Tight Fit');
    expect(container.textContent).toContain('A clear negative slope');
    await rerender({ section: 'calculator' });
    expect(stats().n).toBe(14);
    await rerender({ section: 'lessons' });
    expect(container.textContent).toContain('Remove Outlier');
    expect(container.textContent).toContain('Hide Residual Overlay');
    const plot = () => [...container.querySelectorAll('svg')].find(node => node.querySelectorAll('circle').length > 10);
    const sample = plot().innerHTML;
    await click('Regenerate Sample');
    expect(plot().innerHTML).not.toBe(sample);
});

it('keeps effect-size edits when visiting assumptions and returning', async () => {
    await mount('effect_size');
    await change(field('Slope (b)'), 2);
    await change(field('Change in X'), 3);
    expect(container.textContent).toContain('Predicted Change6');
    await rerender({ section: 'assumptions' });
    expect(container.textContent).toContain('Simple linear regression assumptions');
    await rerender({ section: 'effect_size' });
    expect(field('Slope (b)').value).toBe('2');
    expect(field('Change in X').value).toBe('3');
});

it('opens the supplied power mode', async () => {
    await mount('power');
    await rerender({ initialPowerMode: 'sensitivity' });
    const selected = [...container.querySelectorAll('button')].find(node => node.textContent.trim() === 'Sensitivity');
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain('Simple linear regression power planning');
});

it('uploads CSV data and retains the selected case across section changes', async () => {
    await mount();
    const upload = container.querySelector('input[type="file"]');
    Object.defineProperty(upload, 'files', { configurable: true, value: [{ text: async () => table }] });
    await act(async () => upload.dispatchEvent(new Event('change', { bubbles: true })));
    expect(container.querySelector('textarea').value).toBe(table);
    expect(stats().n).toBe(5);
    const point = container.querySelector('circle[style*="pointer"]');
    await act(async () => point.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(point.getAttribute('r')).toBe('6.8');
    await rerender({ section: 'effect_size' });
    await rerender({ section: 'calculator' });
    expect(container.querySelector('circle[style*="pointer"]').getAttribute('r')).toBe('6.8');
});
