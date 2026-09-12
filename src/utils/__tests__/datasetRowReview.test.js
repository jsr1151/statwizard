import { expect, it } from 'vitest';
import {
    buildOneSampleTTestDatasetSetup, buildIndependentTTestDatasetSetup, buildPairedTTestDatasetSetup,
    buildOneWayAnovaDatasetSetup, buildAncovaDatasetSetup, buildFactorialAnovaDatasetSetup,
} from '../analysisDatasetAdapters.js';

const study = () => ({
    id: 'study', name: 'Study', rowCount: 10,
    columns: ['outcome', 'first', 'second', 'covariate', 'group', 'factor'].map(id => ({
        id, label: id, summary: { detectedType: ['group', 'factor'].includes(id) ? 'categorical' : 'numeric' },
    })),
    rows: [
        ...Array.from({ length: 8 }, (_, i) => ({ outcome: i + 3, first: i + 1, second: i + 2, covariate: i * 2 + 1, group: i < 4 ? 'A' : 'B', factor: i % 4 < 2 ? 'X' : 'Y' })),
        { outcome: null, first: null, second: null, covariate: null, group: null, factor: null },
        { outcome: 'bad', first: 'bad', second: 12, covariate: 'bad', group: 'A', factor: 'X' },
    ],
});
const setups = [
    ['one sample', buildOneSampleTTestDatasetSetup, { outcomeColumnId: 'outcome' }],
    ['independent', buildIndependentTTestDatasetSetup, { outcomeColumnId: 'outcome', groupingColumnId: 'group' }],
    ['paired', buildPairedTTestDatasetSetup, { firstColumnId: 'first', secondColumnId: 'second' }],
    ['one way', buildOneWayAnovaDatasetSetup, { outcomeColumnId: 'outcome', groupingColumnId: 'group' }],
    ['ANCOVA', buildAncovaDatasetSetup, { outcomeColumnId: 'outcome', groupingColumnId: 'group', covariateColumnId: 'covariate' }],
    ['factorial', buildFactorialAnovaDatasetSetup, { outcomeColumnId: 'outcome', factorAColumnId: 'group', factorBColumnId: 'factor' }],
];

it.each(setups)('%s reports row exclusions that agree with the initialized sample', (_, build, roles) => {
    const result = build(study(), roles);
    expect(result.ok).toBe(true);
    expect(result).toMatchObject({ usableRows: 8, totalRows: 10, droppedRows: 2 });
    expect(result.rowReview.excluded.map(row => row.row)).toEqual([9, 10]);
    expect(result.rowReview.excluded[0].reasons.every(item => item.reason === 'Missing value')).toBe(true);
    expect(result.rowReview.excluded[1].reasons.every(item => item.reason === 'Not a finite number')).toBe(true);
    if (result.seed.n) expect(result.seed.n).toBe(8);
    if (result.seed.groups) expect(result.seed.groups.reduce((sum, group) => sum + (group.values?.length ?? group.xRaw.split('\n').length), 0)).toBe(8);
    if (result.seed.cellData) expect(Object.values(result.seed.cellData).reduce((sum, cell) => sum + cell.values.length, 0)).toBe(8);
    if (result.seed.group1) expect(result.seed.group1.raw.split(', ').length + (result.seed.group1.n ? result.seed.group2.raw.split(', ').length : 0)).toBe(8);
});

it.each(setups)('%s does not call every row excluded when a variable is missing or stale', (_, build, roles) => {
    for (const id of ['', 'deleted-column']) {
        const result = build(study(), { ...roles, [Object.keys(roles)[0]]: id });
        expect(result.ok).toBe(false); expect(result.seed).toBeUndefined(); expect(result.rowReview).toBeNull();
        expect(result.droppedRows).toBe(0);
    }
});

it('keeps complete-row counts separate from insufficient ANCOVA group sizes', () => {
    const dataset = study(); dataset.rows = dataset.rows.filter((_, i) => i < 4 || i === 4 || i >= 8);
    const result = buildAncovaDatasetSetup(dataset, setups[4][2]);
    expect(result.ok).toBe(false); expect(result.errors.join(' ')).toContain('at least 2 usable rows');
    expect(result).toMatchObject({ usableRows: 5, totalRows: 7, droppedRows: 2 });
    expect(result.rowReview.excluded.map(row => row.row)).toEqual([6, 7]);
});

it('counts all excluded rows while limiting the displayed details to 100', () => {
    const dataset = study(); dataset.rows = [...dataset.rows.slice(0, 8), ...Array.from({ length: 150 }, () => ({ outcome: null }))];
    const result = buildOneSampleTTestDatasetSetup(dataset, { outcomeColumnId: 'outcome' });
    expect(result.rowReview).toMatchObject({ total: 158, usable: 8, dropped: 150 });
    expect(result.rowReview.excluded).toHaveLength(100); expect(result.rowReview.excluded.at(-1).row).toBe(108);
});

it('reports no usable rows without hiding the actual exclusions', () => {
    const dataset = study(); dataset.rows = [{ outcome: null }, { outcome: 'bad' }];
    const result = buildOneSampleTTestDatasetSetup(dataset, { outcomeColumnId: 'outcome' });
    expect(result.ok).toBe(false); expect(result.rowReview).toMatchObject({ total: 2, usable: 0, dropped: 2 });
});
