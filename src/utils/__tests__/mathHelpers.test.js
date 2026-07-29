import { describe, expect, it } from 'vitest';
import { getTCrit, tCDF } from '../mathHelpers.js';

describe('Student t distribution helpers', () => {
    it.each([
        { statistic: 12.706, df: 1, expectedTwoTailedP: 0.05 },
        { statistic: 4.303, df: 2, expectedTwoTailedP: 0.05 },
        { statistic: 2.571, df: 5, expectedTwoTailedP: 0.05 },
        { statistic: 2.042, df: 30, expectedTwoTailedP: 0.05 },
    ])('matches reference two-tailed p-values for t($df)', ({ statistic, df, expectedTwoTailedP }) => {
        const pValue = 2 * (1 - tCDF(Math.abs(statistic), df));

        expect(pValue).toBeCloseTo(expectedTwoTailedP, 3);
    });

    it('returns accurate critical values for common alpha levels', () => {
        expect(getTCrit(0.05, 1, 2)).toBeCloseTo(12.7062, 3);
        expect(getTCrit(0.10, 1, 2)).toBeCloseTo(6.3138, 3);
        expect(getTCrit(0.05, 10, 1)).toBeCloseTo(1.8125, 3);
    });

    it('supports fractional Welch degrees of freedom', () => {
        const criticalValue = getTCrit(0.05, 7.5, 2);

        expect(Number.isFinite(criticalValue)).toBe(true);
        expect(criticalValue).toBeGreaterThan(2.3);
        expect(criticalValue).toBeLessThan(2.4);
    });

    it('rejects invalid distribution inputs', () => {
        expect(Number.isNaN(getTCrit(0, 10, 2))).toBe(true);
        expect(Number.isNaN(getTCrit(0.05, 0, 2))).toBe(true);
        expect(Number.isNaN(getTCrit(0.05, 10, 3))).toBe(true);
    });
});
