import usePersistentCalculatorDraft from './usePersistentCalculatorDraft.js';
import useAnalysisDatasetSelection from './useAnalysisDatasetSelection.js';
import { independentDraftStorage, independentExample } from '../utils/independentDraft.js';

export default function useIndependentDraft(datasets) {
    const { value, patch, draft } = usePersistentCalculatorDraft(independentDraftStorage);
    const selection = useAnalysisDatasetSelection({ analysisId: 'independent_t_test', datasets, initialSelection: value });
    const { selectedDatasetId } = selection;
    const roleSelection = Object.hasOwn(value.savedRoles, selectedDatasetId) ? value.savedRoles[selectedDatasetId] : { outcome: '', grouping: '', reverse: false };
    const setRoleSelection = roles => patch(current => ({ selectedDatasetId, savedRoles: { ...current.savedRoles, [selectedDatasetId]: roles } }));
    return {
        ...selection, value, patch, draft, roleSelection, setRoleSelection,
        setDataSource: mode => { selection.setDataSource(mode); patch({ mode, selectedDatasetId }); },
        setSelectedDatasetId: id => { selection.setSelectedDatasetId(id); patch({ selectedDatasetId: id }); },
        setGroup: (index, key, next) => patch(current => ({ groups: current.groups.map((group, i) => i === index ? { ...group, [key]: next } : group), source: current.source.startsWith('Edited copy of ') ? current.source : 'Entered group data' })),
        swap: () => selection.dataSource === 'saved' ? setRoleSelection({ ...roleSelection, reverse: !roleSelection.reverse }) : patch(current => ({ groups: [...current.groups].reverse() })),
        loadExample: () => patch(independentExample()),
        editCopy: (groups, name) => {
            selection.setDataSource('manual');
            patch(current => ({ mode: 'manual', inputMode: 'raw', groups: groups.map((group, i) => ({ ...current.groups[i], raw: group.raw, label: group.label })), source: `Edited copy of ${name}`, selectedDatasetId }));
        },
    };
}
