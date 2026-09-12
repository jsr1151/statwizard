import usePersistentCalculatorDraft from './usePersistentCalculatorDraft.js';
import useAnalysisDatasetSelection from './useAnalysisDatasetSelection.js';
import { oneSampleDraftStorage, oneSampleExample } from '../utils/oneSampleDraft.js';

export default function useOneSampleDraft(datasets) {
    const { value, patch, draft } = usePersistentCalculatorDraft(oneSampleDraftStorage);
    const selection = useAnalysisDatasetSelection({ analysisId: 'one_sample_t_test', datasets, initialSelection: value });
    const { selectedDatasetId } = selection;
    return {
        ...selection, value, patch, draft,
        roleSelection: Object.hasOwn(value.savedRoles, selectedDatasetId) ? value.savedRoles[selectedDatasetId] : { outcome: '' },
        setRoleSelection: roles => patch(current => ({ selectedDatasetId, savedRoles: { ...current.savedRoles, [selectedDatasetId]: roles } })),
        setDataSource: mode => { selection.setDataSource(mode); patch({ mode, selectedDatasetId }); },
        setSelectedDatasetId: id => { selection.setSelectedDatasetId(id); patch({ selectedDatasetId: id }); },
        setSummary: (key, next) => patch(current => ({ summary: { ...current.summary, [key]: next }, source: 'Entered summary statistics' })),
        setRaw: raw => patch(current => ({ raw, source: current.source.startsWith('Edited copy of ') ? current.source : 'Entered sample values' })),
        loadExample: () => patch(oneSampleExample()),
        editCopy: (raw, name) => { selection.setDataSource('manual'); patch({ mode: 'manual', inputMode: 'raw', raw, source: `Edited copy of ${name}`, selectedDatasetId }); },
    };
}
