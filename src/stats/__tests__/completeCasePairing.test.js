import { describe, expect, it } from 'vitest';
import { calculatePearsonCorrelationStats, pairNumericColumns } from '../correlation.js';
import { calculateSimpleLinearRegressionStats } from '../regression.js';

describe('pairNumericColumns', () => {
    it('excludes incomplete and nonnumeric rows without converting them to zero', () => {
        const pairs = pairNumericColumns(
            [1, null, '', '   ', undefined, 'not-a-number', 0, '8'],
            [2, 4, 5, 6, 7, 8, 9, '10']
        );

        expect(pairs.map(({ index, x, y }) => ({ index, x, y }))).toEqual([
            { index: 0, x: 1, y: 2 },
            { index: 6, x: 0, y: 9 },
            { index: 7, x: 8, y: 10 },
        ]);
    });

    it('requires both values on the same row to be numeric', () => {
        expect(pairNumericColumns([1, 2, 3], [4, null, 6])).toEqual([
            { id: 0, index: 0, x: 1, y: 4 },
            { id: 2, index: 2, x: 3, y: 6 },
        ]);
    });
});

describe('complete-case calculator behavior', () => {
    const xValues = [1, null, 3];
    const yValues = [2, 4, 6];

    it('rejects Pearson correlation when fewer than three complete pairs remain', () => {
        const result = calculatePearsonCorrelationStats({ xValues, yValues });

        expect(result.ok).toBe(false);
        expect(result.n).toBe(2);
        expect(result.pairs.map(({ x, y }) => [x, y])).toEqual([[1, 2], [3, 6]]);
    });

    it('rejects simple regression when fewer than three complete pairs remain', () => {
        const result = calculateSimpleLinearRegressionStats({ xValues, yValues });

        expect(result.ok).toBe(false);
        expect(result.n).toBe(2);
        expect(result.pairs.map(({ x, y }) => [x, y])).toEqual([[1, 2], [3, 6]]);
    });

    it('calculates Pearson correlation from complete rows only', () => {
        const result = calculatePearsonCorrelationStats({
            xValues: [1, null, 3, 4],
            yValues: [2, 4, 6, 8],
        });

        expect(result.ok).toBe(true);
        expect(result.n).toBe(3);
        expect(result.pairs.map(({ x, y }) => [x, y])).toEqual([[1, 2], [3, 6], [4, 8]]);
        // Perfect correlations are bounded just inside ±1 so Fisher-z
        // confidence intervals remain finite.
        expect(result.r).toBeCloseTo(0.999999, 10);
    });

    it('calculates regression from complete rows only', () => {
        const result = calculateSimpleLinearRegressionStats({
            xValues: [1, null, 3, 4],
            yValues: [2, 4, 6, 8],
        });

        expect(result.ok).toBe(true);
        expect(result.n).toBe(3);
        expect(result.pairs.map(({ x, y }) => [x, y])).toEqual([[1, 2], [3, 6], [4, 8]]);
        expect(result.slope).toBeCloseTo(2, 10);
        expect(result.intercept).toBeCloseTo(0, 10);
    });
});
