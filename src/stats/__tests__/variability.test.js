import { describe, expect, it } from 'vitest';
import { calculateVariability } from '../variability';

describe('variability utilities', () => {
    it('calculates sample and population spread', () => {
        const result = calculateVariability([1, 2, 3, 4, 5]);
        expect(result).toMatchObject({ n: 5, range: 4, q1: 2, median: 3, q3: 4, iqr: 2, populationVariance: 2, sampleVariance: 2.5 });
        expect(result.populationSd).toBeCloseTo(Math.sqrt(2));
        expect(result.sampleSd).toBeCloseTo(Math.sqrt(2.5));
    });

    it('uses interpolated quartiles consistent with common software defaults', () => {
        expect(calculateVariability([1, 2, 3, 4]).q1).toBe(1.75);
        expect(calculateVariability([1, 2, 3, 4]).q3).toBe(3.25);
    });

    it('identifies IQR-fence outliers and median absolute deviation', () => {
        const result = calculateVariability([1, 2, 2, 3, 20]);
        expect(result.outliers).toEqual([20]);
        expect(result.mad).toBe(1);
    });

    it('handles empty, singleton, and zero-mean data', () => {
        expect(calculateVariability([])).toBeNull();
        expect(calculateVariability([4]).sampleSd).toBeNull();
        expect(calculateVariability([-1, 1]).coefficientOfVariation).toBeNull();
    });
});
