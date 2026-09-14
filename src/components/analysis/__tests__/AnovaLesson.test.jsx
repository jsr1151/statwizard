// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AnovaVisual from '../../visuals/AnovaVisual.jsx';
import reference from '../../../../docs/audits/2026-09-12/one-way-reference.json';
import { buildOneWayReport } from '../../../stats/oneWayReport.js';
import { ONE_WAY_DRAFT_KEY, createOneWayDraft, oneWayDraftStorage } from '../../../utils/oneWayDraft.js';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, onStatsUpdate, onTutorUpdate, tutor;
beforeEach(() => {
    localStorage.clear(); container = document.createElement('main'); document.body.appendChild(container); root = createRoot(container);
    onStatsUpdate = vi.fn(); onTutorUpdate = vi.fn(); tutor = { resetIdle: vi.fn(), dismissTip: vi.fn() };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => { throw Error('denied'); }) } });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); localStorage.clear(); vi.restoreAllMocks(); });
const mount = async () => act(async () => root.render(<StrictMode><AnovaVisual darkMode={false} onStatsUpdate={onStatsUpdate} onTutorUpdate={onTutorUpdate} tutor={tutor} /></StrictMode>));
const field = label => container.querySelector(`[aria-label="${label}"]`);
const change = async (label, value) => act(async () => {
    const node = field(label), proto = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, String(value)); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const click = async label => act(async () => [...container.querySelectorAll('button')].find(node => node.textContent.trim() === label || node.getAttribute('aria-label') === label).click());
const stats = () => onStatsUpdate.mock.lastCall[0];
const report = () => container.querySelector('textarea[readonly]')?.value;
const compare = async () => act(async () => container.querySelector('input[type=checkbox]').click());
const action = async detail => act(async () => window.dispatchEvent(new CustomEvent('anovaTutorAction', { detail })));
it.each(reference.cases)('matches base R from actual raw lesson controls: $id', async fixture => {
    await mount(); await click('Raw data'); if (!fixture.raw3) await click('Remove group 3');
    for (const [i, raw] of [fixture.raw1, fixture.raw2, fixture.raw3].filter(Boolean).entries()) await change(`Group ${i + 1} raw values`, raw);
    await change('Significance level', fixture.alpha); await compare();
    expect(stats().F).toBeCloseTo(fixture.F, 6); expect(stats().p).toBeCloseTo(fixture.p, 8); expect(stats().df2).toBe(fixture.df2);
    expect(stats().comparisons[0].pAdjusted).toBeCloseTo(fixture.pairP, 7); expect(stats().comparisons[0].lower).toBeCloseTo(fixture.lower, 6); expect(stats().comparisons[0].upper).toBeCloseTo(fixture.upper, 6);
    await click('Copy lesson report'); expect(report()).toBe(buildOneWayReport({ result: stats(), source: stats().source })); expect(report()).not.toContain('p = <');
});
it.each(reference.fCases)('matches base R supplied-F lesson controls: %j', async fixture => {
    await mount(); await change('F statistic', fixture.F); await change('Numerator degrees of freedom', fixture.df1); await change('Denominator degrees of freedom', fixture.df2); await change('Significance level', fixture.alpha);
    expect(stats().p).toBeCloseTo(fixture.p, 8); expect(stats().Fcrit).toBeCloseTo(fixture.Fcrit, 6); await click('Copy lesson report'); expect(report()).toContain('F test from supplied statistic'); expect(report()).not.toContain('eta squared =');
});
it.each([['F statistic',''],['Numerator degrees of freedom','0'],['Denominator degrees of freedom','-1']])('suppresses stale F results, plots, report and tutor: %s', async (label, value) => {
    await mount(); await click('Copy lesson report'); tutor.activeTip = { id: 'old-tip' }; await change(label, value); expect(field(label).value).toBe(value); expect(stats()).toBeNull(); expect(container.querySelector('svg')).toBeNull(); expect(report()).toBeUndefined(); expect(onTutorUpdate.mock.lastCall[0]).toBeNull(); expect(tutor.dismissTip).toHaveBeenCalledWith('old-tip');
    await click('Reset lesson'); expect(stats().F).toBe(3.5);
});
it.each([['Group 1 mean',''],['Group 2 sd','-1'],['Group 1 n','2.5']])('retains invalid summaries without using hidden raw groups: %s', async (label, value) => {
    await mount(); await click('Summary statistics'); await change(label, value); expect(stats()).toBeNull(); await click('Raw data'); expect(stats().N).toBe(15); await click('Summary statistics'); expect(field(label).value).toBe(value); expect(stats()).toBeNull();
});
it('keeps exact raw text and reviews exclusions; empty groups block inference', async () => {
    await mount(); await click('Raw data'); const text = '1.123456789, 2.234567891;4.345678912\nnope 12oops'; await change('Group 1 raw values', text);
    expect(field('Group 1 raw values').value).toBe(text); expect(stats().samples[0].mean).toBeCloseTo(2.567901197333333, 12); expect(container.textContent).toContain('3 of 5 nonempty entries included; 2 excluded'); await click('Add group'); expect(stats()).toBeNull(); await click('Remove group 4'); expect(stats().N).toBe(13);
});
it('shows the table and decomposition for zero between-group variation', async () => {
    await mount(); await click('Raw data'); for (let i = 1; i <= 3; i++) await change(`Group ${i} raw values`, '1,2,3');
    expect(stats().F).toBe(0); expect(stats().p).toBe(1); expect(container.querySelector('table')).not.toBeNull(); await click('Variance decomposition'); expect(container.textContent).toContain('Between groups: 0%'); await click('Table guide'); expect(container.textContent).toContain('A zero between-group SS is valid');
});
it('does not create group plots or an ANOVA table from F alone and supports keyboard exploration', async () => {
    await mount(); const previous = stats().p; await change('Explore F slider', 8); expect(stats().F).toBe(8); expect(stats().p).toBeLessThan(previous);
    for (const label of ['Group means', 'Plot maker', 'Variance decomposition', 'Table guide']) { await click(label); expect(container.textContent).toContain('cannot reconstruct groups'); expect(container.querySelector('svg')).toBeNull(); expect(container.querySelector('table')).toBeNull(); }
});
it('never invents observations from summaries and retains plot controls between means and plot maker', async () => {
    await mount(); await click('Summary statistics'); await click('Group means'); expect(container.querySelectorAll('[data-observation]')).toHaveLength(0); expect(container.querySelectorAll('[data-group-mean]')).toHaveLength(3); expect(container.textContent).toContain('individual observations cannot be reconstructed');
    await click('Plot maker'); await change('ANOVA plot type','bar'); await change('ANOVA error bars','sd'); expect(container.querySelectorAll('[data-error-bar="sd"]')).toHaveLength(3);
    const before = stats(); await change('Group 1 horizontal position',80); await change('Group 1 plot color','#ff0000'); expect(stats()).toBe(before); expect(container.querySelector('[data-group-mean="0"]').getAttribute('fill')).toBe('#ff0000');
    await click('Group means'); await click('Plot maker'); expect(field('ANOVA plot type').value).toBe('bar'); expect(field('Group 1 horizontal position').value).toBe('80');
    await change('ANOVA plot type','line'); expect(container.textContent).toContain('does not show individual change'); await click('Reset plot'); expect(field('ANOVA plot type').value).toBe('dot'); expect(field('Group 1 horizontal position').value).toBe('25');
});
it('validates custom axes, clips marks, retains labels, and preserves inference', async () => {
    await mount(); await click('Raw data'); await click('Plot maker'); const before = stats(); await change('ANOVA Y-axis label','Outcome'); await change('ANOVA Y minimum',10); await change('ANOVA Y maximum',2);
    expect(container.textContent).toContain('Y minimum below Y maximum'); expect(container.querySelector('svg')).toBeNull(); expect(stats()).toBe(before);
    await change('ANOVA Y minimum',0); expect(container.querySelector('clipPath')).not.toBeNull(); expect(container.textContent).toContain('Custom axis limits clip'); await change('ANOVA plot type','line'); expect(field('ANOVA Y-axis label').value).toBe('Outcome');
    await change('ANOVA Y maximum',''); await change('ANOVA Y minimum',100); expect(container.querySelector('svg')).not.toBeNull(); expect(stats()).toBe(before);
});
it('plots only observed raw values and explains point caps, grand means, and error bars', async () => {
    await mount(); await click('Raw data'); await change('Group 1 raw values',Array.from({length:150},(_,i)=>i).join(',')); await click('Plot maker');
    expect(container.querySelectorAll('[data-observation]')).toHaveLength(110); expect(stats().N).toBe(160); expect(container.textContent).toContain('Showing the first 100 observations per group'); expect(container.textContent).toContain('not confidence intervals');
    await click('Observed values'); expect(container.querySelectorAll('[data-observation]')).toHaveLength(0); await click('Grand mean'); expect(container.querySelector('[data-testid="grand-mean"]')).toBeNull();
});
it('handles tutor navigation and pairwise actions without changing the selected alpha', async () => {
    await mount(); await click('Raw data'); await change('Significance level',.01); await action('run_post_hoc'); expect(stats().comparisons).toHaveLength(3); expect(stats().alpha).toBe(.01);
    await action('highlight_ssb'); expect(container.textContent).toContain('Where the variation comes from'); await action('highlight_f_drivers'); expect(container.textContent).toContain('Their ratio is F'); await action('add_group'); expect(stats()).toBeNull(); expect(field('Group 4 raw values').value).toBe('');
});
it('leaves stored calculator inputs and draft removal untouched through edits, reset and remount', async () => {
    const draft = createOneWayDraft(); draft.raw.groups[0].raw = '99,100,101'; oneWayDraftStorage.save(draft); const saved = localStorage.getItem(ONE_WAY_DRAFT_KEY); const write = vi.spyOn(Storage.prototype,'setItem');
    await mount(); await click('Raw data'); await change('Group 1 raw values','1,2,3'); await change('Significance level',.01); await compare(); await click('Reset lesson'); expect(write).not.toHaveBeenCalled(); expect(localStorage.getItem(ONE_WAY_DRAFT_KEY)).toBe(saved);
    await act(async()=>root.unmount()); root=createRoot(container); await mount(); expect(stats().F).toBe(3.5); expect(localStorage.getItem(ONE_WAY_DRAFT_KEY)).toBe(saved);
});
