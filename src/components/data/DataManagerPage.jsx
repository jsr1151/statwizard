import React, { useMemo, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Copy,
    Database,
    FileUp,
    FlaskConical,
    Layers3,
    Save,
    Table2,
    Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDatasetLibraryContext } from '../../hooks/useDatasetLibrary.js';
import {
    addDerivedVariableToDataset,
    autoDetectHeaderRow,
    buildDatasetFromGrid,
    formatDatasetValue,
    getDatasetColumnValues,
    hydrateStoredDataset,
    isMissingValue,
    parseDelimitedTextGrid,
    refreshDatasetMetadata,
    renameDatasetRecord,
} from '../../utils/datasetImport.js';

const ACTIVE_DATASET_SESSION_KEY = 'statwizard_active_dataset_id';

const DERIVED_OPERATION_OPTIONS = [
    { id: 'duplicate', label: 'Duplicate variable', needsNumeric: false, mode: 'single' },
    { id: 'sum', label: 'Sum selected variables', needsNumeric: true, mode: 'multi' },
    { id: 'mean', label: 'Mean of selected variables', needsNumeric: true, mode: 'multi' },
    { id: 'difference', label: 'Difference (A - B)', needsNumeric: true, mode: 'pair' },
    { id: 'add', label: 'Add (A + B)', needsNumeric: true, mode: 'pair' },
    { id: 'standardize', label: 'Standardize to z-score', needsNumeric: true, mode: 'single' },
    { id: 'center', label: 'Mean-center variable', needsNumeric: true, mode: 'single' },
    { id: 'recode', label: 'Recode / combine categories', needsNumeric: false, mode: 'single' },
];

const buildDefaultDerivedDraft = () => ({
    operation: 'duplicate',
    columns: [],
    outputLabel: '',
    mappings: {},
});

const stripExtension = (fileName = '') =>
    String(fileName).replace(/\.[^/.]+$/, '').trim() || 'Imported Dataset';

const formatTimestamp = (value) => {
    const parsed = new Date(value);

    if (!Number.isFinite(parsed.getTime())) {
        return 'Just now';
    }

    return parsed.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const Card = ({ darkMode, children, className = '' }) => (
    <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${className}`}>
        {children}
    </div>
);

const TonePill = ({ darkMode, children, tone = 'default' }) => {
    const toneClass = tone === 'warning'
        ? (darkMode ? 'bg-amber-500/10 text-amber-200 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200')
        : tone === 'primary'
            ? (darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
            : (darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200');

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}>
            {children}
        </span>
    );
};

const InfoRow = ({ darkMode, label, value }) => (
    <div className={`rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {label}
        </div>
        <div className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {value}
        </div>
    </div>
);

const DataManagerPage = ({ darkMode, onOpenMultipleRegression }) => {
    const {
        datasets,
        isLoading,
        error,
        saveDataset,
        deleteDataset,
        duplicateDataset,
    } = useDatasetLibraryContext();
    const [editorDataset, setEditorDataset] = useState(null);
    const [importSession, setImportSession] = useState(null);
    const [derivedDraft, setDerivedDraft] = useState(buildDefaultDerivedDraft);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [problem, setProblem] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    const activeOperation = useMemo(
        () => DERIVED_OPERATION_OPTIONS.find((option) => option.id === derivedDraft.operation) || DERIVED_OPERATION_OPTIONS[0],
        [derivedDraft.operation]
    );

    const savedDatasetIds = useMemo(() => new Set(datasets.map((dataset) => dataset.id)), [datasets]);
    const editorIsSaved = Boolean(editorDataset && savedDatasetIds.has(editorDataset.id));
    const numericColumns = useMemo(
        () => (editorDataset?.columns || []).filter((column) => column.summary?.detectedType === 'numeric'),
        [editorDataset]
    );
    const recodeLevels = useMemo(() => {
        if (!editorDataset || derivedDraft.operation !== 'recode' || !derivedDraft.columns[0]) {
            return [];
        }

        return [...new Set(
            getDatasetColumnValues(editorDataset, derivedDraft.columns[0])
                .filter((value) => !isMissingValue(value))
                .map((value) => String(value))
        )];
    }, [derivedDraft.columns, derivedDraft.operation, editorDataset]);
    const previewRows = useMemo(
        () => (editorDataset?.rows || []).slice(0, 24),
        [editorDataset]
    );

    const setFeedback = ({ nextNotice = '', nextProblem = '' }) => {
        setNotice(nextNotice);
        setProblem(nextProblem);
    };

    const rebuildEditorFromSession = (session, previousDataset = null) => {
        const activeSheet = session?.sheets?.find((sheet) => sheet.name === session.selectedSheetName) || session?.sheets?.[0];

        if (!activeSheet) {
            setProblem('This file did not contain any readable sheets or rows.');
            return;
        }

        const nextDataset = buildDatasetFromGrid({
            grid: activeSheet.grid,
            datasetId: previousDataset?.id,
            datasetName: session.datasetName,
            sourceType: session.sourceType,
            originalFileName: session.originalFileName,
            fileType: session.fileType,
            sheetName: session.sourceType === 'xlsx' ? activeSheet.name : null,
            delimiter: session.delimiter || null,
            hasHeaderRow: session.hasHeaderRow,
            createdAt: previousDataset?.createdAt,
        });

        setEditorDataset(nextDataset);
        setIsDirty(true);
        setFeedback({
            nextNotice: `Prepared ${nextDataset.name} with ${nextDataset.rowCount} rows and ${nextDataset.columnCount} variables.`,
            nextProblem: '',
        });
    };

    const handleFileImport = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const lowerName = file.name.toLowerCase();

            if (lowerName.endsWith('.xlsx')) {
                const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
                const sheets = workbook.SheetNames.map((sheetName) => ({
                    name: sheetName,
                    grid: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                        header: 1,
                        raw: false,
                        defval: null,
                    }),
                })).filter((sheet) => sheet.grid.some((row) => row.some((value) => !isMissingValue(value))));

                if (!sheets.length) {
                    throw new Error('The Excel workbook did not contain any readable rows.');
                }

                const initialSheet = sheets[0];
                const session = {
                    datasetName: stripExtension(file.name),
                    sourceType: 'xlsx',
                    fileType: 'XLSX',
                    originalFileName: file.name,
                    sheets,
                    selectedSheetName: initialSheet.name,
                    hasHeaderRow: autoDetectHeaderRow(initialSheet.grid[0] || []),
                    delimiter: null,
                };

                setImportSession(session);
                rebuildEditorFromSession(session);
            } else {
                const parsed = parseDelimitedTextGrid(await file.text());

                if (!parsed.ok) {
                    throw new Error(parsed.errors?.[0] || 'The file could not be parsed as CSV-style text.');
                }

                const session = {
                    datasetName: stripExtension(file.name),
                    sourceType: lowerName.endsWith('.tsv') ? 'tsv' : 'csv',
                    fileType: lowerName.endsWith('.tsv') ? 'TSV' : 'CSV',
                    originalFileName: file.name,
                    sheets: [{ name: 'Imported Table', grid: parsed.grid }],
                    selectedSheetName: 'Imported Table',
                    hasHeaderRow: parsed.suggestedHeader,
                    delimiter: parsed.delimiter,
                };

                setImportSession(session);
                rebuildEditorFromSession(session);
            }
        } catch (importError) {
            setProblem(importError instanceof Error ? importError.message : 'Import failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleSaveDataset = async () => {
        if (!editorDataset) {
            return;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const saved = await saveDataset(editorDataset);
            setEditorDataset(saved);
            setIsDirty(false);
            setNotice(`${saved.name} was saved locally and is ready across sessions.`);
        } catch (saveError) {
            setProblem(saveError instanceof Error ? saveError.message : 'Could not save the dataset.');
        } finally {
            setBusy(false);
        }
    };

    const handleOpenSavedDataset = (dataset) => {
        setEditorDataset(hydrateStoredDataset(dataset));
        setImportSession(null);
        setDerivedDraft(buildDefaultDerivedDraft());
        setIsDirty(false);
        setFeedback({
            nextNotice: `Opened ${dataset.name}. Adjust labels, derive variables, then save your updates.`,
            nextProblem: '',
        });
    };

    const handleDeleteDataset = async (dataset) => {
        if (!window.confirm(`Delete ${dataset.name}? This removes the saved dataset from local storage.`)) {
            return;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            await deleteDataset(dataset.id);

            if (editorDataset?.id === dataset.id) {
                setEditorDataset(null);
                setImportSession(null);
                setDerivedDraft(buildDefaultDerivedDraft());
                setIsDirty(false);
            }

            setNotice(`${dataset.name} was removed from the local library.`);
        } catch (deleteError) {
            setProblem(deleteError instanceof Error ? deleteError.message : 'Could not delete the dataset.');
        } finally {
            setBusy(false);
        }
    };

    const handleDuplicateDataset = async (dataset) => {
        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const duplicated = await duplicateDataset(dataset);
            setEditorDataset(duplicated);
            setImportSession(null);
            setIsDirty(false);
            setNotice(`Created ${duplicated.name}.`);
        } catch (duplicateError) {
            setProblem(duplicateError instanceof Error ? duplicateError.message : 'Could not duplicate the dataset.');
        } finally {
            setBusy(false);
        }
    };

    const handleAnalyzeDataset = async (dataset) => {
        let targetDataset = dataset;

        if (editorDataset?.id === dataset.id && isDirty) {
            targetDataset = await saveDataset(editorDataset);
            setEditorDataset(targetDataset);
            setIsDirty(false);
        }

        window.sessionStorage.setItem(ACTIVE_DATASET_SESSION_KEY, targetDataset.id);
        onOpenMultipleRegression?.();
    };

    const updateEditorDataset = (updater) => {
        setEditorDataset((previous) => (typeof updater === 'function' ? updater(previous) : updater));
        setIsDirty(true);
    };

    const handleDatasetNameChange = (value) => {
        if (!editorDataset) {
            return;
        }

        updateEditorDataset((previous) => renameDatasetRecord(previous, value));

        if (importSession) {
            setImportSession((previous) => ({
                ...previous,
                datasetName: String(value ?? '').trim() || previous.datasetName,
            }));
        }
    };

    const handleColumnLabelChange = (columnId, value) => {
        updateEditorDataset((previous) => ({
            ...previous,
            columns: previous.columns.map((column) => (
                column.id === columnId
                    ? { ...column, label: value }
                    : column
            )),
        }));
    };

    const handleColumnLabelBlur = () => {
        setEditorDataset((previous) => refreshDatasetMetadata(previous));
    };

    const handleImportSessionChange = (patch) => {
        setImportSession((previous) => {
            const next = { ...previous, ...patch };
            rebuildEditorFromSession(next, editorDataset);
            return next;
        });
    };

    const toggleDerivedColumn = (columnId) => {
        setDerivedDraft((previous) => {
            const hasColumn = previous.columns.includes(columnId);

            return {
                ...previous,
                columns: hasColumn
                    ? previous.columns.filter((item) => item !== columnId)
                    : [...previous.columns, columnId],
            };
        });
    };

    const handleDerivedOperationChange = (operation) => {
        setDerivedDraft({
            operation,
            columns: [],
            outputLabel: '',
            mappings: {},
        });
    };

    const handleApplyDerivedVariable = () => {
        if (!editorDataset) {
            return;
        }

        const columns = derivedDraft.columns.filter(Boolean);

        if (!columns.length) {
            setProblem('Choose at least one source variable before creating a derived variable.');
            return;
        }

        if (activeOperation.mode === 'pair' && columns.length !== 2) {
            setProblem('This transformation needs exactly two source variables.');
            return;
        }

        if (activeOperation.mode === 'single' && columns.length !== 1) {
            setProblem('This transformation needs one source variable.');
            return;
        }

        if (activeOperation.mode === 'multi' && columns.length < 2) {
            setProblem('Select at least two variables for this transformation.');
            return;
        }

        const nextDataset = addDerivedVariableToDataset(editorDataset, {
            operation: derivedDraft.operation,
            columns,
            outputLabel: derivedDraft.outputLabel,
            mappings: derivedDraft.mappings,
        });

        setEditorDataset(nextDataset);
        setDerivedDraft(buildDefaultDerivedDraft());
        setIsDirty(true);
        setFeedback({
            nextNotice: 'Added a derived variable to the current dataset workspace.',
            nextProblem: '',
        });
    };

    const derivedOptions = activeOperation.needsNumeric ? numericColumns : (editorDataset?.columns || []);
    const infoTone = problem ? 'warning' : notice ? 'primary' : 'default';
    const infoMessage = problem || notice || 'Import a file or open a saved dataset to start preparing data.';

    return (
        <div className="space-y-8">
            <Card darkMode={darkMode}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Data Import / Data Manager
                        </div>
                        <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Prepare once, reuse everywhere
                        </h2>
                        <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Import CSV or Excel data, preview the structure, choose the right header and sheet, label variables cleanly, build a few high-value derived variables, then save the dataset locally for the statistical pages.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                            <FileUp size={16} />
                            Import CSV / Excel
                            <input
                                type="file"
                                accept=".csv,.tsv,.txt,.xlsx"
                                className="hidden"
                                onChange={handleFileImport}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() => {
                                setEditorDataset(null);
                                setImportSession(null);
                                setDerivedDraft(buildDefaultDerivedDraft());
                                setIsDirty(false);
                                setFeedback({
                                    nextNotice: 'Cleared the current workspace. Import a file or reopen a saved dataset to continue.',
                                    nextProblem: '',
                                });
                            }}
                            className={`rounded-xl border px-4 py-3 text-sm font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                        >
                            New Workspace
                        </button>
                    </div>
                </div>

                <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${infoTone === 'warning'
                    ? (darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700')
                    : infoTone === 'primary'
                        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                        : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')
                }`}>
                    {busy ? 'Working on your dataset...' : infoMessage}
                </div>
            </Card>

            <div className="grid gap-8 xl:grid-cols-12">
                <div className="xl:col-span-4 space-y-6">
                    <Card darkMode={darkMode}>
                        <div className="flex items-center gap-3 mb-4">
                            <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Dataset library
                            </h3>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Saved datasets persist between sessions. Open one to refine labels or add new derived variables, or jump straight into multiple regression.
                        </p>

                        <div className="mt-5 space-y-3">
                            {isLoading && (
                                <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    Loading saved datasets...
                                </div>
                            )}

                            {!isLoading && !datasets.length && (
                                <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    No saved datasets yet. Import a CSV or Excel file to start your local library.
                                </div>
                            )}

                            {!isLoading && datasets.map((dataset) => (
                                <div
                                    key={dataset.id}
                                    className={`rounded-2xl border p-4 transition-colors ${editorDataset?.id === dataset.id
                                        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200')
                                        : (darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dataset.name}</h4>
                                            <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                {dataset.originalFileName || 'Local dataset'} • {dataset.fileType}
                                                {dataset.sheetName ? ` • ${dataset.sheetName}` : ''}
                                            </p>
                                        </div>
                                        <TonePill darkMode={darkMode}>{dataset.rowCount} rows</TonePill>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {dataset.statusSummary.map((status) => (
                                            <TonePill
                                                key={`${dataset.id}-${status}`}
                                                darkMode={darkMode}
                                                tone={status === 'Missing data' || status === 'Type warnings' ? 'warning' : 'default'}
                                            >
                                                {status}
                                            </TonePill>
                                        ))}
                                    </div>

                                    <div className={`mt-3 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                        {dataset.columnCount} variables • Updated {formatTimestamp(dataset.updatedAt)}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenSavedDataset(dataset)}
                                            className={`rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-slate-200 hover:text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'}`}
                                        >
                                            Open
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDuplicateDataset(dataset)}
                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-slate-200 hover:text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'}`}
                                        >
                                            <Copy size={12} />
                                            Duplicate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAnalyzeDataset(dataset)}
                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            <ArrowRight size={12} />
                                            Regression
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDataset(dataset)}
                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 text-rose-300 hover:text-rose-200' : 'bg-white text-rose-600 hover:text-rose-700 border border-slate-200'}`}
                                        >
                                            <Trash2 size={12} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                {error}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="xl:col-span-8 space-y-6">
                    {!editorDataset ? (
                        <Card darkMode={darkMode}>
                            <div className="flex items-start gap-4">
                                <div className={`rounded-xl p-3 ${darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                    <Table2 size={20} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Import a dataset or open one from the library
                                    </h3>
                                    <p className={`mt-2 text-sm max-w-2xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        The workspace on this side becomes your inspection and preparation area. That is where you confirm headers, choose sheets, inspect missingness, rename display labels, and create derived variables before saving.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <>
                            <Card darkMode={darkMode}>
                                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="flex-1">
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Active workspace
                                        </div>
                                        <input
                                            value={editorDataset.name}
                                            onChange={(event) => handleDatasetNameChange(event.target.value)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-xl font-black outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                        />
                                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                            Source file: {editorDataset.originalFileName || 'Local dataset'}
                                            {editorDataset.sheetName ? ` • Sheet: ${editorDataset.sheetName}` : ''}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSaveDataset}
                                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            <Save size={16} />
                                            {editorIsSaved ? 'Save Updates' : 'Save Dataset'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDuplicateDataset(editorDataset)}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <Copy size={16} />
                                            Duplicate
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleAnalyzeDataset(editorDataset)}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'}`}
                                        >
                                            <ArrowRight size={16} />
                                            Use in Regression
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <InfoRow darkMode={darkMode} label="Rows" value={editorDataset.rowCount} />
                                    <InfoRow darkMode={darkMode} label="Variables" value={editorDataset.columnCount} />
                                    <InfoRow darkMode={darkMode} label="Source Type" value={editorDataset.fileType} />
                                    <InfoRow darkMode={darkMode} label="Last Updated" value={formatTimestamp(editorDataset.updatedAt)} />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {editorDataset.statusSummary.map((status) => (
                                        <TonePill
                                            key={`editor-status-${status}`}
                                            darkMode={darkMode}
                                            tone={status === 'Missing data' || status === 'Type warnings' ? 'warning' : 'default'}
                                        >
                                            {status}
                                        </TonePill>
                                    ))}
                                    {isDirty && <TonePill darkMode={darkMode} tone="primary">Unsaved edits</TonePill>}
                                </div>
                            </Card>

                            {importSession && (
                                <Card darkMode={darkMode}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Layers3 size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                        <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Import controls
                                        </h3>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        {importSession.sourceType === 'xlsx' && (
                                            <label className="block">
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Excel Sheet
                                                </span>
                                                <select
                                                    value={importSession.selectedSheetName}
                                                    onChange={(event) => handleImportSessionChange({ selectedSheetName: event.target.value })}
                                                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                >
                                                    {importSession.sheets.map((sheet) => (
                                                        <option key={sheet.name} value={sheet.name}>{sheet.name}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}

                                        <label className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                            <div>
                                                <div className="font-bold">First row is header</div>
                                                <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    Toggle if the preview rows or variable names look wrong.
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={importSession.hasHeaderRow}
                                                onChange={(event) => handleImportSessionChange({ hasHeaderRow: event.target.checked })}
                                            />
                                        </label>
                                    </div>
                                </Card>
                            )}

                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Table2 size={18} className={darkMode ? 'text-emerald-300' : 'text-emerald-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Data preview
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className={darkMode ? 'text-slate-500' : 'text-slate-500'}>
                                                <th className="sticky left-0 z-10 bg-inherit pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">Row</th>
                                                {editorDataset.columns.map((column) => (
                                                    <th key={`preview-head-${column.id}`} className="pb-3 pr-4 text-left text-[10px] font-black uppercase tracking-widest">
                                                        {column.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row, rowIndex) => (
                                                <tr key={`preview-row-${row.__rowId}`} className={`border-t ${darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                                                    <td className={`sticky left-0 bg-inherit py-2 pr-4 text-xs font-black ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{rowIndex + 1}</td>
                                                    {editorDataset.columns.map((column) => (
                                                        <td key={`${row.__rowId}-${column.id}`} className="max-w-[16rem] truncate py-2 pr-4">
                                                            {formatDatasetValue(row[column.id]) || '—'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <p className={`mt-4 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                    Showing the first {previewRows.length} rows. Statistical pages will use the full saved dataset.
                                </p>
                            </Card>

                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Database size={18} className={darkMode ? 'text-sky-300' : 'text-sky-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Variable inspection
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {editorDataset.columns.map((column) => (
                                        <div key={column.id} className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                                                <div>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        Display label
                                                    </div>
                                                    <input
                                                        value={column.label}
                                                        onChange={(event) => handleColumnLabelChange(column.id, event.target.value)}
                                                        onBlur={handleColumnLabelBlur}
                                                        className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                    />
                                                    <div className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                        Raw/original column: {column.originalName}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-start gap-2">
                                                    <TonePill darkMode={darkMode} tone={column.summary?.detectedType === 'numeric' ? 'primary' : 'default'}>
                                                        {column.summary?.detectedType || 'unknown'}
                                                    </TonePill>
                                                    {column.derived && <TonePill darkMode={darkMode}>Derived</TonePill>}
                                                    {(column.summary?.issues || []).map((issue) => (
                                                        <TonePill
                                                            key={`${column.id}-${issue}`}
                                                            darkMode={darkMode}
                                                            tone={issue === 'Missing data' || issue === 'Mostly missing' || issue === 'Non-numeric entries' ? 'warning' : 'default'}
                                                        >
                                                            {issue}
                                                        </TonePill>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                <InfoRow darkMode={darkMode} label="Missing" value={`${column.summary?.missingCount || 0} / ${editorDataset.rowCount}`} />
                                                <InfoRow darkMode={darkMode} label="Unique" value={column.summary?.uniqueCount || 0} />
                                                <InfoRow darkMode={darkMode} label="Non-missing" value={column.summary?.nonMissingCount || 0} />
                                                <InfoRow darkMode={darkMode} label="Numeric values" value={column.summary?.numericValidCount || 0} />
                                            </div>

                                            {column.summary?.detectedType === 'numeric' ? (
                                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                    <InfoRow darkMode={darkMode} label="Min" value={column.summary.numeric.min ?? '--'} />
                                                    <InfoRow darkMode={darkMode} label="Mean" value={column.summary.numeric.mean ?? '--'} />
                                                    <InfoRow darkMode={darkMode} label="Max" value={column.summary.numeric.max ?? '--'} />
                                                </div>
                                            ) : (
                                                <div className="mt-4">
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                        Top levels
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(column.summary?.categories || []).length ? (
                                                            column.summary.categories.map((item) => (
                                                                <TonePill key={`${column.id}-${item.value}`} darkMode={darkMode}>
                                                                    {item.value}: {item.count}
                                                                </TonePill>
                                                            ))
                                                        ) : (
                                                            <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                                No non-missing values yet.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card darkMode={darkMode}>
                                <div className="flex items-center gap-3 mb-4">
                                    <FlaskConical size={18} className={darkMode ? 'text-amber-300' : 'text-amber-700'} />
                                    <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Derived variables
                                    </h3>
                                </div>

                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Add a lightweight transformation here so the statistical pages can stay focused on modeling and interpretation.
                                </p>

                                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                Transformation
                                            </span>
                                            <select
                                                value={derivedDraft.operation}
                                                onChange={(event) => handleDerivedOperationChange(event.target.value)}
                                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            >
                                                {DERIVED_OPERATION_OPTIONS.map((option) => (
                                                    <option key={option.id} value={option.id}>{option.label}</option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                New variable label
                                            </span>
                                            <input
                                                value={derivedDraft.outputLabel}
                                                onChange={(event) => setDerivedDraft((previous) => ({ ...previous, outputLabel: event.target.value }))}
                                                placeholder="Leave blank to auto-name"
                                                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={handleApplyDerivedVariable}
                                            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            <CheckCircle2 size={16} />
                                            Add Derived Variable
                                        </button>
                                    </div>

                                    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Source variables
                                        </div>

                                        <div className="space-y-2">
                                            {derivedOptions.map((column) => {
                                                const isSelected = derivedDraft.columns.includes(column.id);
                                                const selectionLocked = activeOperation.mode === 'pair' && !isSelected && derivedDraft.columns.length >= 2;

                                                return (
                                                    <label
                                                        key={`derived-${column.id}`}
                                                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${selectionLocked ? 'opacity-50' : 'cursor-pointer'} ${isSelected
                                                            ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
                                                            : (darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700')
                                                        }`}
                                                    >
                                                        <input
                                                            type={activeOperation.mode === 'single' ? 'radio' : 'checkbox'}
                                                            name="derived-source"
                                                            checked={isSelected}
                                                            disabled={selectionLocked}
                                                            onChange={() => {
                                                                if (activeOperation.mode === 'single') {
                                                                    setDerivedDraft((previous) => ({ ...previous, columns: [column.id] }));
                                                                    return;
                                                                }

                                                                toggleDerivedColumn(column.id);
                                                            }}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-bold">{column.label}</div>
                                                            <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                                {column.summary?.detectedType} • missing {column.summary?.missingCount || 0}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        {derivedDraft.operation === 'recode' && recodeLevels.length > 0 && (
                                            <div className="mt-4 space-y-3">
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Recode map
                                                </div>
                                                {recodeLevels.map((level) => (
                                                    <label key={`map-${level}`} className="block">
                                                        <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                                                            {level}
                                                        </span>
                                                        <input
                                                            value={derivedDraft.mappings[level] ?? level}
                                                            onChange={(event) => setDerivedDraft((previous) => ({
                                                                ...previous,
                                                                mappings: {
                                                                    ...previous.mappings,
                                                                    [level]: event.target.value,
                                                                },
                                                            }))}
                                                            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            {problem && (
                <Card darkMode={darkMode}>
                    <div className="flex items-start gap-4">
                        <div className={`rounded-xl p-3 ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Something needs attention
                            </h3>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {problem}
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default DataManagerPage;
