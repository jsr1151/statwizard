import { describe, expect, it } from 'vitest';
import { calculateFrequencies, parseFrequencyInput } from '../frequency';

describe('frequency utilities', () => {
    it('parses pasted categories while preserving spaces inside delimited labels', () => {
        expect(parseFrequencyInput('New York, New York; Boston\nChicago')).toEqual(['New York', 'New York', 'Boston', 'Chicago']);
        expect(parseFrequencyInput('1 2 2 3')).toEqual(['1', '2', '2', '3']);
    });

    it('calculates absolute, relative, percentage, and cumulative frequency', () => {
        const result = calculateFrequencies(['1', '2', '2', '3']);
        expect(result).toMatchObject({ n: 4, uniqueCount: 3, modes: ['2'], maxFrequency: 2 });
        expect(result.rows[1]).toMatchObject({ value: '2', frequency: 2, relativeFrequency: 0.5, percentage: 50, cumulativeFrequency: 3, cumulativePercentage: 75 });
    });

    it('sorts categories by frequency when requested', () => {
        expect(calculateFrequencies(['b', 'a', 'b', 'c', 'c', 'c'], 'frequency').rows.map((row) => row.value)).toEqual(['c', 'b', 'a']);
    });

    it('returns null for empty data', () => {
        expect(calculateFrequencies([])).toBeNull();
    });
});
