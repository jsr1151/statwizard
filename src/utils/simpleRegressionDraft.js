import { readStoredJson, writeStoredJson } from './storage.js';

export const SIMPLE_REGRESSION_DRAFT_KEY = 'statwizard.calculator-draft.simple-regression';
export const REGRESSION_DRAFT_LIMIT = 250000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= REGRESSION_DRAFT_LIMIT;
const roles = value => record(value) && Object.keys(value).every(key => ['x', 'y'].includes(key) && text(value[key]));

export const createSimpleRegressionDraft = (example, launch) => ({
    tableText: example, tableSource: 'Example data',
    mode: launch ? 'saved' : 'paste', selectedDatasetId: launch?.datasetId || '',
    pastedRoles: {}, savedRoles: launch ? { [launch.datasetId]: { x: launch.x || '', y: launch.y || '' } } : {},
    confidenceLevel: 0.95, showLine: true, showBand: false, showPredictionBand: false, predictionX: null,
});

export const isSimpleRegressionDraft = value => record(value)
    && text(value.tableText) && text(value.tableSource) && text(value.selectedDatasetId)
    && ['paste', 'saved'].includes(value.mode) && roles(value.pastedRoles)
    && record(value.savedRoles) && Object.values(value.savedRoles).every(roles)
    && [0.9, 0.95, 0.99].includes(value.confidenceLevel)
    && ['showLine', 'showBand', 'showPredictionBand'].every(key => typeof value[key] === 'boolean')
    && (value.predictionX === null || text(value.predictionX) || (typeof value.predictionX === 'number' && Number.isFinite(value.predictionX)))
    && JSON.stringify(value).length <= REGRESSION_DRAFT_LIMIT;

export const readSimpleRegressionDraft = () => readStoredJson({
    key: SIMPLE_REGRESSION_DRAFT_KEY, version: 1, fallback: null, validate: isSimpleRegressionDraft,
});

export const saveSimpleRegressionDraft = value => {
    if (JSON.stringify(value).length > REGRESSION_DRAFT_LIMIT) return 'too-large';
    return isSimpleRegressionDraft(value) && writeStoredJson({ key: SIMPLE_REGRESSION_DRAFT_KEY, version: 1, value }) ? 'saved' : 'unsaved';
};

export const removeSimpleRegressionDraft = () => {
    try { globalThis.localStorage.removeItem(SIMPLE_REGRESSION_DRAFT_KEY); return true; }
    catch { return false; }
};
