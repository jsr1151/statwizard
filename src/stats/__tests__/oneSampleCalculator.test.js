import { expect, it } from 'vitest';
import reference from '../../../docs/audits/2026-09-12/one-sample-reference.json';
import { calculateOneSampleCalculator } from '../oneSampleCalculator.js';

const defaults = { inputMode: 'summary', raw: '', summary: { mean: 105, sd: 15, n: 30 }, nullMean: 100, alpha: 0.05, tails: 2, direction: 'greater', ciType: 'two-sided' };
it.each(reference.cases)('matches independent R t.test inference: $id', fixture => {
    const result = calculateOneSampleCalculator({ ...defaults, ...fixture, summary: { mean: fixture.mean, sd: fixture.sd, n: fixture.n } });
    expect(result.ok).toBe(true); expect(result.df).toBe(fixture.df);
    // Shared t-CDF/inverse routines are approximate; use absolute tolerances
    // tighter than the calculator's displayed precision.
    expect(result.t).toBeCloseTo(fixture.t, 8); expect(Math.abs(result.p - fixture.p)).toBeLessThan(1e-7);
    for (const [key, expected] of [['lower', fixture.lower], ['upper', fixture.upper]]) {
        if (typeof expected === 'string') expect(result.confidenceInterval[key]).toBe(expected === 'Inf' ? Infinity : -Infinity);
        else expect(Math.abs(result.confidenceInterval[key] - expected)).toBeLessThan(1e-6);
    }
});
it('uses full-precision raw statistics and does not turn empty separators or partial numbers into values', () => {
    const raw = ' 1.123456789, 2.234567891; 4.345678912\n5.456789123, , nope, 12oops, Infinity ';
    const rawResult = calculateOneSampleCalculator({ ...defaults, inputMode: 'raw', raw, nullMean: 0 });
    expect(rawResult.ok).toBe(true); expect(rawResult.n).toBe(4);
    expect(rawResult.parsed.invalid).toEqual(['nope', '12oops', 'Infinity']);
    expect(rawResult.mean).toBeCloseTo(3.29012317875, 12);
    const summaryResult = calculateOneSampleCalculator({ ...defaults, nullMean: 0, summary: { mean: rawResult.mean, sd: rawResult.sd, n: rawResult.n } });
    expect(summaryResult.t).toBe(rawResult.t); expect(summaryResult.p).toBe(rawResult.p);
});
it.each([
    { inputMode: 'raw', raw: '' }, { inputMode: 'raw', raw: '2' }, { inputMode: 'raw', raw: '3,3,3' },
    { nullMean: '' }, { summary: { mean: '', sd: 15, n: 30 } },
    { summary: { mean: 105, sd: -1, n: 30 } }, { summary: { mean: 105, sd: 15, n: 2.5 } },
    { summary: { mean: 1e308, sd: 1, n: 30 }, nullMean: -1e308 },
])('blocks incomplete or unsupported inputs: %j', change => {
    expect(calculateOneSampleCalculator({ ...defaults, ...change }).ok).toBe(false);
});
