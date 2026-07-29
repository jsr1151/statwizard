import { describe, expect, it } from 'vitest';
import {
    calculateOneSampleTest,
    getOneSampleCriticalValue,
    getOneSamplePValue,
    summarizeRawSample,
} from '../oneSampleTest';

describe('one-sample distribution helpers', () => {
    it('returns signed one- and two-sided z critical values', () => {
        expect(getOneSampleCriticalValue({ alpha: 0.05, tails: 2 })).toBe(1.96);
        expect(getOneSampleCriticalValue({ alpha: 0.05, tails: 1, direction: 'greater' })).toBe(1.645);
        expect(getOneSampleCriticalValue({ alpha: 0.05, tails: 1, direction: 'less' })).toBe(-1.645);
    });

    it('computes two-sided and directional z p-values', () => {
        expect(getOneSamplePValue({ statistic: 1.96, tails: 2 })).toBeCloseTo(0.049996, 5);
        expect(getOneSamplePValue({ statistic: 1.645, tails: 1, direction: 'greater' }))
            .toBeCloseTo(0.05, 3);
        expect(getOneSamplePValue({ statistic: -1.645, tails: 1, direction: 'less' }))
            .toBeCloseTo(0.05, 3);
    });

    it('uses the t distribution when requested', () => {
        const pValue = getOneSamplePValue({
            statistic: 2.262157,
            tails: 2,
            type: 't',
            df: 9,
        });
        expect(pValue).toBeCloseTo(0.05, 4);
    });

    it('returns a complete one-sample result model', () => {
        const result = calculateOneSampleTest({
            alpha: 0.05,
            ciType: 'two-sided',
            df: 29,
            direction: 'greater',
            mean: 105,
            n: 25,
            nullMean: 100,
            spread: 10,
            statistic: 2.5,
            tails: 2,
            type: 'z',
        });

        expect(result.standardError).toBe(2);
        expect(result.effectSize).toBe(0.5);
        expect(result.isSignificant).toBe(true);
        expect(result.confidenceInterval.lower).toBeCloseTo(101.08, 2);
        expect(result.confidenceInterval.upper).toBeCloseTo(108.92, 2);
    });
});

describe('summarizeRawSample', () => {
    it('parses comma and whitespace-delimited values with sample SD', () => {
        expect(summarizeRawSample('1, 2 3\n4', 2)).toMatchObject({
            n: 4,
            mean: 2.5,
            standardDeviation: 1.291,
        });
    });

    it('requires at least two complete numeric values', () => {
        expect(summarizeRawSample('')).toBeNull();
        expect(summarizeRawSample('5')).toBeNull();
    });
});
