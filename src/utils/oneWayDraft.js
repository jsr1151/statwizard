import { readStoredJson, writeStoredJson } from './storage.js';
export const ONE_WAY_DRAFT_KEY = 'statwizard.calculator-draft.one-way-anova';
export const MAX_ANOVA_GROUPS = 20;
const LIMIT = 250000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= LIMIT;
const entry = value => text(value) || (typeof value === 'number' && Number.isFinite(value));
export const oneWayExample = () => ({
    inputMode: 'raw',
    raw: { source: 'Example group observations', groups: [{ label: 'Control', raw: '5, 6, 7, 5, 6' }, { label: 'Treatment A', raw: '8, 7, 9, 8, 7' }, { label: 'Treatment B', raw: '3, 4, 2, 3, 4' }] },
    summary: { source: 'Example group summaries', groups: [{ label: 'Control', mean: 5.8, sd: .8, n: 5 }, { label: 'Treatment A', mean: 7.8, sd: .8, n: 5 }, { label: 'Treatment B', mean: 3.2, sd: .8, n: 5 }] },
    f: { F: 3.5, df1: 2, df2: 25 },
});
export const createOneWayDraft = (_, launch) => ({
    ...oneWayExample(), mode: launch ? 'saved' : 'manual', selectedDatasetId: launch?.datasetId || '',
    savedRoles: launch ? { [launch.datasetId]: { outcome: launch.outcome || '', grouping: launch.grouping || '' } } : {},
    alpha: .05, showComparisons: false,
});
export const isOneWayDraft = value => record(value) && ['manual', 'saved'].includes(value.mode)
    && text(value.selectedDatasetId) && record(value.savedRoles) && Object.values(value.savedRoles).every(roles => record(roles) && text(roles.outcome) && text(roles.grouping))
    && ['raw', 'summary', 'f'].includes(value.inputMode)
    && ['raw', 'summary'].every(mode => record(value[mode]) && text(value[mode].source) && Array.isArray(value[mode].groups) && value[mode].groups.length >= 2 && value[mode].groups.length <= MAX_ANOVA_GROUPS
        && value[mode].groups.every(group => record(group) && text(group.label) && (mode === 'raw' ? text(group.raw) : ['mean', 'sd', 'n'].every(key => entry(group[key])))))
    && record(value.f) && ['F', 'df1', 'df2'].every(key => entry(value.f[key])) && [.1, .05, .01].includes(value.alpha) && typeof value.showComparisons === 'boolean'
    && JSON.stringify(value).length <= LIMIT;
const read = () => readStoredJson({ key: ONE_WAY_DRAFT_KEY, version: 1, fallback: null, validate: isOneWayDraft });
const save = value => JSON.stringify(value).length > LIMIT ? 'too-large' : isOneWayDraft(value) && writeStoredJson({ key: ONE_WAY_DRAFT_KEY, version: 1, value }) ? 'saved' : 'unsaved';
const remove = () => { try { globalThis.localStorage.removeItem(ONE_WAY_DRAFT_KEY); return true; } catch { return false; } };
export const oneWayDraftStorage = { analysisId: 'one_way_anova', create: createOneWayDraft, read, save, remove };
