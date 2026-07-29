import { describe, expect, it } from 'vitest';
import {
    buildIndependentTTestReport,
    calculateIndependentTTest,
    summarizeIndependentSample,
} from '../independentTTest.js';

const equalVarianceGroups = {
    group1: { xBar: 12, s: 2.5, n: 30 },
    group2: { xBar: 10, s: 2.5, n: 30 },
};

describe('independent-samples t tests', () => {
    it('calculates the pooled-variance test and two-sided interval', () => {
        const result = calculateIndependentTTest({ ...equalVarianceGroups, testType: 'student' });

        expect(result.ok).toBe(true);
        expect(result.df).toBe(58);
        expect(result.se).toBeCloseTo(0.6454972244, 9);
        expect(result.t).toBeCloseTo(3.098386677, 9);
        expect(result.p).toBeCloseTo(0.00299864, 7);
        expect(result.ciLower).toBeCloseTo(0.707897, 5);
        expect(result.ciUpper).toBeCloseTo(3.292103, 5);
    });

    it('uses fractional Welch degrees of freedom for unequal variances', () => {
        const result = calculateIndependentTTest({
            group1: { xBar: 5, s: 2, n: 10 },
            group2: { xBar: 4, s: 4, n: 20 },
            testType: 'welch',
        });

        expect(result.df).toBeCloseTo(27.981818, 5);
        expect(result.se).toBeCloseTo(Math.sqrt(1.2), 10);
        expect(result.t).toBeCloseTo(0.9128709292, 9);
        expect(result.p).toBeCloseTo(0.36910912, 7);
    });

    it('respects directional alternatives and one-sided bounds', () => {
        const result = calculateIndependentTTest({
            ...equalVarianceGroups,
            tails: 1,
            direction: 'less',
            ciType: 'one-sided',
        });

        expect(result.p).toBeGreaterThan(0.99);
        expect(result.isSignificant).toBe(false);
        expect(result.ciLower).toBe(Number.NEGATIVE_INFINITY);
        expect(Number.isFinite(result.ciUpper)).toBe(true);
    });

    it('strictly summarizes raw samples while retaining incomplete input text', () => {
        expect(summarizeIndependentSample('1, 2 3 bad 4x')).toMatchObject({
            ok: true,
            values: [1, 2, 3],
            n: 3,
            xBar: 2,
            s: 1,
        });
        expect(summarizeIndependentSample('1,')).toEqual({
            ok: false,
            raw: '1,',
            values: [1],
        });
    });

    it('builds pooled and Welch report labels', () => {
        const pooled = calculateIndependentTTest({ ...equalVarianceGroups, testType: 'student' });
        const welch = calculateIndependentTTest({ ...equalVarianceGroups, testType: 'welch' });

        expect(buildIndependentTTestReport({ result: pooled })).toMatch(/^Independent-samples t-test/);
        expect(buildIndependentTTestReport({ result: welch, showCI: true })).toContain("Welch's independent-samples t-test");
    });
});
