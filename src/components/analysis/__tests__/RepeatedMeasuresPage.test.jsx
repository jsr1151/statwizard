// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RepeatedMeasuresPage from '../RepeatedMeasuresPage.jsx';
import { DatasetLibraryProvider } from '../../../hooks/useDatasetLibrary.js';
import { buildDatasetFromGrid } from '../../../utils/datasetImport.js';
import { ANALYSIS_LAUNCH_SESSION_KEY, inferAnalysisLaunchSelection } from '../../../utils/analysisLaunch.js';
import { loadStoredDatasets } from '../../../utils/datasetStore.js';

vi.mock('../../../utils/datasetStore.js', () => ({loadStoredDatasets:vi.fn(async()=>[]),persistDatasetRecord:vi.fn(),removeDatasetRecord:vi.fn()}));
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let root,container,props;
const render=()=>root.render(<StrictMode><DatasetLibraryProvider><RepeatedMeasuresPage {...props}/></DatasetLibraryProvider></StrictMode>);
beforeEach(()=>{
    vi.clearAllMocks();loadStoredDatasets.mockResolvedValue([]);sessionStorage.clear();
    container=document.createElement('main');document.body.appendChild(container);root=createRoot(container);
    props={section:'calculator',darkMode:true,onOpenDataManager:vi.fn(),onSectionChange:vi.fn()};
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();sessionStorage.clear();});
const click=async text=>act(async()=>[...container.querySelectorAll('button')].find(node=>node.textContent===text).click());
const change=async(label,value)=>act(async()=>{
    const node=[...container.querySelectorAll('label')].find(node=>node.firstChild?.textContent===label).querySelector('textarea,select');
    Object.getOwnPropertyDescriptor(node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLSelectElement.prototype,'value').set.call(node,value);
    node.dispatchEvent(new Event(node.tagName==='TEXTAREA'?'input':'change',{bubbles:true}));
});
const calculate=()=>click('Calculate repeated-measures ANOVA');
const report=()=>container.querySelector('textarea[readonly]')?.value;

it('uses an explicit worked example and updates reporting correction without replacing the model', async()=>{
    await act(async()=>render());expect(report()).toBeUndefined();
    await click('Load worked example');await calculate();
    expect(report()).toContain('5 complete participants');expect(report()).toContain('Greenhouse–Geisser');expect(report()).toContain('p = .212');
    expect(document.activeElement.getAttribute('aria-label')).toBe('Calculation output');
    await change('Reporting correction','uncorrected');expect(report()).toContain('Uncorrected');expect(report()).toContain('p = .179');
    props.section='assumptions';await act(async()=>render());props.section='calculator';await act(async()=>render());expect(report()).toContain('Uncorrected');
    await change('Repeated-measures table','broken');expect(report()).toBeUndefined();await calculate();expect(container.querySelector('[role=alert]')).not.toBeNull();
});

it('lists incomplete IDs before allowing an explicit exclusion', async()=>{
    await act(async()=>render());
    await change('Repeated-measures table','ID,Pre,Post\nA,1,2\nB,2,NA\nC,4,7\nD,5,6');await calculate();
    expect(container.textContent).toContain('B: missing Post');expect(report()).toBeUndefined();
    await change('Incomplete participants','exclude');await calculate();
    expect(report()).toContain('3 complete participants');expect(report()).toContain('1 incomplete participants excluded');
});

it('matches unordered long data and rejects duplicate cells', async()=>{
    await act(async()=>render());await change('Data layout','long');
    const text='ID,Time,Value\nA,Post,2\nB,Pre,2\nC,Post,7\nA,Pre,1\nB,Post,4\nC,Pre,3';
    await change('Repeated-measures table',text);await calculate();expect(report()).toContain('3 complete participants');
    await change('Repeated-measures table',text+'\nA,Post,8');await calculate();expect(container.querySelector('[role=alert]').textContent).toContain('Duplicate measurement');
});

it('safely opens saved data in Strict Mode and requires explicit condition selection', async()=>{
    const dataset=buildDatasetFromGrid({grid:[['Participant','Pre','Post','Age'],['A',1,2,25],['B',2,4,30],['C',3,7,21]],hasHeaderRow:true,datasetName:'Study'});
    const selection=inferAnalysisLaunchSelection(dataset,'repeated_measures_anova');
    expect(selection.conditions).toEqual([]);expect(selection.subject).toBe(dataset.columns[0].id);
    loadStoredDatasets.mockResolvedValue([dataset]);sessionStorage.setItem(ANALYSIS_LAUNCH_SESSION_KEY,JSON.stringify({...selection,analysisId:'repeated_measures_anova'}));
    await act(async()=>render());expect(sessionStorage.getItem(ANALYSIS_LAUNCH_SESSION_KEY)).toBeNull();await calculate();expect(container.querySelector('[role=alert]')).not.toBeNull();
    for(const label of ['Pre','Post']) await act(async()=>[...container.querySelectorAll('fieldset label')].find(node=>node.textContent===label).querySelector('input').click());
    await calculate();expect(report()).toContain('Study');expect(report()).toContain('Conditions: Pre, Post.');expect(report()).not.toContain('Age');
});

it('does not expose an independent-groups power calculator', async()=>{
    props.section='power';await act(async()=>render());expect(container.textContent).toContain('Repeated-measures power is not available');expect(container.querySelectorAll('input')).toHaveLength(0);
});
