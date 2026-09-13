// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PairedTTestPage from '../PairedTTestPage.jsx';
import { buildDatasetFromDelimitedText } from '../../../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../../../utils/analysisLaunch.js';
import { PAIRED_DRAFT_KEY as key, createPairedDraft, pairedDraftStorage as storage } from '../../../utils/pairedDraft.js';

const library = vi.hoisted(() => ({ datasets: [] }));
vi.mock('../../../hooks/useDatasetLibrary.js', () => ({ useDatasetLibraryContext: () => library }));
vi.mock('../../visuals/PairedTTestVisual.jsx', () => ({ default: () => <p>Lesson visual</p> }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, onStatsChange;
beforeEach(() => {
    localStorage.clear(); sessionStorage.clear(); library.datasets = [];
    container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container); onStatsChange = vi.fn();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
const mount = async (section = 'calculator') => act(async () => root.render(<StrictMode><PairedTTestPage section={section} darkMode={false} onStatsChange={onStatsChange} /></StrictMode>));
const reload = async () => { await act(async () => root.unmount()); root = createRoot(container); await mount(); };
const field = label => container.querySelector(`[aria-label="${label}"]`);
const change = async (node, value) => act(async () => {
    const proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, String(value)); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async label => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label).click());
const stats = () => onStatsChange.mock.lastCall[0];
const study = name => buildDatasetFromDelimitedText({ text: 'Before,After,Other\n12,10,9\n14,11,8\n11,12,7\n15,11,6\n13,10,3\n,13,2\n14,,1\nnope,11,4', datasetName: name }).dataset;
const launch = dataset => { const selection = inferAnalysisLaunchSelection(dataset, 'paired_t_test'); writeAnalysisLaunchPayload({ ...selection, first: dataset.columns[0].id, second: dataset.columns[1].id }); };
it('restores paired rows, source, labels and settings without writing on mount', async()=>{
 const write=vi.spyOn(Storage.prototype,'setItem');await mount();expect(write).not.toHaveBeenCalled();
 const raw='1,10\n,20\n3,11\n4,2\n5';await change(field('Paired observations'),raw);await change(field('Condition 1 label'),'Before');await change(field('Condition 2 label'),'After');
 await change(field('Alternative hypothesis'),'less');await change(field('Significance level'),.1);await change(field('Confidence interval type'),'one-sided');const before=stats();write.mockClear();await reload();
 expect(write).not.toHaveBeenCalled();expect(field('Paired observations').value).toBe(raw);expect(field('Condition 1 label').value).toBe('Before');expect(stats().n).toBe(3);expect(stats().raw1).toEqual([1,3,4]);expect(stats().raw2).toEqual([10,11,2]);expect(stats().p).toBe(before.p);expect(stats().ciLower).toBe(-Infinity);expect(container.textContent).toContain('3 of 5 nonblank rows included; 2 excluded');
});
it('keeps raw and summary profiles independent through mode, source and section changes',async()=>{
 await mount();await change(field('Paired observations'),'1,2\n3,7\n5,6');await change(field('Condition 1 label'),'Raw before');
 await click('Summary statistics');await change(field('Condition 1 mean'),5);await change(field('Condition 2 mean'),4);await change(field('Within-pair correlation'),.3);await change(field('Condition 1 label'),'Summary before');await reload();
 expect(field('Condition 1 mean').value).toBe('5');expect(field('Within-pair correlation').value).toBe('0.3');await click('Raw pairs');expect(field('Condition 1 label').value).toBe('Raw before');expect(stats().n).toBe(3);
 await mount('lessons');expect(container.textContent).toContain('Lesson visual');await mount();expect(field('Paired observations').value).toBe('1,2\n3,7\n5,6');await click('Saved dataset');expect(stats()).toBeNull();await click('Example / manual input');expect(stats().n).toBe(3);
 await click('Summary statistics');expect(field('Condition 1 label').value).toBe('Summary before');expect(container.textContent).toContain('Entered paired summary statistics');
});
it.each(['','1,2','1,2\n2,3','1,\n2,nope'])('recovers incomplete or constant paired input %j without stale results',async raw=>{
 await mount();await change(field('Paired observations'),raw);await reload();expect(field('Paired observations').value).toBe(raw);expect(stats()).toBeNull();expect(container.textContent).toContain('Complete the test inputs');
});
it.each([['Within-pair correlation',''],['Within-pair correlation','1.1'],['Condition 1 mean',''],['Condition 2 sample SD','-1'],['Pair count','2.5']])('keeps invalid %s input without coercion',async(label,value)=>{
 await mount();await click('Summary statistics');await change(field(label),value);await reload();expect(field(label).value).toBe(value);expect(stats()).toBeNull();
});
it('swaps raw columns and labels atomically while keeping exclusions and summary data unchanged',async()=>{
 await mount();await change(field('Paired observations'),'1,3\n,20\n5,2');await change(field('Condition 1 label'),'Before');await change(field('Alternative hypothesis'),'greater');const before=stats();
 const write=vi.spyOn(Storage.prototype,'setItem');await click('Swap conditions');expect(write).toHaveBeenCalledOnce();await reload();expect(field('Paired observations').value).toBe('3,1\n20,\n2,5');expect(field('Condition 2 label').value).toBe('Before');expect(stats().t).toBe(-before.t);expect(stats().p).toBeCloseTo(1-before.p,10);expect(stats().review.dropped).toBe(1);
 await click('Summary statistics');expect(field('Condition 1 mean').value).toBe('14');expect(field('Condition 1 label').value).toBe('Condition 1');
});
it('swaps summaries without changing raw rows, labels, pair count or correlation',async()=>{
 await mount();const raw=field('Paired observations').value;await click('Summary statistics');await change(field('Condition 1 label'),'Before');const before=stats();await click('Swap conditions');await reload();
 expect(field('Condition 2 label').value).toBe('Before');expect(field('Within-pair correlation').value).toBe('0.8');expect(stats().n).toBe(10);expect(stats().t).toBeCloseTo(-before.t,12);await click('Raw pairs');expect(field('Paired observations').value).toBe(raw);expect(field('Condition 1 label').value).toBe('Condition 1');
});
it('reads current saved pairs and preserves saved comparison order when editing a manual copy',async()=>{
 const dataset=study('Study');library.datasets=[dataset];launch(dataset);await mount();expect(stats().n).toBe(5);expect(stats().mean1).toBe(13);expect(field('Paired observations').readOnly).toBe(true);
 await click('Swap conditions');await change(field('Significance level'),.1);await reload();expect(stats().mean1).toBe(10.8);expect(field('Paired variable 1').value).toBe(dataset.columns[1].id);
 const first=dataset.columns[0].id;library.datasets=[{...dataset,rows:dataset.rows.map((row,i)=>i===0?{...row,[first]:22}:row)}];await mount();expect(stats().mean2).toBe(15);
 await click('Edit a copy');expect(field('Paired observations').readOnly).toBe(false);expect(field('Condition 1 label').value).toBe('After');await change(field('Paired observations'),'10,1\n20,3\n30,2');await reload();expect(stats().mean1).toBe(20);expect(container.textContent).toContain('Edited copy of Study');
 await click('Saved dataset');expect(stats().mean1).toBe(10.8);expect(stats().mean2).toBe(15);await click('Example / manual input');expect(stats().mean1).toBe(20);
 await click('Summary statistics');expect(container.textContent).toContain('Example paired summary statistics');expect(field('Condition 1 label').value).toBe('Condition 1');
});
it('waits for missing datasets and blocks cleared, duplicate or changed-type roles',async()=>{
 const dataset=study('Study');library.datasets=[dataset];launch(dataset);await mount();await change(field('Significance level'),.1);library.datasets=[];await reload();expect(stats()).toBeNull();library.datasets=[study('Other')];await mount();expect(stats()).toBeNull();
 library.datasets=[dataset];await mount();expect(stats().n).toBe(5);await change(field('Paired variable 2'),'');await reload();expect(stats()).toBeNull();expect(field('Paired variable 2').value).toBe('');await change(field('Paired variable 2'),dataset.columns[1].id);expect(stats().n).toBe(5);
 await change(field('Paired variable 1'),dataset.columns[1].id);expect(stats()).toBeNull();await change(field('Paired variable 1'),dataset.columns[0].id);expect(stats().n).toBe(5);
 library.datasets=[{...dataset,columns:dataset.columns.map((column,i)=>i===0?{...column,summary:{...column.summary,detectedType:'categorical'}}:column)}];await mount();expect(stats()).toBeNull();
});
it('remembers per-dataset variable order and gives fresh launches priority',async()=>{
 const first=study('First'),second=study('Second');library.datasets=[first,second];launch(first);await mount();await click('Swap conditions');
 const datasetSelect=()=>container.querySelector('[aria-label="Saved dataset setup"] select:not([aria-label])');await change(datasetSelect(),second.id);await change(field('Paired variable 1'),second.columns[0].id);await change(field('Paired variable 2'),second.columns[2].id);await change(field('Alternative hypothesis'),'less');await reload();
 expect(field('Paired variable 2').value).toBe(second.columns[2].id);await change(datasetSelect(),first.id);expect(field('Paired variable 1').value).toBe(first.columns[1].id);
 const saved=localStorage.getItem(key);launch(second);await reload();expect(field('Paired variable 1').value).toBe(second.columns[0].id);expect(field('Paired variable 2').value).toBe(second.columns[1].id);expect(field('Alternative hypothesis').value).toBe('two-sided');expect(localStorage.getItem(key)).toBe(saved);
});
it('recovers a one-sided bound direction with a two-sided test',async()=>{
 await mount();await change(field('Confidence interval type'),'one-sided');await change(field('One-sided bound'),'less');await reload();expect(stats().tails).toBe(2);expect(stats().ciLower).toBe(-Infinity);expect(field('One-sided bound').value).toBe('less');
});
it('removes only this draft and restores focus while leaving current input open',async()=>{
 localStorage.setItem('other-calculator','untouched');await mount();await change(field('Paired observations'),'1,2\n3,7');await click('Remove saved calculator draft');await click('Keep draft');expect(document.activeElement.textContent).toBe('Remove saved calculator draft');
 await click('Remove saved calculator draft');await click('Remove draft');expect(field('Paired observations').value).toBe('1,2\n3,7');expect(localStorage.getItem(key)).toBeNull();expect(localStorage.getItem('other-calculator')).toBe('untouched');await reload();expect(stats().n).toBe(10);expect(localStorage.getItem(key)).toBeNull();
});
it('preserves previous drafts when saving or deletion fails',async()=>{
 await mount();await change(field('Paired observations'),'1,2\n3,7');const saved=localStorage.getItem(key);vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('quota');});await change(field('Paired observations'),'2,1\n5,3');expect(container.textContent).toContain('Could not save this draft');expect(localStorage.getItem(key)).toBe(saved);
 vi.spyOn(Storage.prototype,'removeItem').mockImplementation(()=>{throw Error('blocked');});await click('Remove saved calculator draft');await click('Remove draft');expect(container.textContent).toContain('Could not remove this draft');vi.restoreAllMocks();await reload();expect(field('Paired observations').value).toBe('1,2\n3,7');
});
it.each(['{broken',JSON.stringify({version:2,data:createPairedDraft()}),JSON.stringify({version:1,data:{...createPairedDraft(),alpha:-1}})])('ignores incompatible drafts without overwriting them',async saved=>{localStorage.setItem(key,saved);await mount();expect(stats().n).toBe(10);expect(localStorage.getItem(key)).toBe(saved);});
it('reports oversized drafts without replacing the last saved input',async()=>{await mount();await change(field('Paired observations'),'1,2\n3,7');const saved=localStorage.getItem(key);await change(field('Paired observations'),' '.repeat(250001));expect(container.textContent).toContain('250,000-character limit');expect(localStorage.getItem(key)).toBe(saved);});
it('focuses results and offers a selectable paired report with exclusions and comparison order',async()=>{
 await mount();await change(field('Paired observations'),'1,2\n,8\n5,3');await change(field('Significance level'),.1);await click('Go to results');expect(document.activeElement.getAttribute('aria-label')).toBe('Paired-samples t-test results');
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn(async()=>{throw Error('denied');})}});await click('Copy test report');const report=container.querySelector('textarea[readonly]').value;expect(report).toContain('Condition 1 minus Condition 2');expect(report).toContain('1 input rows excluded.');expect(report).toContain('90% two-sided confidence interval');expect(report).toContain('1,2\n5,3');
});
