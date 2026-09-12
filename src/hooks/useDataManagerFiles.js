import { autoDetectHeaderRow, buildDatasetCsv, buildDatasetFromColumnRecords, buildDatasetExportRows, buildDatasetFromGrid, hydrateStoredDataset, isMissingValue, parseDelimitedTextGrid } from '../utils/datasetImport.js';
import { inferAnalysisLaunchSelection, writeAnalysisLaunchPayload } from '../utils/analysisLaunch.js';
import { stripExtension } from '../utils/dataManagerHelpers.js';
import { sanitizeFileName } from '../utils/dataManagerHelpers.js';

export default function useDataManagerFiles({
    setProblem, clearUndoHistory, setEditorDataset, setIsDirty,
    setFeedback, setBusy, setImportSession, resetTransformDrafts,
    editorDataset, saveDataset, setNotice, duplicateDataset,
    deleteDataset, datasets, isDirty, editorIsSaved,
    onOpenAnalysis, onOpenMultipleRegression, analysisMenuDatasetId, setAnalysisMenuDatasetId,
}) {
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

        clearUndoHistory();
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
                const { readExcelSheets } = await import('../utils/excelWorkbook.js');
                const sheets = readExcelSheets(await file.arrayBuffer())
                    .filter((sheet) => sheet.grid.some((row) => row.some((value) => !isMissingValue(value))));

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
                resetTransformDrafts();
                rebuildEditorFromSession(session);
            } else if (lowerName.endsWith('.sav')) {
                const jsavvyModule = await import('jsavvy');
                const Feeder = jsavvyModule.Feeder || jsavvyModule.default?.Feeder;
                const SavParser = jsavvyModule.SavParser || jsavvyModule.default?.SavParser;
                const Savvy = jsavvyModule.default?.Savvy;

                if (!Feeder || !SavParser || !Savvy) {
                    throw new Error('The SPSS importer is installed, but could not be loaded correctly.');
                }

                const parser = new SavParser();
                const parsed = await parser.all(new Feeder(await file.arrayBuffer()));
                const savvyDataset = new Savvy(parsed);
                const nextDataset = buildDatasetFromColumnRecords({
                    datasetName: stripExtension(file.name),
                    sourceType: 'sav',
                    originalFileName: file.name,
                    fileType: 'SPSS (.sav)',
                    hasHeaderRow: true,
                    columns: savvyDataset.keys.map((key) => ({
                        sourceKey: key,
                        name: key,
                        originalName: savvyDataset.names.get(key) || key,
                        label: savvyDataset.labels.get(key) || savvyDataset.names.get(key) || key,
                    })),
                    rows: Array.from({ length: savvyDataset.n }, (_, index) => savvyDataset.row(index)),
                });

                setImportSession(null);
                resetTransformDrafts();
                clearUndoHistory();
                setEditorDataset(nextDataset);
                setIsDirty(true);
                setFeedback({
                    nextNotice: `Imported ${nextDataset.name} from SPSS with ${nextDataset.rowCount} rows and ${nextDataset.columnCount} variables.`,
                    nextProblem: '',
                });
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
                resetTransformDrafts();
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
            return null;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const saved = await saveDataset(editorDataset);
            setEditorDataset(saved);
            setIsDirty(false);
            setNotice(`${saved.name} was saved locally and is ready across sessions.`);
            return saved;
        } catch (saveError) {
            setProblem(saveError instanceof Error ? saveError.message : 'Could not save the dataset.');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const handleSaveDatasetAsNew = async () => {
        if (!editorDataset) {
            return null;
        }

        setBusy(true);
        setFeedback({ nextNotice: '', nextProblem: '' });

        try {
            const duplicated = await duplicateDataset(editorDataset);
            clearUndoHistory();
            setEditorDataset(duplicated);
            setImportSession(null);
            resetTransformDrafts();
            setIsDirty(false);
            setNotice(`${duplicated.name} was saved as a new dataset.`);
            return duplicated;
        } catch (duplicateError) {
            setProblem(duplicateError instanceof Error ? duplicateError.message : 'Could not save the dataset as a new copy.');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const handleOpenSavedDataset = (dataset) => {
        clearUndoHistory();
        setEditorDataset(hydrateStoredDataset(dataset));
        setImportSession(null);
        resetTransformDrafts();
        setIsDirty(false);
        setFeedback({
            nextNotice: `Opened ${dataset.name}. Adjust variables, transform what you need, then save your updates.`,
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
                resetTransformDrafts();
                setIsDirty(false);
                clearUndoHistory();
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
            clearUndoHistory();
            setEditorDataset(duplicated);
            setImportSession(null);
            resetTransformDrafts();
            setIsDirty(false);
            setNotice(`Created ${duplicated.name}.`);
        } catch (duplicateError) {
            setProblem(duplicateError instanceof Error ? duplicateError.message : 'Could not duplicate the dataset.');
        } finally {
            setBusy(false);
        }
    };

    const resolveLaunchDataset = async (datasetId) => {
        if (!datasetId) {
            return null;
        }

        let targetDataset = editorDataset?.id === datasetId
            ? editorDataset
            : (datasets.find((dataset) => dataset.id === datasetId) || null);

        if (!targetDataset) {
            return null;
        }

        if (editorDataset?.id === datasetId && (isDirty || !editorIsSaved)) {
            setBusy(true);
            setFeedback({ nextNotice: '', nextProblem: '' });

            try {
                targetDataset = await saveDataset(editorDataset);
                setEditorDataset(targetDataset);
                setIsDirty(false);
            } catch (saveError) {
                setProblem(saveError instanceof Error ? saveError.message : 'Could not save the dataset before launching analysis.');
                return null;
            } finally {
                setBusy(false);
            }
        }

        return targetDataset;
    };

    const openAnalysisDestination = (analysisId) => {
        if (typeof onOpenAnalysis === 'function') {
            onOpenAnalysis(analysisId);
            return;
        }

        if (analysisId === 'multiple_regression') {
            onOpenMultipleRegression?.();
        }
    };

    const handleLaunchAnalysis = async (analysisId) => {
        const targetDataset = await resolveLaunchDataset(analysisMenuDatasetId);

        if (!targetDataset) {
            setProblem('Choose a dataset before launching analysis.');
            return;
        }

        const selection = inferAnalysisLaunchSelection(targetDataset, analysisId);

        writeAnalysisLaunchPayload({
            analysisId,
            datasetId: targetDataset.id,
            ...(selection || {}),
        });

        setAnalysisMenuDatasetId('');
        openAnalysisDestination(analysisId);
    };

    const handleImportSessionChange = (patch) => {
        setImportSession((previous) => {
            const next = { ...previous, ...patch };
            rebuildEditorFromSession(next, editorDataset);
            return next;
        });
    };

    const handleExportDataset = async (format) => {
        if (!editorDataset) {
            return;
        }

        try {
            const baseFileName = sanitizeFileName(editorDataset.name);

            if (format === 'csv') {
                const csvText = buildDatasetCsv(editorDataset);
                const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = window.document.createElement('a');
                link.href = url;
                link.download = `${baseFileName}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
                setNotice(`Exported ${editorDataset.name} as CSV.`);
                return;
            }

            const { writeExcelDataset } = await import('../utils/excelWorkbook.js');
            writeExcelDataset(buildDatasetExportRows(editorDataset), `${baseFileName}.xlsx`);
            setNotice(`Exported ${editorDataset.name} as Excel.`);
        } catch (exportError) {
            setProblem(exportError instanceof Error ? exportError.message : 'Could not export the dataset.');
        }
    };

    return {
        handleFileImport, handleSaveDataset, handleSaveDatasetAsNew, handleOpenSavedDataset,
        handleDeleteDataset, handleDuplicateDataset, handleLaunchAnalysis, handleImportSessionChange,
        handleExportDataset,
    };
}
