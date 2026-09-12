import { readStoredJson, writeStoredJson } from './storage.js';

export const ONE_SAMPLE_DRAFT_KEY = 'statwizard.calculator-draft.one-sample-t';
const LIMIT = 250000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= LIMIT;
const entry = value => text(value) || (typeof value === 'number' && Number.isFinite(value));
export const oneSampleExample = () => ({ inputMode: 'summary', raw: '', summary: { mean: 105, sd: 15, n: 30 }, source: 'Example starting values.' });
export const createOneSampleDraft = (_, launch) => ({
    ...oneSampleExample(), mode: launch ? 'saved' : 'manual', selectedDatasetId: launch?.datasetId || '',
    savedRoles: launch ? { [launch.datasetId]: { outcome: launch.outcome || '' } } : {},
    nullMean: 100, alpha: 0.05, tails: 2, direction: 'greater', ciType: 'two-sided',
});
export const isOneSampleDraft = value => record(value) && ['manual', 'saved'].includes(value.mode)
    && text(value.selectedDatasetId) && record(value.savedRoles)
    && Object.values(value.savedRoles).every(roles => record(roles) && text(roles.outcome))
    && ['raw', 'summary'].includes(value.inputMode) && text(value.raw) && text(value.source)
    && record(value.summary) && ['mean', 'sd', 'n'].every(key => entry(value.summary[key]))
    && entry(value.nullMean) && [0.1, 0.05, 0.01].includes(value.alpha) && [1, 2].includes(value.tails)
    && ['greater', 'less'].includes(value.direction) && ['two-sided', 'one-sided'].includes(value.ciType)
    && JSON.stringify(value).length <= LIMIT;
const read = () => readStoredJson({ key: ONE_SAMPLE_DRAFT_KEY, version: 1, fallback: null, validate: isOneSampleDraft });
const save = value => {
    if (JSON.stringify(value).length > LIMIT) return 'too-large';
    return isOneSampleDraft(value) && writeStoredJson({ key: ONE_SAMPLE_DRAFT_KEY, version: 1, value }) ? 'saved' : 'unsaved';
};
const remove = () => {
    try { globalThis.localStorage.removeItem(ONE_SAMPLE_DRAFT_KEY); return true; }
    catch { return false; }
};
export const oneSampleDraftStorage = { analysisId: 'one_sample_t_test', create: createOneSampleDraft, read, save, remove };
