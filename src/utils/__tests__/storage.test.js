import { describe, expect, it, vi } from 'vitest';
import {
    hasStoredValue,
    isStringArray,
    readStoredJson,
    writeStoredJson,
} from '../storage.js';

const createStorage = (initialEntries = {}) => {
    const values = new Map(Object.entries(initialEntries));

    return {
        getItem: vi.fn((key) => values.get(key) ?? null),
        setItem: vi.fn((key, value) => values.set(key, value)),
        values,
    };
};

describe('defensive browser storage', () => {
    it('reads validated JSON values', () => {
        const storage = createStorage({ tutor: JSON.stringify(['one', 'two']) });

        expect(readStoredJson({
            key: 'tutor',
            fallback: [],
            validate: isStringArray,
            storage,
        })).toEqual(['one', 'two']);
    });

    it('returns a fallback for malformed or schema-invalid JSON', () => {
        const malformed = createStorage({ tutor: '{not-json' });
        const invalid = createStorage({ tutor: JSON.stringify({ unexpected: true }) });

        expect(readStoredJson({
            key: 'tutor',
            fallback: [],
            validate: isStringArray,
            storage: malformed,
        })).toEqual([]);
        expect(readStoredJson({
            key: 'tutor',
            fallback: [],
            validate: isStringArray,
            storage: invalid,
        })).toEqual([]);
    });

    it('handles unavailable storage without throwing', () => {
        const storage = {
            getItem: vi.fn(() => { throw new Error('blocked'); }),
            setItem: vi.fn(() => { throw new Error('quota'); }),
        };

        expect(readStoredJson({ key: 'tutor', fallback: ['fallback'], storage })).toEqual(['fallback']);
        expect(writeStoredJson({ key: 'tutor', value: ['one'], storage })).toBe(false);
        expect(hasStoredValue({ key: 'tutor', storage })).toBe(false);
    });

    it('supports versioned values and rejects incompatible versions', () => {
        const storage = createStorage();

        expect(writeStoredJson({ key: 'tutor', value: ['one'], version: 1, storage })).toBe(true);
        expect(readStoredJson({
            key: 'tutor',
            fallback: [],
            validate: isStringArray,
            version: 1,
            storage,
        })).toEqual(['one']);
        expect(readStoredJson({
            key: 'tutor',
            fallback: ['fallback'],
            validate: isStringArray,
            version: 2,
            storage,
        })).toEqual(['fallback']);
    });

    it('accepts valid legacy data so the next write can migrate it', () => {
        const storage = createStorage({ tutor: JSON.stringify(['legacy']) });

        expect(readStoredJson({
            key: 'tutor',
            fallback: [],
            validate: isStringArray,
            version: 1,
            storage,
        })).toEqual(['legacy']);
    });
});
