import { getDatasetColumn, getDatasetColumnValues } from './datasetImport.js';
import { isRankMissing } from '../stats/nonparametric.js';

export function buildRankDataset(dataset, selection, paired) {
    const firstId = paired ? selection.first : selection.outcome;
    const secondId = paired ? selection.second : selection.grouping;
    if (!dataset || !getDatasetColumn(dataset, firstId) || !getDatasetColumn(dataset, secondId)) return { error: 'Choose a saved dataset and both variable roles.' };
    if (firstId === secondId) return { error: 'Choose two different variables.' };
    const firstValues = getDatasetColumnValues(dataset, firstId);
    const secondValues = getDatasetColumnValues(dataset, secondId);
    if (paired) return { first: firstValues, second: secondValues, label: `${dataset.name}: A = ${(getDatasetColumn(dataset, firstId).label || getDatasetColumn(dataset, firstId).name)}; B = ${(getDatasetColumn(dataset, secondId).label || getDatasetColumn(dataset, secondId).name)}`, excludedGroups: 0 };
    const levels = [...new Set(secondValues.filter(value => !isRankMissing(value)).map(value => String(value).trim()))];
    if (levels.length !== 2) return { error: 'The grouping variable must contain exactly two observed levels. Missing group labels are excluded.' };
    const first = [], second = [];
    let excludedGroups = 0;
    secondValues.forEach((group, index) => {
        if (isRankMissing(group)) { excludedGroups++; return; }
        (String(group).trim() === levels[0] ? first : second).push(firstValues[index]);
    });
    return { first, second, excludedGroups, label: `${dataset.name}: ${(getDatasetColumn(dataset, firstId).label || getDatasetColumn(dataset, firstId).name)}; A = ${levels[0]}, B = ${levels[1]} (group order follows first appearance)` };
}
