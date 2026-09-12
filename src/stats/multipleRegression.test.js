import { expect, it } from 'vitest';
import { calculateMultipleRegressionStats } from './multipleRegression.js';

it.each([null, undefined, '', '  ', false, NaN, Infinity])('excludes missing or invalid values (%s) without converting them to zero', missing => {
    const base = {
        outcomeValues: [4, 6, 10, 12, 8, 10, 14, 16, 10],
        predictorColumns: [
            [-1, -1, -1, -1, 1, 1, 1, 1, 0],
            [-1, -1, 1, 1, -1, -1, 1, 1, 0],
        ],
    };
    const expected = calculateMultipleRegressionStats(base);
    expect(expected.n).toBe(9);
    for (const missingColumn of [0, 1, 2]) {
        const values = [base.outcomeValues, ...base.predictorColumns].map((column, index) => [...column, index === missingColumn ? missing : 50]);
        const actual = calculateMultipleRegressionStats({ outcomeValues: values[0], predictorColumns: values.slice(1) });
        expect(actual.n).toBe(9);
        expect(actual.intercept).toBeCloseTo(expected.intercept);
        expect(actual.rSquared).toBeCloseTo(expected.rSquared);
    }
});
