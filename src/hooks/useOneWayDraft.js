import usePersistentCalculatorDraft from './usePersistentCalculatorDraft.js';
import useAnalysisDatasetSelection from './useAnalysisDatasetSelection.js';
import { oneWayDraftStorage, oneWayExample, MAX_ANOVA_GROUPS } from '../utils/oneWayDraft.js';

export default function useOneWayDraft(datasets) {
    const { value, patch, draft } = usePersistentCalculatorDraft(oneWayDraftStorage);
    const selection = useAnalysisDatasetSelection({ analysisId: 'one_way_anova', datasets, initialSelection: value });
    const { selectedDatasetId } = selection;
    const roleSelection = Object.hasOwn(value.savedRoles, selectedDatasetId) ? value.savedRoles[selectedDatasetId] : { outcome: '', grouping: '' };
    const profile = update => patch(current => {
        const mode = current.inputMode;
        if (mode === 'f') return { f: update(current.f) };
        const source = current[mode].source.startsWith('Edited copy of ') ? current[mode].source : 'Entered group data';
        return { [mode]: { ...update(current[mode]), source } };
    });
    return {
        ...selection, value, patch, draft, roleSelection,
        setRoleSelection: roles => patch(current => ({ selectedDatasetId, savedRoles: { ...current.savedRoles, [selectedDatasetId]: roles } })),
        setDataSource: mode => { selection.setDataSource(mode); patch({ mode, selectedDatasetId }); },
        setSelectedDatasetId: id => { selection.setSelectedDatasetId(id); patch({ selectedDatasetId: id }); },
        setGroup: (index, key, next) => profile(current => ({ ...current, groups: current.groups.map((group, i) => i === index ? { ...group, [key]: next } : group) })),
        addGroup: () => profile(current => ({ ...current, groups: current.groups.length >= MAX_ANOVA_GROUPS ? current.groups : [...current.groups, value.inputMode === 'raw' ? { label: `Group ${current.groups.length + 1}`, raw: '' } : { label: `Group ${current.groups.length + 1}`, mean: '', sd: '', n: '' }] })),
        removeGroup: index => profile(current => ({ ...current, groups: current.groups.length > 2 ? current.groups.filter((_, i) => i !== index) : current.groups })),
        loadExample: () => patch(oneWayExample()),
        editCopy: (groups, name) => { selection.setDataSource('manual'); patch({ mode: 'manual', inputMode: 'raw', raw: { groups, source: `Edited copy of ${name}` }, selectedDatasetId }); },
    };
}
