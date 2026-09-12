import { expect, it } from 'vitest';
import { searchModules } from '../moduleSearch.js';
import { STAT_PAGE_LIST } from '../../data/wizardSteps.js';

it('finds familiar synonyms without joining unrelated words into matches', () => {
    expect(searchModules(STAT_PAGE_LIST, 'average')[0].id).toBe('res_central_tendency');
    expect(searchModules(STAT_PAGE_LIST, 'standard deviation')[0].id).toBe('res_variability');
    expect(searchModules(STAT_PAGE_LIST, 'SD').map(item => item.id)).toEqual(['res_variability']);
    expect(searchModules(STAT_PAGE_LIST, 't-test').length).toBe(3);
    expect(searchModules(STAT_PAGE_LIST, 'not-a-real-test')).toEqual([]);
});
