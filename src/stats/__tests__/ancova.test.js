import { describe, expect, it } from 'vitest';
import {
    calculateAncova,
    calculateAncovaPairwiseComparisons,
    hydrateAncovaGroups,
    parseAncovaSeries,
} from '../ancova.js';

const referenceGroups = [
    { id: 'a', label: 'A', xValues: [1, 2, 3, 4], yValues: [3, 6, 7, 10] },
    { id: 'b', label: 'B', xValues: [1, 2, 3, 4], yValues: [6, 7, 10, 11] },
];

describe('ANCOVA model', () => {
    it('strictly parses finite numeric series and hydrates raw groups', () => {
        expect(parseAncovaSeries('1, 2\n3 4x Infinity')).toEqual([1, 2, 3]);
        expect(hydrateAncovaGroups([{ xRaw: '1 2', yRaw: '3,4' }])[0]).toMatchObject({
            xValues: [1, 2],
            yValues: [3, 4],
        });
    });

    it('matches a hand-calculated two-group common-slope model', () => {
        const result = calculateAncova(referenceGroups);

        expect(result).toMatchObject({ ready: true, k: 2, nTotal: 8, dfGrp: 1, dfE_common: 5 });
        expect(result.b_w).toBeCloseTo(2, 12);
        expect(result.SSgrp).toBeCloseTo(8, 12);
        expect(result.SSE_common).toBeCloseTo(2, 12);
        expect(result.MSE_common).toBeCloseTo(0.4, 12);
        expect(result.Fgrp).toBeCloseTo(20, 12);
        expect(result.pGrp).toBeCloseTo(0.006566271827374903, 12);
        expect(result.Fcov).toBeCloseTo(100, 12);
    });

    it('excludes incomplete groups from the group count and degrees of freedom', () => {
        const result = calculateAncova([
            ...referenceGroups,
            { id: 'incomplete', xValues: [1], yValues: [2] },
        ]);

        expect(result.k).toBe(2);
        expect(result.dfGrp).toBe(1);
        expect(result.dfE_common).toBe(5);
    });

    it('uses within-covariate SS in adjusted pairwise standard errors', () => {
        const result = calculateAncova([
            referenceGroups[0],
            { ...referenceGroups[1], xValues: [2, 3, 4, 5], yValues: [8, 9, 12, 13] },
        ]);
        const [comparison] = calculateAncovaPairwiseComparisons(result);

        expect(result.ssW_x).toBeCloseTo(10, 12);
        expect(comparison.standardError).toBeCloseTo(0.4898979485566356, 12);
        expect(comparison.p).toBeCloseTo(0.009516658015708224, 12);
    });

    it('reports a non-ready model without two complete groups', () => {
        expect(calculateAncova([referenceGroups[0]])).toEqual({
            ready: false,
            reason: 'insufficient_groups',
        });
    });
});
