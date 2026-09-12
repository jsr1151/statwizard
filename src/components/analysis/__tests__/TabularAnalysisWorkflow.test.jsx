// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PearsonCorrelationPage from '../../correlation/PearsonCorrelationPage.jsx';
import SimpleLinearRegressionPage from '../../regression/SimpleLinearRegressionPage.jsx';
import MultipleRegressionPage from '../../regression/MultipleRegressionPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { writeAnalysisLaunchPayload, inferAnalysisLaunchSelection } from '../../../utils/analysisLaunch.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const pages = [['Pearson', PearsonCorrelationPage], ['Simple regression', SimpleLinearRegressionPage], ['Multiple regression', MultipleRegressionPage]];
const savedPages = [['pearson_correlation', PearsonCorrelationPage], ['multiple_regression', MultipleRegressionPage]];
const table = 'X1,X2,Y\n-1,-1,4\n-1,-1,6\n-1,1,10\n-1,1,12\n1,-1,8\n1,-1,10\n1,1,14\n1,1,16';
let root, container, props;
beforeEach(() => {
    library.datasets = []; sessionStorage.clear();
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container);
    props = { section: 'calculator', darkMode: true, onStatsChange: vi.fn(), onOpenDataManager: vi.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); sessionStorage.clear(); });
const mount = async Page => act(async () => root.render(<StrictMode><Page {...props} /></StrictMode>));
const click = async text => act(async () => [...container.querySelectorAll('button')].find(n => n.textContent === text).click());
const change = async (node, value) => act(async () => {
    Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLSelectElement.prototype, 'value').set.call(node, value);
    node.dispatchEvent(new Event(node.tagName === 'TEXTAREA' ? 'input' : 'change', { bubbles: true }));
});
const stats = () => props.onStatsChange.mock.lastCall[0];

it.each(pages)('%s identifies entered data, preserves row matching, and clears stale shared statistics', async (_, Page) => {
    await mount(Page);
    expect(container.textContent).toContain('Active source: Example data.');
    await change(container.querySelector('textarea'), table + '\n,1,12\n1,,12');
    expect(stats()).toMatchObject({ ok: true, n: 8 });
    const summary = container.querySelector('[aria-label="Analysis data summary"]');
    expect(summary.textContent).toContain('8 of 10 rows are usable; 2 excluded');
    expect(summary.textContent).toContain('Data row 9: X1');
    expect(summary.textContent).toContain('Data row 10: X2');
    expect(summary.textContent).toContain('Entered table');
    await click('Go to results'); expect(document.activeElement.getAttribute('aria-label')).toBe('Analysis results');
    await change(container.querySelector('textarea'), '');
    expect(stats()).toBeNull();
    expect([...container.querySelectorAll('button')].some(n => n.textContent === 'Go to results')).toBe(false);
    await click('Load example data'); expect(stats()?.ok).toBe(true);
    expect(container.textContent).toContain('Active source: Example data.');
    await click('Import / manage data'); expect(props.onOpenDataManager).toHaveBeenCalledOnce();
});

it.each(savedPages)('%s preserves pasted data across sources and ignores a missing launch target', async (analysisId, Page) => {
    const { dataset } = buildDatasetFromDelimitedText({ text: table, datasetName: 'Available study' });
    library.datasets = [dataset];
    writeAnalysisLaunchPayload({ ...inferAnalysisLaunchSelection(dataset, analysisId), analysisId, datasetId: 'missing' });
    await mount(Page);
    expect(stats()).toBeNull();
    expect(container.querySelector('textarea')).toBeNull();
    await click('Paste / Upload'); await change(container.querySelector('textarea'), table);
    expect(stats().n).toBe(8);
    await click('Saved Dataset'); expect(stats()).toBeNull();
    await click('Paste / Upload'); expect(container.querySelector('textarea').value).toBe(table);
    expect(container.textContent).toContain('Active source: Entered table.');
});

it.each(savedPages)('%s waits for the requested dataset and respects a cleared role', async (analysisId, Page) => {
    const { dataset } = buildDatasetFromDelimitedText({ text: table, datasetName: 'Requested study' });
    writeAnalysisLaunchPayload({ ...inferAnalysisLaunchSelection(dataset, analysisId), analysisId });
    await mount(Page); expect(stats()).toBeNull();
    library.datasets = [dataset]; await mount(Page); expect(stats().n).toBe(8);
    expect(container.textContent).toContain('Active source: Requested study.');
    await change(container.querySelector('select[aria-label]'), ''); expect(stats()).toBeNull();
    expect([...container.querySelectorAll('button')].some(n => n.textContent === 'Go to results')).toBe(false);
});
