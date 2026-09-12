export const summarizeAnalysisRows = (columns, total) => {
    if (!columns.length || columns.some(column => !column)) return null;
    const excluded = [];
    let dropped = 0;
    for (let index = 0; index < total; index += 1) {
        const variables = columns.filter(column => !Number.isFinite(column.numericValues?.[index])).map(column => column.label || column.name);
        if (variables.length) {
            dropped += 1;
            if (excluded.length < 100) excluded.push({ row: index + 1, variables });
        }
    }
    return { total, usable: total - dropped, dropped, excluded };
};
