// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RankTestPage from '../RankTestPage.jsx';
import { DatasetLibraryProvider } from '../../../hooks/useDatasetLibrary.js';
import { buildDatasetFromGrid } from '../../../utils/datasetImport.js';
import { ANALYSIS_LAUNCH_SESSION_KEY } from '../../../utils/analysisLaunch.js';
import { loadStoredDatasets } from '../../../utils/datasetStore.js';

vi.mock('../../../utils/datasetStore.js', () => ({ loadStoredDatasets: vi.fn(async () => []), persistDatasetRecord: vi.fn(), removeDatasetRecord: vi.fn() }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, props;
const render = () => root.render(<StrictMode><DatasetLibraryProvider><RankTestPage {...props} /></DatasetLibraryProvider></StrictMode>);
beforeEach(() => {
    vi.clearAllMocks(); loadStoredDatasets.mockResolvedValue([]); sessionStorage.clear();
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container);
    props = { paired: false, section: 'calculator', darkMode: true, onOpenDataManager: vi.fn(), onSectionChange: vi.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); sessionStorage.clear(); });
const button = text => [...container.querySelectorAll('button')].find(node => node.textContent === text);
const click = async text => act(async () => button(text).click());
const change = async (label, value) => act(async () => {
    const field = [...container.querySelectorAll('label')].find(node => node.firstChild?.textContent === label).querySelector('textarea,select');
    Object.getOwnPropertyDescriptor(field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLSelectElement.prototype, 'value').set.call(field, value);
    field.dispatchEvent(new Event(field.tagName === 'TEXTAREA' ? 'input' : 'change', { bubbles: true }));
});

it.each([false,true])('calculates an explicitly selected example and clears stale results on edit: paired=%s', async paired => {
    props.paired = paired; await act(async () => render());
    expect(container.textContent).not.toContain('Analysis results');
    await click('Load worked example'); await click('Calculate test');
    expect(container.textContent).toContain(paired ? 'W+ = 21' : 'U_A = 0');
    expect(container.textContent).toContain(paired ? 'p = .031' : 'p = .100');
    expect(document.activeElement.getAttribute('aria-label')).toBe('Calculation output');
    expect(container.querySelector('textarea[readonly]').value).toContain('Worked example (sample data)');
    props.section = 'assumptions'; await act(async () => render());
    props.section = 'calculator'; await act(async () => render());
    expect(container.textContent).toContain('Analysis results');
    await change('Sample A','bad');
    expect(container.textContent).not.toContain('Analysis results');
    await click('Calculate test'); expect(container.querySelector('[role=alert]')).not.toBeNull();
});

it('keeps paired positions, documents exclusions, and supports changing inference settings', async () => {
    props.paired = true; await act(async () => render());
    await change('Sample A','2\nNA\n4\n4'); await change('Sample B','1\n9\n4\n2');
    await click('Calculate test');
    expect(container.textContent).toContain('1 incomplete pairs and 1 zero differences');
    expect(container.textContent).toContain('W+ = 3');
    await change('Alternative','greater'); expect(container.textContent).not.toContain('Analysis results');
    await click('Calculate test'); expect(container.textContent).toContain('p = .250');
    await change('Inference method','asymptotic'); await click('Calculate test');
    expect(container.querySelector('textarea[readonly]').value).toContain('normal approximation');
});

it.each([false,true])('consumes a saved-data launch safely in Strict Mode: paired=%s', async paired => {
    const dataset = buildDatasetFromGrid({grid:[['Score','After','Group'],[1,0,'Low'],[2,1,'Low'],[3,2,'High'],[4,3,'High']],datasetName:'Study',hasHeaderRow:true});
    const ids=dataset.columns.map(c=>c.id);
    loadStoredDatasets.mockResolvedValue([dataset]);
    sessionStorage.setItem(ANALYSIS_LAUNCH_SESSION_KEY,JSON.stringify({analysisId:paired?'wilcoxon_signed_rank':'mann_whitney',datasetId:dataset.id,first:ids[0],second:ids[1],outcome:ids[0],grouping:ids[2]}));
    props.paired=paired;await act(async()=>render());
    expect(sessionStorage.getItem(ANALYSIS_LAUNCH_SESSION_KEY)).toBeNull();
    expect(container.textContent).not.toContain('Worked example loaded');
    await click('Calculate test');
    expect(container.querySelector('[role=alert]')).toBeNull();
    expect(container.querySelector('textarea[readonly]').value).toContain(paired ? 'A = Score; B = After' : 'A = Low, B = High');
});
