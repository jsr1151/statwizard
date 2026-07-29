import { describe, expect, it } from 'vitest';
import { calculateCentralTendency, calculateWeightedMean, parseNumericInput } from '../centralTendency';

describe('central tendency utilities', () => {
    it('parses common pasted delimiters and reports invalid tokens', () => {
        expect(parseNumericInput('1, 2\n3; nope')).toEqual({ values: [1, 2, 3], invalid: ['nope'], tokenCount: 4 });
    });

    it('calculates mean and odd/even medians without mutating input', () => {
        const values = [9, 1, 4, 2];
        expect(calculateCentralTendency(values)).toMatchObject({ mean: 4, median: 3, sorted: [1, 2, 4, 9] });
        expect(values).toEqual([9, 1, 4, 2]);
        expect(calculateCentralTendency([1, 9, 3]).median).toBe(3);
    });

    it('distinguishes unique, multiple, and no modes', () => {
        expect(calculateCentralTendency([1, 1, 2, 3]).modes).toEqual([1]);
        expect(calculateCentralTendency([1, 1, 2, 2, 3]).modes).toEqual([1, 2]);
        expect(calculateCentralTendency([1, 2, 3]).modes).toEqual([]);
    });

    it('calculates a weighted mean and rejects invalid weights', () => {
        expect(calculateWeightedMean([80, 90], [1, 3])).toBe(87.5);
        expect(calculateWeightedMean([80], [-1])).toBeNull();
        expect(calculateWeightedMean([80], [0])).toBeNull();
    });
});
