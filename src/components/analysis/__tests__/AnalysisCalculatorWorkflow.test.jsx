// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import OneSampleTTestPage from '../OneSampleTTestPage.jsx';
import IndependentTTestPage from '../IndependentTTestPage.jsx';
import PairedTTestPage from '../PairedTTestPage.jsx';
import OneWayAnovaPage from '../OneWayAnovaPage.jsx';
import FactorialAnovaPage from '../FactorialAnovaPage.jsx';
import AncovaPage from '../AncovaPage.jsx';
import { buildDatasetFromGrid } from '../../../utils/datasetImport.js';
import { ANALYSIS_LAUNCH_SESSION_KEY, inferAnalysisLaunchSelection } from '../../../utils/analysisLaunch.js';

const state = vi.hoisted(() => ({ datasets: [], renders: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => state }));
const visual = ({ datasetSeed }) => { state.renders.push(datasetSeed); return <output data-testid="calculator">{datasetSeed ? JSON.stringify(datasetSeed) : 'Example values'}</output>; };
vi.mock('../../visuals/NormalDistributionVisual.jsx', () => ({ default: props => visual(props) }));
vi.mock('../../visuals/IndependentTTestVisual.jsx', () => ({ default: props => visual(props) }));
vi.mock('../../visuals/PairedTTestVisual.jsx', () => ({ default: props => visual(props) }));
vi.mock('../../visuals/AnovaVisual.jsx', () => ({ default: props => visual(props) }));
vi.mock('../../visuals/FactorialAnovaVisual.jsx', () => ({ default: props => visual(props) }));
vi.mock('../../visuals/AncovaVisual.jsx', () => ({ default: props => visual(props) }));

const pages = [
    ['one_sample_t_test', OneSampleTTestPage], ['independent_t_test', IndependentTTestPage],
    ['paired_t_test', PairedTTestPage], ['one_way_anova', OneWayAnovaPage],
    ['factorial_anova', FactorialAnovaPage], ['ancova', AncovaPage],
];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, props;
beforeEach(() => {
    state.datasets = []; state.renders = []; sessionStorage.clear();
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container);
    props = { section: 'calculator', darkMode: true, onOpenDataManager: vi.fn(), onStatsChange: vi.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); sessionStorage.clear(); });
const mount = async Page => act(async () => root.render(<StrictMode><Page {...props} /></StrictMode>));
const click = async text => act(async () => [...container.querySelectorAll('button')].find(n => n.textContent === text).click());
const calculator = () => container.querySelector('[data-testid=calculator]');
const study = () => buildDatasetFromGrid({
    datasetName: 'Study', hasHeaderRow: true,
    grid: [['Group', 'Factor', 'Pre', 'Post', 'Outcome'],
        ['A', 'X', 1, 2, 4], ['A', 'X', 2, 4, 5], ['A', 'Y', 3, 6, 7], ['A', 'Y', 4, 7, 9],
        ['B', 'X', 5, 8, 10], ['B', 'X', 6, 11, 12], ['B', 'Y', 7, 13, 14], ['B', 'Y', 8, 14, 17]],
});

it.each(pages)('%s starts with clearly identified examples and hides saved-data setup until requested', async (_, Page) => {
    await mount(Page);
    expect(calculator().textContent).toBe('Example values');
    expect(container.textContent).toContain('Example starting values.');
    expect(container.querySelector('[aria-label="Saved dataset setup"]')).toBeNull();
    await click('Go to calculator'); expect(document.activeElement.getAttribute('aria-label')).toBe('Active calculator');
    await click('Saved dataset'); expect(calculator()).toBeNull();
    expect(props.onStatsChange).toHaveBeenCalledWith(null);
    expect(container.querySelectorAll('select')).toHaveLength(1);
    expect(container.querySelector('select').disabled).toBe(true);
    await click('Import / manage data'); expect(props.onOpenDataManager).toHaveBeenCalledOnce();
    await click('Example / manual input'); expect(calculator().textContent).toBe('Example values');
});

it.each(pages)('%s launches saved data without rendering example results and removes results after invalid mapping', async (analysisId, Page) => {
    const dataset = study();
    const selection = inferAnalysisLaunchSelection(dataset, analysisId);
    expect(selection).not.toBeNull();
    sessionStorage.setItem(ANALYSIS_LAUNCH_SESSION_KEY, JSON.stringify({ ...selection, analysisId }));
    // Hold the library empty for the initial render, as while IndexedDB loads.
    await mount(Page); expect(calculator()).toBeNull();
    state.datasets = [dataset]; await mount(Page);
    expect(calculator()).not.toBeNull();
    expect(state.renders.length).toBeGreaterThan(0); expect(state.renders.every(Boolean)).toBe(true);
    expect(container.textContent).toContain('Selected dataset: Study');
    expect(sessionStorage.getItem(ANALYSIS_LAUNCH_SESSION_KEY)).toBeNull();
    const role = container.querySelector('select[aria-label]');
    await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(role, '');
        role.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(calculator()).toBeNull(); expect(props.onStatsChange).toHaveBeenLastCalledWith(null);
});

it('does not substitute another saved dataset when a launch target is missing', async () => {
    state.datasets = [study()];
    sessionStorage.setItem(ANALYSIS_LAUNCH_SESSION_KEY, JSON.stringify({ analysisId: 'one_sample_t_test', datasetId: 'missing', outcome: state.datasets[0].columns[4].id }));
    await mount(OneSampleTTestPage);
    expect(calculator()).toBeNull(); expect(state.renders).toHaveLength(0);
    expect(container.textContent).not.toContain('Selected dataset: Study');
});
