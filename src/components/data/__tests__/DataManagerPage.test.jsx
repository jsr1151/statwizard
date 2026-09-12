// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import DataManagerPage from '../DataManagerPage.jsx';
import { DatasetLibraryProvider } from '../../../hooks/useDatasetLibrary.js';
import { loadStoredDatasets, persistDatasetRecord, removeDatasetRecord } from '../../../utils/datasetStore.js';
import { ANALYSIS_LAUNCH_SESSION_KEY } from '../../../utils/analysisLaunch.js';

vi.mock('../../../utils/datasetStore.js', () => ({
    loadStoredDatasets: vi.fn(async () => []),
    persistDatasetRecord: vi.fn(async dataset => dataset),
    removeDatasetRecord: vi.fn(async () => {}),
}));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let container;
let props;
const csv = 'X,Y,Group\n1,3,A\n2,5,B\n3,8,A\n4,8,B\n5,11,A';
const render = () => root.render(<DatasetLibraryProvider><DataManagerPage {...props} /></DatasetLibraryProvider>);
const mount = async () => {
    props = { darkMode: true, onOpenAnalysis: vi.fn() };
    container = document.createElement('main');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => render());
};
beforeEach(() => {
    vi.clearAllMocks();
    loadStoredDatasets.mockResolvedValue([]);
    persistDatasetRecord.mockImplementation(async dataset => dataset);
});
afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
    root = null;
    sessionStorage.clear();
    vi.restoreAllMocks();
});
const button = (text, scope = container) => [...scope.querySelectorAll('button')].find(node => node.textContent.trim() === text);
const click = async (text, scope) => act(async () => button(text, scope).click());
const field = text => [...container.querySelectorAll('label')].find(node => node.textContent.includes(text))?.querySelector('input,select');
const change = async (node, value) => act(async () => {
    const prototype = node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const upload = async (file = { name: 'Pairs.csv', text: async () => csv }) => {
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
};
const saved = () => persistDatasetRecord.mock.lastCall[0];
const values = (dataset, label) => {
    const column = dataset.columns.find(item => item.label === label);
    return dataset.rows.map(row => row[column.id]);
};
const chooseSource = async label => {
    const source = field('Source variable');
    await change(source, [...source.options].find(option => option.textContent === label).value);
};

it('handles empty and invalid imports, recovers with CSV, and rebuilds header selection', async () => {
    await mount();
    expect(container.textContent).toContain('No saved datasets yet');
    await upload({ name: 'empty.csv', text: async () => '' });
    expect(container.textContent).toContain('Something needs attention');
    await upload();
    expect(container.textContent).toContain('Prepared Pairs with 5 rows and 3 variables');
    await act(async () => field('First row is header').click());
    await click('Save Dataset');
    expect(saved().rowCount).toBe(6);
    await act(async () => field('First row is header').click());
    await click('Save Updates');
    expect(saved().rowCount).toBe(5);
    expect(values(saved(), 'X').map(Number)).toEqual([1, 2, 3, 4, 5]);
});

it('imports a real Excel workbook and switches sheets', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['A', 'B'], [1, 2], [2, 4]]), 'First');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['X', 'Y'], [3, 6], [4, 8], [5, 10]]), 'Second');
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    await mount();
    await upload({ name: 'Workbook.xlsx', arrayBuffer: async () => buffer });
    await change(field('Excel Sheet'), 'Second');
    await click('Save Dataset');
    expect(saved()).toMatchObject({ rowCount: 3, columnCount: 2, sheetName: 'Second', sourceType: 'xlsx' });
    expect(values(saved(), 'X').map(Number)).toEqual([3, 4, 5]);
});

it('saves, clears, reopens, and renames a dataset without changing its identity', async () => {
    await mount();
    await upload();
    await click('Save Dataset');
    const id = saved().id;
    await click('New Workspace');
    expect(container.querySelector('table')).toBeNull();
    await click('Open');
    const name = [...container.querySelectorAll('input')].find(node => node.value === 'Pairs');
    await change(name, 'Renamed pairs');
    props = { ...props, darkMode: false };
    await act(async () => render());
    expect(name.value).toBe('Renamed pairs');
    await click('Save Updates');
    expect(saved()).toMatchObject({ id, name: 'Renamed pairs', rowCount: 5 });
});

it('duplicates saved data and respects deletion cancellation', async () => {
    await mount();
    await upload();
    await click('Save Dataset');
    const originalId = saved().id;
    await click('Duplicate');
    expect(saved().id).not.toBe(originalId);
    expect(values(saved(), 'Y').map(Number)).toEqual([3, 5, 8, 8, 11]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await click('Delete');
    expect(removeDatasetRecord).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await click('Delete');
    expect(removeDatasetRecord).toHaveBeenCalledTimes(1);
});

it('creates a derived variable and restores the prior dataset with undo', async () => {
    await mount();
    await upload();
    await act(async () => container.querySelector('input[type="radio"]').click());
    await change(field('New variable label'), 'X copy');
    await click('Add Derived Variable');
    await click('Save Dataset');
    expect(saved().columnCount).toBe(4);
    expect(values(saved(), 'X copy').map(Number)).toEqual([1, 2, 3, 4, 5]);
    await click('Undo');
    await click('Save Updates');
    expect(saved().columnCount).toBe(3);
    expect(button('Undo').disabled).toBe(true);
});

it('centers a variable and handles keyboard undo without overriding input editing', async () => {
    await mount();
    await upload();
    await click('Mean-center');
    await chooseSource('X');
    await click('Create Centered Variable');
    await click('Save Dataset');
    expect(values(saved(), 'X_centered').map(Number)).toEqual([-2, -1, 0, 1, 2]);
    await act(async () => field('New variable label').dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })));
    expect(button('Undo').disabled).toBe(false);
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })));
    await click('Save Updates');
    expect(saved().columnCount).toBe(3);
});

it('reverse-codes values using the chosen bounds', async () => {
    await mount();
    await upload();
    await click('Reverse code');
    await chooseSource('X');
    await change(field('Minimum'), 1);
    await change(field('Maximum'), 5);
    await change(field('Output label'), 'Reversed X');
    await click('Apply Reverse Code');
    await click('Save Dataset');
    expect(values(saved(), 'Reversed X').map(Number)).toEqual([5, 4, 3, 2, 1]);
});

it('saves dirty data before launching a compatible analysis with variable roles', async () => {
    await mount();
    await upload();
    await click('Use in Analysis');
    const panel = [...container.querySelectorAll('h4')].find(node => node.textContent === 'Pearson Correlation').parentElement.parentElement.parentElement;
    await click('Open Calculator', panel);
    expect(persistDatasetRecord).toHaveBeenCalledTimes(1);
    expect(props.onOpenAnalysis).toHaveBeenCalledWith('pearson_correlation');
    const launch = JSON.parse(sessionStorage.getItem(ANALYSIS_LAUNCH_SESSION_KEY));
    expect(launch).toMatchObject({ datasetId: saved().id, analysisId: 'pearson_correlation', x: saved().columns[0].id, y: saved().columns[1].id });
});

it('keeps unsaved data available after a save failure', async () => {
    await mount();
    await upload();
    persistDatasetRecord.mockRejectedValueOnce(new Error('Storage unavailable'));
    await click('Save Dataset');
    expect(container.textContent).toContain('Storage unavailable');
    expect(container.textContent).toContain('Unsaved edits');
    await click('Save Dataset');
    expect(saved().rowCount).toBe(5);
    expect(container.textContent).toContain('was saved locally');
});
