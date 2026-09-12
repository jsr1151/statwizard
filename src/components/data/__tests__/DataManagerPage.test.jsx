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
    // jsdom does not implement the native dialog methods; browser checks cover focus and scrolling.
    Object.defineProperties(HTMLDialogElement.prototype, {
        showModal: { configurable: true, value() { this.setAttribute('open', ''); } },
        close: { configurable: true, value() { this.removeAttribute('open'); } },
    });
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
    delete HTMLDialogElement.prototype.showModal;
    delete HTMLDialogElement.prototype.close;
});
const button = (text, scope = container) => [...scope.querySelectorAll('button')].find(node => node.textContent.trim() === text);
const click = async (text, scope) => act(async () => button(text, scope).click());
const field = (text, scope = container) => [...scope.querySelectorAll('label')].find(node => node.textContent.includes(text))?.querySelector('input,select');
const change = async (node, value) => act(async () => {
    const prototype = node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, String(value));
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
});
const upload = async (file = { name: 'Pairs.csv', text: async () => csv }) => {
    const input = container.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await vi.dynamicImportSettled();
    });
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

it('keeps an unsaved workspace and undo history when leaving and returning to the page', async () => {
    await mount();
    await upload();
    const name = [...container.querySelectorAll('input')].find(node => node.value === 'Pairs');
    await change(name, 'Draft name');
    await act(async () => container.querySelector('input[type="radio"]').click());
    await click('Add Derived Variable');
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    await act(async () => root.render(<DatasetLibraryProvider><div>Another module</div></DatasetLibraryProvider>));
    await act(async () => render());
    expect([...container.querySelectorAll('input')].some(node => node.value === 'Draft name')).toBe(true);
    expect(container.textContent).toContain('Unsaved edits');
    expect(button('Undo').disabled).toBe(false);
    await click('Save Dataset');
    const afterSave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterSave);
    expect(afterSave.defaultPrevented).toBe(false);
});

it('cancels replacement and preserves unsaved data when saving fails', async () => {
    await mount();
    await upload();
    await click('New Workspace');
    expect(container.querySelector('dialog').textContent).toContain('Save your workspace first?');
    await click('Cancel');
    expect(container.querySelector('table')).not.toBeNull();
    await click('New Workspace');
    persistDatasetRecord.mockRejectedValueOnce(new Error('Storage unavailable'));
    await click('Save and continue');
    expect(container.querySelector('dialog [role="alert"]').textContent).toContain('Saving failed');
    expect(container.querySelector('table')).not.toBeNull();
    await click('Save and continue');
    expect(container.querySelector('dialog')).toBeNull();
    expect(container.querySelector('table')).toBeNull();
    expect(saved().rowCount).toBe(5);
});

it('requires an explicit choice before importing over an unsaved workspace', async () => {
    await mount();
    await upload();
    await upload({ name: 'Replacement.csv', text: async () => 'A,B\n20,30\n40,50' });
    await click('Cancel');
    expect(container.textContent).toContain('Pairs.csv');
    await upload({ name: 'Replacement.csv', text: async () => 'A,B\n20,30\n40,50' });
    await click('Discard changes');
    expect(container.textContent).toContain('Prepared Replacement with 2 rows and 2 variables');
    expect(container.querySelector('input[type="file"]').className).toBe('sr-only');
});

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

it('names the analysis dialog and dismisses it through cancel and Close', async () => {
    await mount();
    await upload();
    await click('Use in Analysis');
    const dialog = container.querySelector('dialog');
    expect(dialog.open).toBe(true);
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toContain('Choose analysis for Pairs');
    await act(async () => dialog.dispatchEvent(new Event('cancel', { bubbles: false })));
    expect(container.querySelector('dialog')).toBeNull();
    await click('Use in Analysis');
    await click('Close');
    expect(container.querySelector('dialog')).toBeNull();
    expect(container.querySelector('[aria-label="Dataset name"]').value).toBe('Pairs');
});

it('preserves category mappings across builder modes and overwrites only the selected variable', async () => {
    await mount();
    await upload();
    await click('Recode categories');
    await chooseSource('Group');
    const mapping = [...container.querySelectorAll('input')].find(node => node.value === 'A');
    await change(mapping, 'Combined');
    await click('Mean-center');
    await click('Recode categories');
    expect([...container.querySelectorAll('input')].some(node => node.value === 'Combined')).toBe(true);
    await act(async () => field('Overwrite the existing variable').click());
    expect(field('Output label').disabled).toBe(true);
    await click('Apply Category Mapping');
    await click('Save Dataset');
    expect(saved().columnCount).toBe(3);
    expect(values(saved(), 'Group')).toEqual(['Combined', 'B', 'Combined', 'B', 'Combined']);
    expect(values(saved(), 'X').map(Number)).toEqual([1, 2, 3, 4, 5]);
});

it('filters source variables and limits a difference to exactly two selections', async () => {
    await mount();
    await upload({ name: 'Three.csv', text: async () => 'X,Y,Z\n1,3,9\n2,5,8\n3,8,7' });
    await change(field('Transformation'), 'difference');
    await change(field('Source search'), 'no match');
    expect(container.textContent).toContain('No variables match this search yet');
    await change(field('Source search'), '');
    const choices = () => container.querySelector('section').querySelectorAll('input[type="checkbox"]');
    await act(async () => choices()[0].click());
    await act(async () => choices()[1].click());
    expect(choices()[2].disabled).toBe(true);
    await change(field('New variable label'), 'Difference');
    await click('Add Derived Variable');
    await click('Save Dataset');
    expect(values(saved(), 'Difference').map(Number)).toEqual([-2, -3, -5]);
});

const groupedCsv = 'ID,Stress1,Stress2,Extra\nA,1,5,2\nB,2,4,3\nC,3,3,4';
const recommendations = () => [...container.querySelectorAll('section')].find(node => node.textContent.includes('Suggested grouped transforms'));

it('validates grouped selections and averages the edited group', async () => {
    await mount();
    await upload({ name: 'Scale.csv', text: async () => groupedCsv });
    await click('Stress2 x', recommendations());
    await click('Average', recommendations());
    expect(container.textContent).toContain('Select at least two variables before creating an average');
    const add = field('Add variable to this group', recommendations());
    await change(add, [...add.options].find(option => option.textContent === 'Extra').value);
    await click('Average', recommendations());
    await click('Save Dataset');
    expect(values(saved(), 'Stress Average').map(Number)).toEqual([1.5, 2.5, 3.5]);
});

it('reverse-codes selected group items before averaging and can undo the whole operation', async () => {
    await mount();
    await upload({ name: 'Scale.csv', text: async () => groupedCsv });
    await click('Reverse + Average', recommendations());
    expect(container.textContent).toContain('Choose at least one item to reverse code');
    await click('Stress2', recommendations());
    await change(field('Minimum', recommendations()), 1);
    await change(field('Maximum', recommendations()), 5);
    await click('Reverse + Average', recommendations());
    await click('Save Dataset');
    expect(values(saved(), 'Stress Scale Score').map(Number)).toEqual([1, 2, 3]);
    expect(values(saved(), 'Stress2 (RC)').map(Number)).toEqual([1, 2, 3]);
    await click('Undo');
    await click('Save Updates');
    expect(saved().columnCount).toBe(4);
});

const repeatedCsv = 'ID,Stress T1,Stress T2,Calm T1,Calm T2\nA,1,5,2,4\nB,2,4,3,5\nC,3,3,4,2';

it('reshapes multiple measures with renamed grouping values and stable identifiers', async () => {
    await mount();
    await upload({ name: 'Repeated.csv', text: async () => repeatedCsv });
    expect(field('Allow multiple long columns').checked).toBe(true);
    await change(field('New grouping column name'), 'Visit');
    const overrides = [...container.querySelectorAll('input')].filter(node => node.placeholder.startsWith('Keep '));
    await change(overrides[0], 'Before');
    await change(overrides[1], 'After');
    await click('Reshape to Long');
    await click('Save Dataset');
    expect(saved().rowCount).toBe(6);
    expect(values(saved(), 'ID')).toEqual(['A', 'A', 'B', 'B', 'C', 'C']);
    expect(values(saved(), 'Visit')).toEqual(['Before', 'After', 'Before', 'After', 'Before', 'After']);
    expect(values(saved(), 'Stress').map(Number)).toEqual([1, 5, 2, 4, 3, 3]);
    expect(values(saved(), 'Calm').map(Number)).toEqual([2, 4, 3, 5, 4, 2]);
});

it('selects one reshape measure when multiple long columns are disabled', async () => {
    await mount();
    await upload({ name: 'Repeated.csv', text: async () => repeatedCsv });
    await act(async () => field('Allow multiple long columns').click());
    const reshape = [...container.querySelectorAll('section')].find(node => node.textContent.includes('Wide to long'));
    const choices = [...reshape.querySelectorAll('input[type="radio"]')];
    expect(choices).toHaveLength(2);
    await act(async () => choices[1].click());
    const selected = choices[1].closest('label').textContent;
    await click('Reshape to Long');
    await click('Save Dataset');
    const labels = saved().columns.map(column => column.label);
    expect(saved().rowCount).toBe(6);
    expect(labels).toContain(selected.includes('Stress') ? 'Stress' : 'Calm');
    expect(labels).not.toContain(selected.includes('Stress') ? 'Calm' : 'Stress');
});
