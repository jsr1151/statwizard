import { readStoredJson, writeStoredJson } from './storage.js';

export const INDEPENDENT_DRAFT_KEY = 'statwizard.calculator-draft.independent-t';
const LIMIT = 250000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= LIMIT;
const entry = value => text(value) || (typeof value === 'number' && Number.isFinite(value));
export const independentExample = () => ({ inputMode: 'summary', groups: [{ label: 'Group 1', raw: '', mean: 12, sd: 2.5, n: 30 }, { label: 'Group 2', raw: '', mean: 10, sd: 2.5, n: 30 }], source: 'Example starting values.' });
export const createIndependentDraft = (_, launch) => ({
    ...independentExample(), mode: launch ? 'saved' : 'manual', selectedDatasetId: launch?.datasetId || '',
    savedRoles: launch ? { [launch.datasetId]: { outcome: launch.outcome || '', grouping: launch.grouping || '', reverse: false } } : {},
    testType: 'student', alpha: 0.05, tails: 2, direction: 'greater', ciType: 'two-sided',
});
export const isIndependentDraft = value => record(value) && ['manual', 'saved'].includes(value.mode)
    && text(value.selectedDatasetId) && record(value.savedRoles)
    && Object.values(value.savedRoles).every(roles => record(roles) && text(roles.outcome) && text(roles.grouping) && typeof roles.reverse === 'boolean')
    && ['raw', 'summary'].includes(value.inputMode) && text(value.source)
    && Array.isArray(value.groups) && value.groups.length === 2
    && value.groups.every(group => record(group) && text(group.label) && text(group.raw) && ['mean', 'sd', 'n'].every(key => entry(group[key])))
    && ['student', 'welch'].includes(value.testType) && [0.1, 0.05, 0.01].includes(value.alpha) && [1, 2].includes(value.tails)
    && ['greater', 'less'].includes(value.direction) && ['two-sided', 'one-sided'].includes(value.ciType)
    && JSON.stringify(value).length <= LIMIT;
const read = () => readStoredJson({ key: INDEPENDENT_DRAFT_KEY, version: 1, fallback: null, validate: isIndependentDraft });
const save = value => {
    if (JSON.stringify(value).length > LIMIT) return 'too-large';
    return isIndependentDraft(value) && writeStoredJson({ key: INDEPENDENT_DRAFT_KEY, version: 1, value }) ? 'saved' : 'unsaved';
};
const remove = () => {
    try { globalThis.localStorage.removeItem(INDEPENDENT_DRAFT_KEY); return true; }
    catch { return false; }
};
export const independentDraftStorage = { analysisId: 'independent_t_test', create: createIndependentDraft, read, save, remove };
