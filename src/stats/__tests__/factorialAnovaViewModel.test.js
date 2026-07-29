import { describe, expect, it } from 'vitest';
import {
    createFactorialTutorContext,
    createResidualHistogram,
    isFactorialDatasetEmpty,
    summarizeFactorialCellRaw,
} from '../factorialAnovaViewModel.js';

const factors = [
    { label: 'Treatment', levels: [{ id: 'a1' }, { id: 'a2' }] },
    { label: 'Setting', levels: [{ id: 'b1' }, { id: 'b2' }] },
];

describe('factorial ANOVA view-model helpers', () => {
    it('summarizes finite raw values with a sample standard deviation', () => {
        expect(summarizeFactorialCellRaw('1, 2 3\ninvalid 4x')).toEqual({
            values: [1, 2, 3],
            summary: { n: '3', mean: '2.00', sd: '1.00' },
        });
    });

    it('recognizes empty raw and summary cells', () => {
        expect(isFactorialDatasetEmpty({
            first: { inputMode: 'raw', values: [] },
            second: { inputMode: 'summary', summary: { n: '0' } },
        })).toBe(true);
        expect(isFactorialDatasetEmpty({
            first: { inputMode: 'raw', values: [0] },
        })).toBe(false);
    });

    it('creates stable residual bins for empty and constant samples', () => {
        expect(createResidualHistogram([], 4)).toEqual([0, 0, 0, 0]);
        expect(createResidualHistogram([2, 2, 2], 5)).toEqual([0, 0, 3, 0, 0]);
    });

    it('classifies crossing interactions and preserves exact zero p-values', () => {
        const cellStats = {
            a1_b1: { n: 3, mean: 1, ss: 2 },
            a2_b1: { n: 3, mean: 4, ss: 2 },
            a1_b2: { n: 3, mean: 5, ss: 2 },
            a2_b2: { n: 3, mean: 2, ss: 2 },
        };
        const context = createFactorialTutorContext({
            activeTab: 'plot',
            alpha: 0.05,
            factors,
            cellData: Object.fromEntries(Object.keys(cellStats).map((key) => [
                key,
                { inputMode: 'raw', values: [1, 2, 3] },
            ])),
            results: {
                cellStats,
                effects: {
                    A: { p: 0, pes: 0.2 },
                    B: { p: 0.2, pes: 0.1 },
                    AxB: { p: 0.001, pes: 0.4 },
                },
            },
        });

        expect(context).toMatchObject({
            interactionType: 'crossing',
            totalCells: 4,
            totalN: 12,
            pA: 0,
            hasEmptyCells: false,
        });
    });
});
