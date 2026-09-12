import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const result = await build({ root, logLevel: 'warn', build: { write: false } });
const chunks = result.output.filter(item => item.type === 'chunk');
const byName = new Map(chunks.map(chunk => [chunk.fileName, chunk]));

const staticClosure = entries => {
    const visited = new Set();
    const visit = chunk => {
        if (!chunk || visited.has(chunk)) return;
        visited.add(chunk);
        chunk.imports.forEach(name => visit(byName.get(name)));
    };
    entries.forEach(visit);
    return [...visited];
};
const containsModule = (group, fragment) => group.some(chunk =>
    Object.keys(chunk.modules).some(id => id.replaceAll('\\', '/').includes(fragment))
);
const sizes = group => ({
    bytes: group.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0),
    gzipBytes: group.reduce((sum, chunk) => sum + gzipSync(chunk.code).length, 0),
});

const initial = staticClosure(chunks.filter(chunk => chunk.isEntry));
assert(initial.length > 0, 'The build must contain an entry chunk.');
assert(!containsModule(initial, '/power/solvers/'), 'Power solvers must stay outside the startup dependency graph.');
assert(!containsModule(initial, '/node_modules/xlsx/'), 'Excel support must stay outside the startup dependency graph.');
// Allows modest growth above the measured 129 kB, while catching the old eager graph.
assert(sizes(initial).gzipBytes <= 140_000, 'Initial JavaScript exceeds the 140 kB gzip budget.');

const dataManager = chunks.find(chunk => chunk.facadeModuleId?.replaceAll('\\', '/').endsWith('/DataManagerPage.jsx'));
assert(dataManager, 'Data Manager must remain a lazy entry.');
const csvWorkspace = staticClosure([dataManager]);
assert(!containsModule(csvWorkspace, '/node_modules/xlsx/'), 'CSV-only Data Manager must not load SheetJS.');
assert(chunks.some(chunk => Object.keys(chunk.modules).some(id => id.replaceAll('\\', '/').endsWith('/utils/excelWorkbook.js'))), 'Excel support must remain available on demand.');

console.log('Bundle dependency checks passed. Sizes are JavaScript only; gzip assumes each chunk is compressed separately.');
console.log(JSON.stringify({ initial: sizes(initial), dataManager: sizes(csvWorkspace) }, null, 2));
