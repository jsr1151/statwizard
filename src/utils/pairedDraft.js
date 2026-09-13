import { readStoredJson, writeStoredJson } from './storage.js';
export const PAIRED_DRAFT_KEY = 'statwizard.calculator-draft.paired-t';
const LIMIT = 250000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= LIMIT;
const entry = value => text(value) || (typeof value === 'number' && Number.isFinite(value));
const labels = value => Array.isArray(value) && value.length === 2 && value.every(text);
export const pairedExample = () => ({
    inputMode: 'raw',
    raw: { text: '12,10\n14,11\n11,12\n15,11\n13,10\n16,13\n14,12\n12,11\n15,11\n14,12', labels: ['Condition 1', 'Condition 2'], source: 'Example paired observations' },
    summary: { mean1: 14, sd1: 1.6, mean2: 11.3, sd2: 1.1, n: 10, r: .8, labels: ['Condition 1', 'Condition 2'], source: 'Example paired summary statistics' },
});
export const createPairedDraft = (_, launch) => ({
    ...pairedExample(), mode: launch ? 'saved' : 'manual', selectedDatasetId: launch?.datasetId || '',
    savedRoles: launch ? { [launch.datasetId]: { first: launch.first || '', second: launch.second || '' } } : {},
    alpha: .05, tails: 2, direction: 'greater', ciType: 'two-sided',
});
export const isPairedDraft = value => record(value) && ['manual', 'saved'].includes(value.mode)
    && text(value.selectedDatasetId) && record(value.savedRoles) && Object.values(value.savedRoles).every(roles => record(roles) && text(roles.first) && text(roles.second))
    && ['raw', 'summary'].includes(value.inputMode) && record(value.raw) && text(value.raw.text) && labels(value.raw.labels) && text(value.raw.source)
    && record(value.summary) && ['mean1', 'sd1', 'mean2', 'sd2', 'n', 'r'].every(key => entry(value.summary[key])) && labels(value.summary.labels) && text(value.summary.source)
    && [.1, .05, .01].includes(value.alpha) && [1, 2].includes(value.tails) && ['greater', 'less'].includes(value.direction) && ['two-sided', 'one-sided'].includes(value.ciType)
    && JSON.stringify(value).length <= LIMIT;
const read = () => readStoredJson({ key: PAIRED_DRAFT_KEY, version: 1, fallback: null, validate: isPairedDraft });
const save = value => JSON.stringify(value).length > LIMIT ? 'too-large' : isPairedDraft(value) && writeStoredJson({ key: PAIRED_DRAFT_KEY, version: 1, value }) ? 'saved' : 'unsaved';
const remove = () => { try { globalThis.localStorage.removeItem(PAIRED_DRAFT_KEY); return true; } catch { return false; } };
export const pairedDraftStorage = { analysisId: 'paired_t_test', create: createPairedDraft, read, save, remove };
