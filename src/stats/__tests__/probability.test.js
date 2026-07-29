import { describe, expect, it } from 'vitest';
import {
    binomialProbability,
    combinations,
    diceSumDistribution,
} from '../probability';

describe('combinations', () => {
    it.each([
        [5, 0, 1],
        [5, 2, 10],
        [10, 3, 120],
        [52, 5, 2598960],
    ])('computes %i choose %i', (n, r, expected) => {
        expect(combinations(n, r)).toBe(expected);
    });

    it('rejects invalid integer domains', () => {
        expect(combinations(4, 5)).toBe(0);
        expect(combinations(4.5, 2)).toBe(0);
        expect(combinations(-1, 0)).toBe(0);
    });
});

describe('binomialProbability', () => {
    it('matches a known fair-coin probability', () => {
        expect(binomialProbability({ successes: 5, trials: 10, probability: 0.5 }))
            .toBeCloseTo(0.24609375, 12);
    });

    it('handles impossible and invalid inputs', () => {
        expect(binomialProbability({ successes: 11, trials: 10, probability: 0.5 })).toBe(0);
        expect(binomialProbability({ successes: 1, trials: 10, probability: 2 })).toBeNaN();
    });
});

describe('diceSumDistribution', () => {
    it('returns the exact two-die distribution', () => {
        const distribution = diceSumDistribution(2);
        expect(distribution).toHaveLength(11);
        expect(distribution.find(({ sum }) => sum === 2)?.probability).toBeCloseTo(1 / 36, 12);
        expect(distribution.find(({ sum }) => sum === 7)?.probability).toBeCloseTo(6 / 36, 12);
        expect(distribution.reduce((total, item) => total + item.probability, 0)).toBeCloseTo(1, 12);
    });

    it('supports nonstandard dice and rejects invalid counts', () => {
        expect(diceSumDistribution(1, 4)).toEqual([
            { sum: 1, probability: 0.25 },
            { sum: 2, probability: 0.25 },
            { sum: 3, probability: 0.25 },
            { sum: 4, probability: 0.25 },
        ]);
        expect(diceSumDistribution(0)).toEqual([]);
    });
});
