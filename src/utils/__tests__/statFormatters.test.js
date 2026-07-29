import { describe, expect, it } from 'vitest';
import { formatPValue, formatStatistic } from '../statFormatters.js';

describe('statistical display formatters', () => {
    it('formats finite statistics and removes insignificant trailing zeroes', () => {
        expect(formatStatistic(0.5)).toBe('0.5');
        expect(formatStatistic(-1.23456, 2)).toBe('-1.23');
        expect(formatStatistic(Number.NaN)).toBe('--');
    });

    it('formats conventional p-value displays', () => {
        expect(formatPValue(0.0004)).toBe('< .001');
        expect(formatPValue(0.0421)).toBe('= .042');
        expect(formatPValue(undefined)).toBe('--');
    });
});
