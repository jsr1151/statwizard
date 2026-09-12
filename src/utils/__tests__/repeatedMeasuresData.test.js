import { expect, it } from 'vitest';
import { parseRepeatedMeasuresText, prepareRepeatedLong, prepareRepeatedDataset } from '../repeatedMeasuresData.js';
import { calculateRepeatedMeasures } from '../../stats/repeatedMeasures.js';
import { buildDatasetFromGrid } from '../datasetImport.js';

it('matches long records by ID and condition regardless of row order', () => {
    const rows=[{id:'B',condition:'Post',value:4},{id:'A',condition:'Pre',value:1},{id:'B',condition:'Pre',value:2},{id:'A',condition:'Post',value:3}];
    expect(prepareRepeatedLong(rows)).toEqual({conditions:['Post','Pre'],records:[{id:'B',values:[4,2]},{id:'A',values:[3,1]}]});
    expect(prepareRepeatedLong([...rows,rows[0]]).error).toContain('Duplicate measurement');
    expect(prepareRepeatedLong([{id:'',condition:'Pre',value:1}]).error).toContain('ID');
    expect(prepareRepeatedLong([{id:'A',condition:'',value:1}]).error).toContain('condition label');
});

it('retains absent condition cells for complete-participant exclusion', () => {
    const data=parseRepeatedMeasuresText('ID,Time,Value\nA,Pre,1\nB,Pre,2\nA,Post,3\nC,Pre,3\nC,Post,4\nD,Pre,1\nD,Post,4','long');
    const result=calculateRepeatedMeasures(data);
    expect(result.ok).toBe(true);expect(result.excluded).toEqual([{id:'B',conditions:['Post']}]);
});

it('requires explicit wide columns and named headers', () => {
    expect(parseRepeatedMeasuresText('ID,Pre,Post\nA,1\nB,2,3').error).toContain('Every wide');
    expect(parseRepeatedMeasuresText('ID,Pre,Pre\nA,1,2').error).toContain('distinct');
    const data=parseRepeatedMeasuresText('ID\tPre\tPost\nA\t1\t2\nB\t2\tNA\nC\t3\t4\nD\t5\t9');
    expect(calculateRepeatedMeasures(data)).toMatchObject({ok:true,n:3,excluded:[{id:'B',conditions:['Post']}]});
});

it('keeps selected saved columns in order and prevents the ID becoming an outcome', () => {
    const dataset=buildDatasetFromGrid({grid:[['Participant','Pre','Post'],['A',1,2],['B',2,4],['C',3,4]],hasHeaderRow:true});
    const [subject,pre,post]=dataset.columns.map(column=>column.id);
    expect(prepareRepeatedDataset(dataset,{subject,conditions:[post,pre]},'wide').conditions).toEqual(['Post','Pre']);
    expect(prepareRepeatedDataset(dataset,{subject,conditions:[subject,pre]},'wide').error).toContain('excluding');
});
