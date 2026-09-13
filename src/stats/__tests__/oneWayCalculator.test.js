import { expect, it } from 'vitest';
import reference from '../../../docs/audits/2026-09-12/one-way-reference.json';
import { calculateOneWayCalculator } from '../oneWayCalculator.js';
import { createOneWayDraft } from '../../utils/oneWayDraft.js';
const defaults = createOneWayDraft();
const calculate = changes => calculateOneWayCalculator({ ...defaults, groups: defaults.raw.groups, ...changes });
it.each(reference.cases)('matches base R ANOVA and pooled Bonferroni comparisons: $id', fixture => {
    const groups = [fixture.raw1, fixture.raw2, fixture.raw3].filter(Boolean).map((raw, i) => ({ raw, label: `Group ${i + 1}` }));
    const result = calculate({ groups, alpha: fixture.alpha, showComparisons: true });
    expect(result.ok).toBe(true);
    for (const key of ['F', 'df1', 'df2', 'ssB', 'ssW', 'Fcrit']) expect(result[key]).toBeCloseTo(fixture[key], 6);
    expect(Math.abs(result.p - fixture.p)).toBeLessThan(1e-8);
    expect(result.comparisons[0].pAdjusted).toBeCloseTo(fixture.pairP, 7);
    expect(result.comparisons[0].lower).toBeCloseTo(fixture.lower, 6); expect(result.comparisons[0].upper).toBeCloseTo(fixture.upper, 6);
    expect(result.comparisons[0].significant).toBe(fixture.pairP < fixture.alpha);
    if (result.samples.every(sample => sample.n >= 2)) {
        const summary = calculate({ groups: result.samples, inputMode: 'summary', alpha: fixture.alpha, showComparisons: true });
        expect(summary.F).toBeCloseTo(result.F, 8); expect(summary.p).toBeCloseTo(result.p, 10); expect(summary.comparisons).toEqual(result.comparisons);
    }
});
it.each(reference.fCases)('matches base R supplied F inference: %j', fixture => {
    const result = calculate({ inputMode: 'f', f: fixture, alpha: fixture.alpha, showComparisons: true });
    expect(result.ok).toBe(true); expect(result.p).toBeCloseTo(fixture.p, 8); expect(result.Fcrit).toBeCloseTo(fixture.Fcrit, 6); expect(result.samples).toBeUndefined(); expect(result.comparisons).toEqual([]);
});
it('preserves strict raw precision and excludes invalid entries without dropping entire groups', () => {
    const result = calculate({ groups: [{ label: 'A', raw: '1.123456789, 2.234567891;4.345678912 nope 12oops Infinity 0x10' }, { label: 'B', raw: '1,4,8' }] });
    expect(result.samples[0].mean).toBeCloseTo(2.567901197333333, 12); expect(result.parsed[0].invalid).toHaveLength(4);
    expect(calculate({ groups: [{ label: 'A', raw: '' }, { label: 'B', raw: '1,4,8' }] }).ok).toBe(false);
});
it.each([{mean:''},{sd:''},{sd:-1},{n:2.5},{n:1},{mean:'12oops'},{n:'Infinity'}])('blocks invalid summary fields: %j', change => {
    expect(calculate({ inputMode: 'summary', groups: [{ ...defaults.summary.groups[0], ...change }, defaults.summary.groups[1]] }).ok).toBe(false);
});
it.each([{F:''},{F:-1},{df1:0},{df2:-1},{df2:.001},{F:1e308,df1:1e308},{df1:'Infinity'}])('blocks invalid or unsupported supplied F fields: %j', change => {
    expect(calculate({ inputMode: 'f', f: { ...defaults.f, ...change } }).ok).toBe(false);
});
it.each([['1','2'],['1,1','2,2'],['1e308,1e308','2,3']])('blocks absent variability, residual df, or overflowing data: %j', (first, second) => {
    expect(calculate({ groups: [{ label: 'A', raw: first }, { label: 'B', raw: second }] }).ok).toBe(false);
});
it('keeps the upper-tail probability positive for a large F and uses the selected alpha for comparisons', () => {
    expect(calculate({ inputMode: 'f', f: { F: 10000, df1: 3, df2: 100 } }).p).toBeGreaterThan(0);
    const groups = [{ label: 'A', raw: '1,2,3' }, { label: 'B', raw: '2,3,4' }];
    const lo = calculate({ groups, alpha: .01, showComparisons: true }), hi = calculate({ groups, alpha: .1, showComparisons: true });
    expect(lo.comparisons[0].pAdjusted).toBe(hi.comparisons[0].pAdjusted); expect(lo.comparisons[0].lower).toBeLessThan(hi.comparisons[0].lower);
});
