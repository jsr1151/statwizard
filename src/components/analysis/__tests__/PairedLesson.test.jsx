// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PairedTTestVisual from '../../visuals/PairedTTestVisual.jsx';
import reference from '../../../../docs/audits/2026-09-12/paired-reference.json';
import { buildPairedReport } from '../../../stats/pairedReport.js';
import { calculatePairedCalculator } from '../../../stats/pairedCalculator.js';
import { createPairedDraft, PAIRED_DRAFT_KEY } from '../../../utils/pairedDraft.js';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let root,container,onStatsUpdate,onTutorUpdate;
beforeEach(()=>{localStorage.clear();sessionStorage.clear();container=document.createElement('main');document.body.appendChild(container);root=createRoot(container);onStatsUpdate=vi.fn();onTutorUpdate=vi.fn();});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.restoreAllMocks();localStorage.clear();sessionStorage.clear();});
const mount=async()=>act(async()=>root.render(<StrictMode><PairedTTestVisual darkMode={false} onStatsUpdate={onStatsUpdate} onTutorUpdate={onTutorUpdate}/></StrictMode>));
const field=label=>container.querySelector(`[aria-label="${label}"]`);
const change=async(label,value)=>act(async()=>{const node=field(label),proto=node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,String(value));node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));});
const click=async label=>act(async()=>[...container.querySelectorAll('button')].find(node=>node.textContent.trim()===label).click());
const stats=()=>onStatsUpdate.mock.lastCall[0];
const report=()=>[...container.querySelectorAll('details')].find(node=>node.querySelector('summary')?.textContent==='Report text')?.querySelector('p')?.textContent;
it.each(reference.cases)('lesson controls reproduce independent R paired inference: $id',async fixture=>{
 await mount();for(const [key,label] of [['mean1','Condition 1 mean'],['sd1','Condition 1 standard deviation'],['mean2','Condition 2 mean'],['sd2','Condition 2 standard deviation'],['n','Number of pairs'],['r','Correlation between paired measurements']])await change(label,fixture[key]);
 await change('Significance level',fixture.alpha);await change('Alternative hypothesis',fixture.tails===2?'two-sided':fixture.direction);await change('Confidence interval type',fixture.ciType);if(fixture.tails===2&&fixture.ciType==='one-sided')await change('One-sided bound',fixture.direction);
 const result=stats();expect(result.t).toBeCloseTo(fixture.t,8);expect(result.df).toBe(fixture.df);expect(Math.abs(result.p-fixture.p)).toBeLessThan(1e-7);
 for(const [actual,expected] of [[result.ciLower,fixture.lower],[result.ciUpper,fixture.upper]]){if(typeof expected==='string')expect(actual).toBe(expected==='Inf'?Infinity:-Infinity);else expect(Math.abs(actual-expected)).toBeLessThan(1e-6);}
 expect(report()).toContain(`${Math.round((1-fixture.alpha)*100)}% ${fixture.ciType} confidence interval`);expect(report()).not.toContain('p = <');
});
it('uses exactly the calculator report builder and includes selected confidence and endpoints',async()=>{
 await mount();await change('Significance level',.01);await change('Alternative hypothesis','less');await change('Confidence interval type','one-sided');
 const expected=buildPairedReport({result:stats(),source:'Lesson: Example paired summary statistics',labels:['Condition 1','Condition 2'],inputMode:'summary'});expect(report()).toBe(expected);expect(report()).toContain('99% one-sided confidence interval');expect(report()).toContain('-Infinity');expect(report()).not.toContain('95%');
});
it.each([['Condition 1 mean',''],['Condition 2 standard deviation','-1'],['Number of pairs','2.5'],['Number of pairs','1'],['Correlation between paired measurements',''],['Correlation between paired measurements','1.2']])('preserves invalid %s inputs and suppresses plots, inference, report and tutor output',async(label,value)=>{
 await mount();await change(label,value);expect(field(label).value).toBe(value);expect(stats()).toBeNull();expect(container.textContent).toContain('Complete the lesson inputs');expect(container.querySelector('svg')).toBeNull();expect(report()).toBeUndefined();expect(onTutorUpdate.mock.lastCall[0]).toBeNull();
 await click('Example pairs');expect(stats().n).toBe(10);await click('Summary example');expect(field(label).value).toBe(value);expect(stats()).toBeNull();await click('Reset lesson');expect(stats().n).toBe(10);
});
it('blocks constant differences and recovers without inventing a zero t result',async()=>{
 await mount();await change('Condition 1 standard deviation',1);await change('Condition 2 standard deviation',1);await change('Correlation between paired measurements',1);expect(stats()).toBeNull();expect(container.textContent).toContain('Constant differences cannot support a t-test');await change('Correlation between paired measurements',.9);expect(stats().t).toBeGreaterThan(0);
});
it('swaps summaries, preserves the alternative and notifies the tutor',async()=>{
 await mount();await change('Alternative hypothesis','greater');const before=stats();await click('Swap conditions');expect(stats().t).toBeCloseTo(-before.t,12);expect(stats().p).toBeCloseTo(1-before.p,10);expect(field('Alternative hypothesis').value).toBe('greater');expect(container.textContent).toContain('Current order: Condition 2 minus Condition 1');expect(onTutorUpdate.mock.lastCall[0].id).toBe('t_paired_swap');
});
it('updates the tutor when summary correlation crosses the teaching threshold',async()=>{
 await mount();await change('Correlation between paired measurements',.3);await change('Correlation between paired measurements',.9);expect(onTutorUpdate.mock.lastCall[0].id).toBe('t_paired_correlation');
});
it('uses real example pairs for individual views and does not fall back to unrelated rows for summaries',async()=>{
 await mount();await click('Paired');expect(container.textContent).toContain('cannot be reconstructed from summary statistics');expect(container.querySelector('svg')).toBeNull();await click('Example pairs');const raw=field('Lesson example pairs').value;expect(field('Lesson example pairs').readOnly).toBe(true);expect(stats().raw1).toHaveLength(10);expect(container.querySelector('svg')).not.toBeNull();
 const exact=calculatePairedCalculator(createPairedDraft());expect(stats().t).toBe(exact.t);await click('Swap conditions');expect(stats().raw1).toEqual(exact.raw2);expect(stats().raw2).toEqual(exact.raw1);expect(field('Lesson example pairs').value).not.toBe(raw);await click('Differences');expect(container.querySelector('svg').textContent).toContain('Mean difference');await click('Summary example');expect(container.querySelector('svg')).toBeNull();expect(container.textContent).toContain('cannot be reconstructed');
});
it('keeps mean plots aligned with summary inputs, comparison order and error-bar semantics',async()=>{
 await mount();await change('Condition 1 mean',20);await click('Plot maker');expect(container.querySelector('svg').textContent).toContain('mean 20.000');expect(container.textContent).toContain('not a confidence interval for the paired difference');await change('Error bars','sd');expect(container.textContent).toContain('one sample standard deviation');await click('Line');expect(container.querySelector('svg').textContent).toContain('C1 - C2 = 8.70');expect(container.textContent).toContain('does not represent individual participants');await click('Change');expect(container.querySelector('svg')).toBeNull();
});
it('validates and clips custom plot bounds without changing inference, retains custom labels across plot types, and resets plot controls',async()=>{
 await mount();await click('Plot maker');const before=stats();await change('Y-axis label','Custom score');await change('Y minimum',20);await change('Y maximum',10);expect(container.textContent).toContain('Y minimum less than Y maximum');expect(container.querySelector('svg')).toBeNull();expect(stats()).toBe(before);expect(report()).toContain('Paired-samples t-test');
 await change('Y maximum',30);expect(container.querySelector('clipPath')).not.toBeNull();expect(container.querySelector('svg').outerHTML).not.toMatch(/NaN|Infinity/);await click('Line');expect(field('Y-axis label').value).toBe('Custom score');expect(field('Y minimum').value).toBe('');await change('Y maximum',-100);expect(container.querySelector('svg').outerHTML).not.toMatch(/NaN|Infinity/);await click('Grid');expect([...container.querySelectorAll('button')].find(node=>node.textContent==='Grid').getAttribute('aria-pressed')).toBe('false');await click('Reset plot');expect(field('Y-axis label').value).toBe('Mean score');expect(field('Y maximum').value).toBe('');
});
it('offers selectable report text when copying is denied and clears stale copy feedback after edits',async()=>{
 await mount();Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn(async()=>{throw Error('denied');})}});await click('Copy lesson report');expect(container.querySelector('textarea[readonly]').value).toBe(report());await change('Significance level',.1);expect(container.querySelector('textarea')).toBeNull();expect(container.textContent).not.toContain('Copy unavailable');
});
it('never writes the calculator draft and resets only lesson inputs and views',async()=>{
 const saved=JSON.stringify({version:1,data:createPairedDraft()});localStorage.setItem(PAIRED_DRAFT_KEY,saved);const write=vi.spyOn(Storage.prototype,'setItem');await mount();await change('Condition 1 mean',20);await click('Plot maker');await click('Reset lesson');expect(field('Condition 1 mean').value).toBe('14');expect(container.querySelector('svg').textContent).toContain('Paired lesson null distribution');expect(localStorage.getItem(PAIRED_DRAFT_KEY)).toBe(saved);expect(write).not.toHaveBeenCalled();
});
