import { readStoredJson, writeStoredJson } from './storage.js';

export const INPUT_DRAFT_PREFIX = 'statwizard.input-draft.';
export const MAX_DRAFT_CHARACTERS = 250000;
const valid = value => value && typeof value === 'object'
    && typeof value.input === 'string' && value.input.length <= MAX_DRAFT_CHARACTERS
    && typeof value.source === 'string' && value.source.length <= 100;

export const readInputDraft = id => readStoredJson({ key: INPUT_DRAFT_PREFIX + id, version: 1, validate: valid, fallback: null });
export const saveInputDraft = (id, value) => valid(value)
    && writeStoredJson({ key: INPUT_DRAFT_PREFIX + id, version: 1, value });
export const removeInputDraft = id => {
    try {
        if (!globalThis.localStorage) return false;
        globalThis.localStorage.removeItem(INPUT_DRAFT_PREFIX + id);
        return true;
    } catch { return false; }
};
