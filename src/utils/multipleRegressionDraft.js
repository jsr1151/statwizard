import { readStoredJson, writeStoredJson } from './storage.js';

export const MULTIPLE_REGRESSION_DRAFT_KEY = 'statwizard.calculator-draft.multiple-regression';
const LIMIT = 250000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= LIMIT;
const roles = value => record(value) && text(value.outcome) && Array.isArray(value.predictors)
    && value.predictors.every(text) && new Set(value.predictors).size === value.predictors.length;
const inputs = value => record(value) && Object.values(value).every(item => text(item) || (typeof item === 'number' && Number.isFinite(item)));

export const createMultipleRegressionDraft = (example, launch) => ({
    tableText: example, tableSource: 'Example data', mode: launch ? 'saved' : 'paste',
    selectedDatasetId: launch?.datasetId || '', pastedRoles: null,
    savedRoles: launch ? { [launch.datasetId]: { outcome: launch.outcome || '', predictors: launch.predictors || [] } } : {},
    confidenceLevel: 0.95, pastedPredictionInputs: {}, savedPredictionInputs: {},
});

export const isMultipleRegressionDraft = value => record(value)
    && text(value.tableText) && text(value.tableSource) && text(value.selectedDatasetId)
    && ['paste', 'saved'].includes(value.mode) && (value.pastedRoles === null || roles(value.pastedRoles))
    && record(value.savedRoles) && Object.values(value.savedRoles).every(roles)
    && typeof value.confidenceLevel === 'number' && value.confidenceLevel >= 0.8 && value.confidenceLevel < 1
    && inputs(value.pastedPredictionInputs) && record(value.savedPredictionInputs) && Object.values(value.savedPredictionInputs).every(inputs)
    && JSON.stringify(value).length <= LIMIT;

const read = () => readStoredJson({ key: MULTIPLE_REGRESSION_DRAFT_KEY, version: 1, fallback: null, validate: isMultipleRegressionDraft });
const save = value => {
    if (JSON.stringify(value).length > LIMIT) return 'too-large';
    return isMultipleRegressionDraft(value) && writeStoredJson({ key: MULTIPLE_REGRESSION_DRAFT_KEY, version: 1, value }) ? 'saved' : 'unsaved';
};
const remove = () => {
    try { globalThis.localStorage.removeItem(MULTIPLE_REGRESSION_DRAFT_KEY); return true; }
    catch { return false; }
};
export const multipleRegressionDraftStorage = { analysisId: 'multiple_regression', create: createMultipleRegressionDraft, read, save, remove };

export const defaultMultipleRegressionRoles = keys => ({ outcome: keys.at(-1) || '', predictors: keys.slice(0, -1).slice(0, 3) });
