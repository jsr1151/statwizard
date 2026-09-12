import { readStoredJson, writeStoredJson } from './storage.js';

export const PEARSON_DRAFT_KEY = 'statwizard.calculator-draft.pearson-correlation';
const LIMIT = 250000;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= LIMIT;
const roles = value => record(value) && text(value.x) && text(value.y);

export const createPearsonDraft = (example, launch) => ({
    tableText: example, tableSource: 'Example data', mode: launch ? 'saved' : 'paste',
    selectedDatasetId: launch?.datasetId || '', pastedRoles: null,
    savedRoles: launch ? { [launch.datasetId]: { x: launch.x || '', y: launch.y || '' } } : {},
    tails: 2, direction: 'greater', confidenceLevel: 0.95, rho0: 0, showLine: true, showBand: false,
});

export const isPearsonDraft = value => record(value)
    && text(value.tableText) && text(value.tableSource) && text(value.selectedDatasetId)
    && ['paste', 'saved'].includes(value.mode) && (value.pastedRoles === null || roles(value.pastedRoles))
    && record(value.savedRoles) && Object.values(value.savedRoles).every(roles)
    && [1, 2].includes(value.tails) && ['greater', 'less'].includes(value.direction)
    && [0.9, 0.95, 0.99].includes(value.confidenceLevel)
    && (text(value.rho0) || (typeof value.rho0 === 'number' && Number.isFinite(value.rho0)))
    && typeof value.showLine === 'boolean' && typeof value.showBand === 'boolean'
    && JSON.stringify(value).length <= LIMIT;

const read = () => readStoredJson({ key: PEARSON_DRAFT_KEY, version: 1, fallback: null, validate: isPearsonDraft });
const save = value => {
    if (JSON.stringify(value).length > LIMIT) return 'too-large';
    return isPearsonDraft(value) && writeStoredJson({ key: PEARSON_DRAFT_KEY, version: 1, value }) ? 'saved' : 'unsaved';
};
const remove = () => {
    try { globalThis.localStorage.removeItem(PEARSON_DRAFT_KEY); return true; }
    catch { return false; }
};
export const pearsonDraftStorage = { analysisId: 'pearson_correlation', create: createPearsonDraft, read, save, remove };
export const defaultPearsonRoles = keys => ({ x: keys[0] || '', y: keys[1] || '' });
