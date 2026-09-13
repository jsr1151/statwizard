// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import IndependentTTestPage from '../IndependentTTestPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { INDEPENDENT_DRAFT_KEY as key, createIndependentDraft, independentDraftStorage as storage } from '../../../utils/independentDraft.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
vi.mock('../../visuals/IndependentTTestVisual.jsx', () => ({ default: () => <p>Lesson visual</p> }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, onStatsChange;
beforeEach(() => {
    localStorage.clear(); sessionStorage.clear(); library.datasets = [];
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container); onStatsChange = vi.fn();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
const mount = async (section = 'calculator') => act(async () => root.render(<StrictMode><IndependentTTestPage section={section} darkMode={false} onStatsChange={onStatsChange} /></StrictMode>));
const reload = async () => { await act(async () => root.unmount()); root = createRoot(container); await mount(); };
const field = label => container.querySelector(`[aria-label="${label}"]`);
const change = async (node, value) => act(async () => {
    const proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, String(value)); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async label => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label).click());
const stats = () => onStatsChange.mock.lastCall[0];
const study = name => buildDatasetFromDelimitedText({ text: 'Group,Value,Other\nA,1,9\nA,2,8\nA,3,7\nA,4,6\nA,5,3\nB,6,2\nB,7,1\nB,8,4\nA,,5\nB,nope,6', datasetName: name }).dataset;
const launch = dataset => { const selection = inferAnalysisLaunchSelection(dataset, 'independent_t_test'); writeAnalysisLaunchPayload({ ...selection, outcome: dataset.columns[1].id }); };
it('recovers both summaries, labels and all inference settings without writes on mount', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem'); await mount(); expect(write).not.toHaveBeenCalled();
    await change(field('Group 1 mean'), 5); await change(field('Group 1 sd'), 2); await change(field('Group 1 n'), 10); await change(field('Group 1 label'), 'Treatment');
    await change(field('Group 2 mean'), 4); await change(field('Group 2 sd'), 4); await change(field('Group 2 n'), 20); await change(field('Group 2 label'), 'Control');
    await change(field('Test method'), 'welch'); await change(field('Alternative hypothesis'), 'less'); await change(field('Significance level'), .1); await change(field('Confidence interval type'), 'one-sided');
    const before = stats(); write.mockClear(); await reload(); expect(write).not.toHaveBeenCalled();
    expect(field('Group 1 label').value).toBe('Treatment'); expect(field('Group 2 n').value).toBe('20'); expect(field('Test method').value).toBe('welch');
    expect(stats().df).toBeCloseTo(27.981818, 5); expect(stats().p).toBe(before.p); expect(stats().ciLower).toBe(-Infinity); expect(container.textContent).toContain('Recovered your calculator draft');
});
it('preserves raw precision and separate summaries through section and source changes', async () => {
    await mount(); await change(field('Group 1 mean'), 9); await click('Raw data');
    const raw = '1.123456789, 2.234567891; 4.345678912\n5.456789123, nope, 12oops';
    await change(field('Group 1 raw values'), raw); await change(field('Group 2 raw values'), '1,2,5'); await reload();
    expect(field('Group 1 raw values').value).toBe(raw); expect(stats().x1).toBeCloseTo(3.29012317875, 12); expect(stats().n2).toBe(3); expect(container.textContent).toContain('4 of 6 nonempty entries included; 2 excluded');
    await mount('lessons'); expect(container.textContent).toContain('Lesson visual'); await mount(); expect(field('Group 1 raw values').value).toBe(raw);
    await click('Saved dataset'); expect(stats()).toBeNull(); await click('Example / manual input'); expect(stats().n1).toBe(4);
    await click('Summary statistics'); expect(field('Group 1 mean').value).toBe('9'); await click('Raw data'); expect(field('Group 1 raw values').value).toBe(raw);
});
it.each(['','nope','1'])('recovers unusable raw input %j without stale results', async raw => {
    await mount(); await click('Raw data'); await change(field('Group 1 raw values'), raw); await change(field('Group 2 raw values'), '1,2,3'); await reload();
    expect(field('Group 1 raw values').value).toBe(raw); expect(stats()).toBeNull(); expect(container.textContent).toContain('Complete the test inputs');
});
it.each([['Group 1 mean',''],['Group 2 sd','-1'],['Group 1 n','2.5'],['Group 2 n','']])('retains invalid %s summary input', async (label, value) => {
    await mount(); await change(field(label), value); await reload(); expect(field(label).value).toBe(value); expect(stats()).toBeNull();
});
it('swaps the complete manual groups atomically and keeps the directional alternative', async () => {
    await mount(); await change(field('Group 1 label'),'Treatment'); await change(field('Alternative hypothesis'),'greater'); const before = stats();
    const write = vi.spyOn(Storage.prototype,'setItem'); await click('Swap groups'); expect(write).toHaveBeenCalledOnce(); await reload();
    expect(field('Group 2 label').value).toBe('Treatment'); expect(stats().t).toBe(-before.t); expect(stats().p).toBeCloseTo(1-before.p,10); expect(field('Alternative hypothesis').value).toBe('greater');
});
it('follows same-row-count saved edits, preserves saved order, and creates a separate manual copy', async () => {
    const dataset=study('Study'); library.datasets=[dataset]; launch(dataset); await mount(); expect(stats().n1).toBe(5); expect(stats().n2).toBe(3); expect(stats().x1).toBe(3); expect(field('Group 1 raw values').readOnly).toBe(true);
    await click('Swap groups'); await change(field('Test method'),'welch'); await reload(); expect(stats().n1).toBe(3); expect(stats().x1).toBe(7);
    const outcome=dataset.columns[1].id; library.datasets=[{...dataset,rows:dataset.rows.map((row,i)=>i===0?{...row,[outcome]:11}:row)}]; await mount(); expect(stats().x2).toBe(5);
    await click('Edit a copy'); expect(field('Group 1 raw values').readOnly).toBe(false); expect(field('Group 1 label').value).toBe('B');
    await change(field('Group 1 raw values'),'10,20,30'); await reload(); expect(stats().x1).toBe(20); expect(container.textContent).toContain('Edited copy of Study');
    await click('Saved dataset'); expect(stats().x1).toBe(7); expect(stats().x2).toBe(5); await click('Example / manual input'); expect(stats().x1).toBe(20);
});
it('waits for missing datasets and respects cleared and changed-type roles', async () => {
    const dataset=study('Study'); library.datasets=[dataset]; launch(dataset); await mount(); await change(field('Test method'),'welch');
    library.datasets=[]; await reload(); expect(stats()).toBeNull(); library.datasets=[study('Other')]; await mount(); expect(stats()).toBeNull();
    library.datasets=[dataset]; await mount(); expect(stats().n1).toBe(5); await change(field('Outcome variable'),''); await reload(); expect(stats()).toBeNull(); expect(field('Outcome variable').value).toBe('');
    await change(field('Outcome variable'),dataset.columns[1].id); expect(stats().n1).toBe(5);
    library.datasets=[{...dataset,columns:dataset.columns.map((column,i)=>i===1?{...column,summary:{...column.summary,detectedType:'categorical'}}:column)}]; await mount(); expect(stats()).toBeNull();
});
it('remembers per-dataset roles/order and gives fresh launches default settings', async () => {
    const first=study('First'),second=study('Second'); library.datasets=[first,second]; launch(first); await mount(); await click('Swap groups');
    const datasetSelect=()=>container.querySelector('[aria-label="Saved dataset setup"] select:not([aria-label])');
    await change(datasetSelect(),second.id); await change(field('Outcome variable'),second.columns[2].id); await change(field('Grouping variable'),second.columns[0].id); await change(field('Test method'),'welch');
    await reload(); expect(field('Outcome variable').value).toBe(second.columns[2].id); expect(stats().n1).toBe(6); await change(datasetSelect(),first.id); expect(stats().n1).toBe(3);
    const saved=localStorage.getItem(key); launch(second); await reload(); expect(stats().n1).toBe(5); expect(field('Test method').value).toBe('student'); expect(localStorage.getItem(key)).toBe(saved);
});
it('persists a one-sided bound direction with a two-sided alternative', async () => {
    await mount(); await change(field('Confidence interval type'),'one-sided'); await change(field('One-sided bound'),'less'); await reload();
    expect(stats().tails).toBe(2); expect(stats().ciLower).toBe(-Infinity); expect(field('One-sided bound').value).toBe('less');
});
it('removes only this draft and restores focus without closing current inputs', async () => {
    localStorage.setItem('other-calculator','untouched'); await mount(); await change(field('Group 1 mean'),9);
    await click('Remove saved calculator draft'); await click('Keep draft'); expect(document.activeElement.textContent).toBe('Remove saved calculator draft');
    await click('Remove saved calculator draft'); await click('Remove draft'); expect(field('Group 1 mean').value).toBe('9'); expect(localStorage.getItem(key)).toBeNull(); expect(localStorage.getItem('other-calculator')).toBe('untouched');
    await reload(); expect(field('Group 1 mean').value).toBe('12'); expect(localStorage.getItem(key)).toBeNull();
});
it('preserves the previous draft on storage failures', async () => {
    await mount(); await change(field('Group 1 mean'),9); const saved=localStorage.getItem(key);
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('quota');}); await change(field('Group 1 mean'),11); expect(container.textContent).toContain('Could not save this draft'); expect(localStorage.getItem(key)).toBe(saved);
    vi.spyOn(Storage.prototype,'removeItem').mockImplementation(()=>{throw Error('blocked');}); await click('Remove saved calculator draft'); await click('Remove draft'); expect(container.textContent).toContain('Could not remove this draft');
    vi.restoreAllMocks(); await reload(); expect(field('Group 1 mean').value).toBe('9');
});
it.each(['{broken',JSON.stringify({version:2,data:createIndependentDraft()}),JSON.stringify({version:1,data:{...createIndependentDraft(),testType:'invalid'}})])('ignores incompatible drafts without overwriting them', async saved => {
    localStorage.setItem(key,saved); await mount(); expect(stats().n1).toBe(30); expect(localStorage.getItem(key)).toBe(saved);
});
it('reports the draft size limit without replacing the last saved inputs', async () => {
    await mount(); await click('Raw data'); await change(field('Group 1 raw values'),'1,2,3'); const saved=localStorage.getItem(key);
    await change(field('Group 1 raw values'),' '.repeat(250001)); expect(container.textContent).toContain('250,000-character limit'); expect(localStorage.getItem(key)).toBe(saved);
});
it('focuses results and provides a selectable report with group order and exclusions', async () => {
    await mount(); await click('Raw data'); await change(field('Group 1 raw values'),'1,2,3,nope'); await change(field('Group 2 raw values'),'2,3,4'); await change(field('Test method'),'welch');
    await click('Go to results'); expect(document.activeElement.getAttribute('aria-label')).toBe('Independent-samples t-test results');
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn(async()=>{throw Error('denied');})}}); await click('Copy test report');
    const report=container.querySelector('textarea[readonly]').value; expect(report).toContain("Welch's t-test"); expect(report).toContain('Group 1 minus Group 2'); expect(report).toContain('Group 1: 1 entries excluded.'); expect(report).toContain('Group 2 analyzed values: 2, 3, 4.');
});
