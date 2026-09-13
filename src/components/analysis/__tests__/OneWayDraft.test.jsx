// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OneWayAnovaPage from '../OneWayAnovaPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { ONE_WAY_DRAFT_KEY as key, createOneWayDraft, oneWayDraftStorage as storage } from '../../../utils/oneWayDraft.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
vi.mock('../../visuals/AnovaVisual.jsx', () => ({ default: () => <p>Lesson visual</p> }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, onStatsChange;
beforeEach(() => {
    localStorage.clear(); sessionStorage.clear(); library.datasets = [];
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container); onStatsChange = vi.fn();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
const mount = async (section = 'calculator') => act(async () => root.render(<StrictMode><OneWayAnovaPage section={section} darkMode={false} onStatsChange={onStatsChange} /></StrictMode>));
const reload = async () => { await act(async () => root.unmount()); root = createRoot(container); await mount(); };
const field = label => container.querySelector(`[aria-label="${label}"]`);
const change = async (node, value) => act(async () => {
    const proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, String(value)); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async label => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label || node.getAttribute('aria-label') === label).click());
const stats = () => onStatsChange.mock.lastCall[0];
const study = name => buildDatasetFromDelimitedText({ text: 'Group,Value,Other\nA,1,9\nA,2,8\nA,3,7\nA,4,6\nA,5,3\nB,6,2\nB,7,1\nB,8,4\nA,,5\nB,nope,6', datasetName: name }).dataset;
const launch = dataset => { const selection = inferAnalysisLaunchSelection(dataset, 'one_way_anova'); writeAnalysisLaunchPayload({ ...selection, outcome: dataset.columns[1].id }); };
const comparisons = async () => act(async () => container.querySelector('input[type=checkbox]').click());
it('restores exact raw input, labels, added groups, alpha and comparisons without mount writes', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem'); await mount(); expect(write).not.toHaveBeenCalled();
    const raw = '1.123456789, 2.234567891; 4.345678912\nnope 12oops';
    await change(field('Group 1 raw values'), raw); await change(field('Group 1 label'), 'Treatment'); await click('Add group');
    expect(stats()).toBeNull(); await change(field('Group 4 raw values'), '2,6,8'); await change(field('Significance level'), .1); await comparisons();
    const before = stats(); write.mockClear(); await reload(); expect(write).not.toHaveBeenCalled();
    expect(field('Group 1 raw values').value).toBe(raw); expect(field('Group 1 label').value).toBe('Treatment'); expect(stats().F).toBe(before.F); expect(stats().comparisons).toHaveLength(6);
    expect(container.textContent).toContain('Recovered your calculator draft'); expect(container.textContent).toContain('3 of 5 nonempty entries included; 2 excluded');
});
it('keeps group counts, labels and values separate in raw and summary modes across sections', async () => {
    await mount(); await change(field('Group 1 label'), 'Raw control'); await click('Add group'); await change(field('Group 4 raw values'), '3,6,9');
    await click('Summary statistics'); expect(field('Group 1 label').value).toBe('Control'); expect(field('Group 4 mean')).toBeNull();
    await change(field('Group 1 mean'), 9); await change(field('Group 1 label'), 'Summary control'); await click('Remove group 3');
    await mount('lessons'); expect(container.textContent).toContain('Lesson visual'); await mount(); await reload(); expect(stats().k).toBe(2); expect(field('Group 1 mean').value).toBe('9');
    await click('Raw data'); expect(field('Group 1 label').value).toBe('Raw control'); expect(stats().k).toBe(4); await click('Saved dataset'); expect(stats()).toBeNull(); await click('Example / manual input'); expect(stats().k).toBe(4);
});
it('recovers fractional supplied F degrees of freedom without manufacturing group results', async () => {
    await mount(); await comparisons(); await click('F statistic'); await change(field('F statistic'), 4.2); await change(field('Numerator degrees of freedom'), 1.5); await change(field('Denominator degrees of freedom'), 8.3); await change(field('Significance level'), .1);
    const before = stats(); await reload(); expect(stats().p).toBe(before.p); expect(stats().df1).toBe(1.5); expect(stats().samples).toBeUndefined(); expect(stats().comparisons).toEqual([]); expect(container.textContent).not.toContain('ANOVA table');
    await click('Raw data'); expect(stats().k).toBe(3); expect(stats().comparisons).toHaveLength(3);
});
it.each(['', 'nope'])('retains unusable raw input %j without results or reports', async raw => {
    await mount(); await change(field('Group 1 raw values'), raw); await reload(); expect(field('Group 1 raw values').value).toBe(raw); expect(stats()).toBeNull(); expect(container.textContent).toContain('Complete the ANOVA inputs'); expect(container.textContent).not.toContain('Copy ANOVA report');
});
it.each([['Group 1 mean',''],['Group 2 sd','-1'],['Group 1 n','2.5'],['Group 2 n','']])('retains invalid summary %s', async (label, value) => {
    await mount(); await click('Summary statistics'); await change(field(label), value); await reload(); expect(field(label).value).toBe(value); expect(stats()).toBeNull();
});
it('follows saved value edits of the same row count and keeps a manual copy separate from summaries', async () => {
    const dataset = study('Study'); library.datasets = [dataset]; launch(dataset); await mount(); expect(stats().N).toBe(8); expect(stats().samples[0].mean).toBe(3); expect(field('Group 1 raw values').readOnly).toBe(true);
    await change(field('Significance level'), .01); await reload(); expect(stats().alpha).toBe(.01);
    const outcome = dataset.columns[1].id; library.datasets = [{...dataset,rows:dataset.rows.map((row,i)=>i===0?{...row,[outcome]:11}:row)}]; await mount(); expect(stats().samples[0].mean).toBe(5);
    await click('Edit a copy'); expect(field('Group 1 raw values').readOnly).toBe(false); await change(field('Group 1 raw values'),'10,20,30'); await reload(); expect(stats().samples[0].mean).toBe(20); expect(container.textContent).toContain('Edited copy of Study');
    await click('Summary statistics'); expect(stats().k).toBe(3); expect(field('Group 1 mean').value).toBe('5.8'); await click('Raw data'); expect(stats().samples[0].mean).toBe(20);
    await click('Saved dataset'); expect(stats().samples[0].mean).toBe(5); await click('Example / manual input'); expect(stats().samples[0].mean).toBe(20);
});
it('waits for a missing dataset and respects cleared or changed-type roles', async () => {
    const dataset=study('Study'); library.datasets=[dataset]; launch(dataset); await mount(); await change(field('Significance level'),.01);
    library.datasets=[]; await reload(); expect(stats()).toBeNull(); library.datasets=[study('Other')]; await mount(); expect(stats()).toBeNull();
    library.datasets=[dataset]; await mount(); expect(stats().N).toBe(8); await change(field('Dependent variable'),''); await reload(); expect(stats()).toBeNull(); expect(field('Dependent variable').value).toBe('');
    await change(field('Dependent variable'),dataset.columns[1].id); expect(stats().N).toBe(8);
    library.datasets=[{...dataset,columns:dataset.columns.map((column,i)=>i===1?{...column,summary:{...column.summary,detectedType:'categorical'}}:column)}]; await mount(); expect(stats()).toBeNull();
});
it('remembers per-dataset roles and gives fresh launches default settings without overwriting on mount', async () => {
    const first=study('First'),second=study('Second'); library.datasets=[first,second]; launch(first); await mount();
    const datasetSelect=()=>container.querySelector('[aria-label="Saved dataset setup"] select:not([aria-label])');
    await change(datasetSelect(),second.id); await change(field('Dependent variable'),second.columns[2].id); await change(field('Grouping variable'),second.columns[0].id); await change(field('Significance level'),.01);
    await reload(); expect(field('Dependent variable').value).toBe(second.columns[2].id); expect(stats().N).toBe(10); await change(datasetSelect(),first.id); expect(stats().N).toBe(8);
    const saved=localStorage.getItem(key); launch(second); await reload(); expect(stats().N).toBe(8); expect(stats().alpha).toBe(.05); expect(localStorage.getItem(key)).toBe(saved);
});
it('removes only this draft, restores focus and keeps current inputs open', async () => {
    localStorage.setItem('other-calculator','untouched'); await mount(); await change(field('Group 1 raw values'),'9,10,11');
    await click('Remove saved calculator draft'); await click('Keep draft'); expect(document.activeElement.textContent).toBe('Remove saved calculator draft');
    await click('Remove saved calculator draft'); await click('Remove draft'); expect(field('Group 1 raw values').value).toBe('9,10,11'); expect(localStorage.getItem(key)).toBeNull(); expect(localStorage.getItem('other-calculator')).toBe('untouched');
    await reload(); expect(field('Group 1 raw values').value).toBe('5, 6, 7, 5, 6'); expect(localStorage.getItem(key)).toBeNull();
});
it('preserves the previous draft on storage failure and excessive size', async () => {
    await mount(); await change(field('Group 1 raw values'),'9,10,11'); const saved=localStorage.getItem(key);
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('quota');}); await change(field('Group 1 raw values'),'5,6,7'); expect(container.textContent).toContain('Could not save this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.spyOn(Storage.prototype,'removeItem').mockImplementation(()=>{throw Error('blocked');}); await click('Remove saved calculator draft'); await click('Remove draft'); expect(container.textContent).toContain('Could not remove this draft');
    vi.restoreAllMocks(); await reload(); expect(field('Group 1 raw values').value).toBe('9,10,11');
    await change(field('Group 1 raw values'),' '.repeat(250001)); expect(container.textContent).toContain('250,000-character limit'); expect(localStorage.getItem(key)).toBe(saved);
});
it.each(['{broken',JSON.stringify({version:2,data:createOneWayDraft()}),JSON.stringify({version:1,data:{...createOneWayDraft(),inputMode:'invalid'}})])('ignores incompatible drafts without overwriting them', async saved => {
    localStorage.setItem(key,saved); await mount(); expect(stats().N).toBe(15); expect(localStorage.getItem(key)).toBe(saved);
});
it('focuses results and exports current group inputs, exclusions, settings and adjusted comparisons', async () => {
    await mount(); await change(field('Group 1 raw values'),'1,2,3,nope'); await comparisons(); await change(field('Significance level'),.1);
    await click('Go to results'); expect(document.activeElement.getAttribute('aria-label')).toBe('One-way ANOVA results');
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn(async()=>{throw Error('denied');})}}); await click('Copy ANOVA report');
    const report=container.querySelector('textarea[readonly]').value; expect(report).toContain('alpha = 0.1'); expect(report).toContain('Group 1: 1 manual entries excluded'); expect(report).toContain('analyzed values: 1, 2, 3'); expect(report).toContain('90% familywise confidence intervals'); expect(report).toContain('residual df = 10'); expect(report).not.toContain('p = <');
    await change(field('Group 1 raw values'),''); expect(container.querySelector('textarea[readonly]')).toBeNull(); expect(stats()).toBeNull();
});
