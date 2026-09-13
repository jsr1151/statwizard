import usePersistentCalculatorDraft from './usePersistentCalculatorDraft.js';
import useAnalysisDatasetSelection from './useAnalysisDatasetSelection.js';
import { pairedDraftStorage, pairedExample } from '../utils/pairedDraft.js';
import { swapPairedInput } from '../stats/pairedCalculator.js';
export default function usePairedDraft(datasets) {
    const { value, patch, draft } = usePersistentCalculatorDraft(pairedDraftStorage);
    const selection = useAnalysisDatasetSelection({ analysisId: 'paired_t_test', datasets, initialSelection: value });
    const { selectedDatasetId } = selection;
    const roleSelection = Object.hasOwn(value.savedRoles, selectedDatasetId) ? value.savedRoles[selectedDatasetId] : { first: '', second: '' };
    const setRoleSelection = roles => patch(current => ({ selectedDatasetId, savedRoles: { ...current.savedRoles, [selectedDatasetId]: roles } }));
    const editProfile = change => patch(current => { const profile = current[current.inputMode]; return { [current.inputMode]: { ...profile, ...change, source: profile.source.startsWith('Edited copy of ') ? profile.source : current.inputMode === 'raw' ? 'Entered paired observations' : 'Entered paired summary statistics' } }; });
    return {
        ...selection, value, patch, draft, roleSelection, setRoleSelection,
        manualSource: value[value.inputMode].source,
        setDataSource: mode => { selection.setDataSource(mode); patch({ mode, selectedDatasetId }); },
        setSelectedDatasetId: id => { selection.setSelectedDatasetId(id); patch({ selectedDatasetId: id }); },
        editProfile,
        swap: () => selection.dataSource === 'saved' ? setRoleSelection({ first: roleSelection.second, second: roleSelection.first }) : patch(current => current.inputMode === 'raw'
            ? { raw: { ...current.raw, text: swapPairedInput(current.raw.text), labels: [...current.raw.labels].reverse() } }
            : { summary: { ...current.summary, mean1: current.summary.mean2, mean2: current.summary.mean1, sd1: current.summary.sd2, sd2: current.summary.sd1, labels: [...current.summary.labels].reverse() } }),
        loadExample: () => patch(pairedExample()),
        editCopy: (raw, name) => { selection.setDataSource('manual'); patch({ mode: 'manual', inputMode: 'raw', raw: { ...raw, source: `Edited copy of ${name}` }, selectedDatasetId }); },
    };
}
