import { getDatasetColumn, isMissingValue, parseNumericValue } from './datasetImport.js';

export const reviewDatasetRows = (dataset, roles) => {
    if (!dataset || !roles.length || new Set(roles.map(role => role.id)).size !== roles.length) return null;
    const columns = roles.map(role => ({ ...role, column: getDatasetColumn(dataset, role.id) }));
    if (columns.some(({ column, type }) => !column || (type === 'numeric'
        ? column.summary?.detectedType !== 'numeric'
        : !['categorical', 'text'].includes(column.summary?.detectedType)))) return null;
    const rows = dataset.rows || [];
    const excluded = [];
    let dropped = 0;
    rows.forEach((row, index) => {
        const reasons = columns.flatMap(({ id, column, type }) => {
            const value = row?.[id];
            const reason = isMissingValue(value) ? 'Missing value'
                : type === 'numeric' && parseNumericValue(value) === null ? 'Not a finite number' : null;
            return reason ? [{ variable: column.label || column.name || id, reason }] : [];
        });
        if (!reasons.length) return;
        dropped += 1;
        if (excluded.length < 100) excluded.push({ row: index + 1, reasons });
    });
    return { total: rows.length, usable: rows.length - dropped, dropped, excluded };
};

// Model requirements (for example, a minimum group size) are separate from missing-row exclusions.
export const withDatasetRowReview = (buildSetup, getRoles) => (dataset, selection) => {
    const rowReview = reviewDatasetRows(dataset, getRoles(selection));
    const setup = buildSetup(dataset, selection);
    if (!rowReview) return {
        ...setup, ok: false, seed: undefined, rowReview: null,
        errors: setup.errors.length ? setup.errors : ['Choose available variables of the required types, with a different variable for each role.'],
        usableRows: 0, droppedRows: 0, totalRows: dataset?.rows?.length || 0,
    };
    return { ...setup, rowReview, usableRows: rowReview.usable, totalRows: rowReview.total, droppedRows: rowReview.dropped };
};
