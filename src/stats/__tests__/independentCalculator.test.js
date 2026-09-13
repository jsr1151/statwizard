import { expect, it } from 'vitest';
import reference from '../../../docs/audits/2026-09-12/independent-reference.json';
import { calculateIndependentCalculator } from '../independentCalculator.js';
import { createIndependentDraft } from '../../utils/independentDraft.js';
const defaults = createIndependentDraft();
it.each(reference.cases)('matches independent R inference: $id', fixture => {
    const groups = [1, 2].map(i => ({ raw: '', mean: fixture[`mean${i}`], sd: fixture[`sd${i}`], n: fixture[`n${i}`] }));
    const result = calculateIndependentCalculator({ ...defaults, ...fixture, groups });
    expect(result.ok).toBe(true); expect(result.t).toBeCloseTo(fixture.t, 8); expect(result.df).toBeCloseTo(fixture.df, 8);
    expect(Math.abs(result.p - fixture.p)).toBeLessThan(1e-7);
    for (const [actual, expected] of [[result.ciLower, fixture.lower], [result.ciUpper, fixture.upper]]) {
        if (typeof expected === 'string') expect(actual).toBe(expected === 'Inf' ? Infinity : -Infinity);
        else expect(Math.abs(actual - expected)).toBeLessThan(1e-6);
    }
});
it('keeps raw precision, excludes partial numbers, and analyzes independent groups of different sizes', () => {
    const result = calculateIndependentCalculator({ ...defaults, inputMode: 'raw', groups: [{ raw: '1.123456789,2.234567891;4.345678912\n5.456789123, nope, 12oops' }, { raw: '1 2 5 Infinity' }] });
    expect(result.ok).toBe(true); expect(result.n1).toBe(4); expect(result.n2).toBe(3); expect(result.x1).toBeCloseTo(3.29012317875, 12);
    expect(result.parsed[0].invalid).toEqual(['nope', '12oops']); expect(result.parsed[1].invalid).toEqual(['Infinity']);
    const summary = calculateIndependentCalculator({ ...defaults, groups: result.samples.map(sample => ({ raw: '', mean: sample.xBar, sd: sample.s, n: sample.n })) });
    expect(summary.t).toBe(result.t); expect(summary.p).toBe(result.p);
});
it.each(['student','welch'])('swapping groups reverses directional inference for %s', testType => {
    const options = { ...defaults, testType, tails: 1, direction: 'greater', ciType: 'one-sided' };
    const first = calculateIndependentCalculator(options), swapped = calculateIndependentCalculator({ ...options, groups: [...options.groups].reverse() });
    expect(swapped.t).toBe(-first.t); expect(swapped.p).toBeCloseTo(1 - first.p, 10); expect(swapped.df).toBe(first.df);
});
it.each([{ mean: '' }, { sd: '' }, { sd: -1 }, { n: 2.5 }, { n: 1 }, { n: '' }, { mean: 1e308, sd: 1e-300 }])('blocks invalid summary values: %j', change => {
    expect(calculateIndependentCalculator({ ...defaults, groups: [{ ...defaults.groups[0], ...change }, defaults.groups[1]] }).ok).toBe(false);
});
it.each(['', 'nope', '1'])('blocks incomplete raw groups: %j', raw => {
    expect(calculateIndependentCalculator({ ...defaults, inputMode: 'raw', groups: [{ raw }, { raw: '1,2,3' }] }).ok).toBe(false);
});
it('blocks zero variability in both groups instead of returning a fabricated test', () => {
    expect(calculateIndependentCalculator({ ...defaults, inputMode: 'raw', groups: [{ raw: '1,1,1' }, { raw: '2,2,2' }] }).ok).toBe(false);
});
