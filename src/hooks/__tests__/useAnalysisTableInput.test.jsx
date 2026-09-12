// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import useAnalysisTableInput from '../useAnalysisTableInput.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let api, root, container;
const Harness = ({ mode }) => { api = useAnalysisTableInput('X,Y\n1,2', mode); return null; };
const render = async (mode = 'paste') => act(async () => root.render(<StrictMode><Harness mode={mode} /></StrictMode>));
const pendingFile = name => {
    let resolve, reject;
    const promise = new Promise((a, b) => { resolve = a; reject = b; });
    return { event: { target: { files: [{ name, text: () => promise }], value: 'file' } }, resolve, reject };
};
const upload = async file => act(async () => { void api.onUpload(file.event); });
beforeEach(async () => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); await render(); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

it('ignores a file that finishes after a newer table edit', async () => {
    const file = pendingFile('slow.csv'); await upload(file);
    await act(async () => api.setTableText('new table'));
    await act(async () => file.resolve('old file'));
    expect(api.tableText).toBe('new table'); expect(api.tableSource).toBe('Entered table');
});
it('uses the latest selected upload even when reads finish out of order', async () => {
    const first = pendingFile('first.csv'), second = pendingFile('second.csv');
    await upload(first); await upload(second);
    await act(async () => second.resolve('second table')); await act(async () => first.resolve('first table'));
    expect(api.tableText).toBe('second table'); expect(api.tableSource).toBe('Uploaded: second.csv');
});
it('keeps the current table on read failure and recovers by loading the example', async () => {
    await act(async () => api.setTableText('current table'));
    const file = pendingFile('bad.csv'); await upload(file); await act(async () => file.reject(new Error('read failed')));
    expect(api.tableText).toBe('current table'); expect(api.uploadError).toContain('current table is unchanged');
    await act(async () => api.loadExample()); expect(api.uploadError).toBe(''); expect(api.tableSource).toBe('Example data');
});
it('discards an in-flight upload when switching to saved data and back', async () => {
    const file = pendingFile('slow.csv'); await upload(file); await render('saved'); await render('paste');
    await act(async () => file.resolve('late table')); expect(api.tableText).toBe('X,Y\n1,2'); expect(api.uploadPending).toBe('');
});
