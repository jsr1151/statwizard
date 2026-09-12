import { expect, it } from 'vitest';
import { buildRankDataset } from '../rankDataset.js';
import { buildDatasetFromGrid } from '../datasetImport.js';
import { calculateRankTest } from '../../stats/nonparametric.js';
import { inferAnalysisLaunchSelection } from '../analysisLaunch.js';

it('maps saved pairs without dropping a missing cell and preserves variable labels', () => {
    const data=buildDatasetFromGrid({grid:[['Before','After'],[1,0],[null,100],[4,2]],hasHeaderRow:true,datasetName:'Pairs'});
    const selection={first:data.columns[0].id,second:data.columns[1].id};
    const result=buildRankDataset(data,selection,true);
    expect(result.label).toContain('A = Before; B = After');
    expect(calculateRankTest(result.first,result.second,{paired:true})).toMatchObject({n:2,excludedPairs:1,wPlus:3});
    expect(inferAnalysisLaunchSelection(data,'wilcoxon_signed_rank').datasetId).toBe(data.id);
});

it('separates missing group labels from missing outcomes and rejects invalid roles', () => {
    const data=buildDatasetFromGrid({grid:[['Score','Group'],[1,'A'],[2,'A'],[4,'B'],[null,'B'],[9,null]],hasHeaderRow:true,datasetName:'Groups'});
    const selection={outcome:data.columns[0].id,grouping:data.columns[1].id};
    const result=buildRankDataset(data,selection,false);
    expect(result.excludedGroups).toBe(1);
    expect(calculateRankTest(result.first,result.second)).toMatchObject({nA:2,nB:1,excludedB:1});
    expect(buildRankDataset(data,{...selection,grouping:selection.outcome},false).error).toContain('different');
    expect(buildRankDataset(data,{...selection,outcome:'missing'},false).error).toContain('roles');
    expect(inferAnalysisLaunchSelection(data,'mann_whitney')).toMatchObject(selection);
});
