import { parseDelimitedTextGrid } from './datasetImport.js';

const absent = value => value == null || /^(?:|na|n\/a|null|\.)$/i.test(String(value).trim());

export function prepareRepeatedLong(rows) {
    const subjects = new Map(), conditions = [];
    if (rows.length > 120000) return { error: 'Use at most 120,000 long-format rows.' };
    for (const [index, row] of rows.entries()) {
        if (absent(row.id) || absent(row.condition)) return { error: `Row ${index + 1}: participant ID and condition label are required, even when the measurement is missing.` };
        const id = String(row.id).trim(), condition = String(row.condition).trim();
        if (!conditions.includes(condition)) conditions.push(condition);
        if (conditions.length > 12 || subjects.size > 10000) return { error: 'This calculator supports at most 12 conditions and 10,000 participants.' };
        if (!subjects.has(id)) subjects.set(id, new Map());
        if (subjects.get(id).has(condition)) return { error: `Duplicate measurement for participant ${id}, condition ${condition}. Resolve duplicate trials before analysis; they are not averaged automatically.` };
        subjects.get(id).set(condition, row.value);
    }
    return { conditions, records: [...subjects].map(([id, cells]) => ({ id, values: conditions.map(condition => cells.has(condition) ? cells.get(condition) : null) })) };
}

export function parseRepeatedMeasuresText(text, format = 'wide') {
    const parsed = parseDelimitedTextGrid(text);
    if (!parsed.ok) return { error: parsed.errors?.[0] || 'Enter a delimited table with a header row.' };
    const [header, ...rows] = parsed.grid;
    if (!header || !rows.length || header.some(absent) || new Set(header.map(value => String(value).trim())).size !== header.length) return { error: 'Provide one header row with distinct column names, followed by measurements.' };
    if (format === 'long') {
        if (header.length !== 3 || rows.some(row => row.length !== 3)) return { error: 'Long format needs exactly three columns: participant ID, condition, and value. Use NA for missing measurements.' };
        return prepareRepeatedLong(rows.map(row => ({ id: row[0], condition: row[1], value: row[2] })));
    }
    if (rows.some(row => row.length !== header.length)) return { error: 'Every wide-format row must have an ID and one cell per condition. Preserve missing cells with NA.' };
    return { conditions: header.slice(1).map(value => String(value).trim()), records: rows.map(row => ({ id: row[0], values: row.slice(1) })) };
}

export function prepareRepeatedDataset(dataset, selection, format) {
    if (!dataset) return { error: 'Choose a saved dataset.' };
    const valid = id => dataset.columns.some(column => column.id === id);
    if (!valid(selection.subject)) return { error: 'Choose the participant ID variable.' };
    if (format === 'long') {
        if (!valid(selection.condition) || !valid(selection.outcome) || new Set([selection.subject, selection.condition, selection.outcome]).size !== 3) return { error: 'Choose three different variables for participant, condition, and measurement.' };
        return prepareRepeatedLong(dataset.rows.map(row => ({ id: row[selection.subject], condition: row[selection.condition], value: row[selection.outcome] })));
    }
    const selected = selection.conditions || [];
    if (selected.length < 2 || new Set(selected).size !== selected.length || selected.includes(selection.subject) || selected.some(id => !valid(id))) return { error: 'Choose at least two distinct condition variables, excluding the participant ID.' };
    return {
        conditions: selected.map(id => { const column = dataset.columns.find(item => item.id === id); return column.label || column.name; }),
        records: dataset.rows.map(row => ({ id: row[selection.subject], values: selected.map(id => row[id]) })),
    };
}
