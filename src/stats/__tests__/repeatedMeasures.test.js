import { expect, it } from 'vitest';
import { calculateRepeatedMeasures } from '../repeatedMeasures.js';
import fixtures from '../fixtures/repeated-measures-r.json';

const setup = matrix => ({ conditions: matrix[0].map((_, i) => `C${i+1}`), records: matrix.map((values, i) => ({id:`S${i+1}`,values})) });
const calculate = matrix => calculateRepeatedMeasures(setup(matrix));

it.each(fixtures.cases)('matches the independent R repeated-measures fit and corrections: $name', reference => {
    const result = calculate(reference.matrix);
    expect(result.ok).toBe(true);
    for(const key of ['f','ssCondition','ssSubject','ssError']) expect(result[key]).toBeCloseTo(reference[key],7);
    expect(result.ssTotal).toBeCloseTo(result.ssCondition+result.ssSubject+result.ssError,7);
    expect(result.sphericity.gg).toBeCloseTo(reference.gg,10);
    expect(result.sphericity.hf).toBeCloseTo(reference.hf,10);
    for(const [id,key] of [['uncorrected','p'],['gg','pGG'],['hf','pHF']]) expect(result.corrections.find(row=>row.id===id).p).toBeCloseTo(reference[key],9);
    if(reference.mauchlyW !== null) {
        expect(result.sphericity.mauchly.available).toBe(true);
        expect(result.sphericity.mauchly.w).toBeCloseTo(reference.mauchlyW,9);
        expect(result.sphericity.mauchly.p).toBeCloseTo(reference.mauchlyP,9);
    }
    expect(result.partialEtaSquared).toBeCloseTo(reference.ssCondition/(reference.ssCondition+reference.ssError),10);
    expect(result.generalizedEtaSquared).toBeCloseTo(reference.ssCondition/(reference.ssCondition+reference.ssError+reference.ssSubject),10);
});

it('is invariant to row/condition ordering, a common shift, and a change of units', () => {
    const matrix=fixtures.cases[0].matrix, base=calculate(matrix);
    for(const changed of [[...matrix].reverse(),matrix.map(row=>[...row].reverse()),matrix.map(row=>row.map(value=>value*100+5000))]) {
        const result=calculate(changed);
        expect(result.f).toBeCloseTo(base.f,9);expect(result.sphericity.gg).toBeCloseTo(base.sphericity.gg,9);
    }
});

it('removes participant offsets from the condition test rather than using independent groups', () => {
    const matrix=fixtures.cases[0].matrix, base=calculate(matrix);
    const result=calculate(matrix.map((row,i)=>row.map(value=>value+100*i)));
    expect(result.f).toBeCloseTo(base.f,9);expect(result.ssError).toBeCloseTo(base.ssError,8);
    expect(result.ssSubject).toBeGreaterThan(base.ssSubject);
    expect(result.df2).toBe((matrix.length-1)*(matrix[0].length-1));
});

it('agrees with a paired t squared for two conditions', () => {
    const matrix=[[4,2],[7,3],[8,7],[9,4],[3,4]];
    const differences=matrix.map(row=>row[0]-row[1]);
    const mean=differences.reduce((sum,x)=>sum+x,0)/differences.length;
    const variance=differences.reduce((sum,x)=>sum+(x-mean)**2,0)/(differences.length-1);
    const result=calculate(matrix);
    expect(result.f).toBeCloseTo(mean**2/(variance/differences.length),10);
    expect(result.sphericity).toMatchObject({gg:1,hf:1,mauchly:{available:false}});
});

it('reports singular sphericity separately from a valid corrected F test', () => {
    const result=calculate([[1,2,3],[2,4,6],[3,6,9],[4,8,12]]);
    expect(result.ok).toBe(true);expect(result.sphericity.mauchly.available).toBe(false);
    expect(result.sphericity.gg).toBeCloseTo(0.5,10);
    expect(result.corrections.every(row=>Number.isFinite(row.p))).toBe(true);
});

it('excludes entire incomplete participants and can require complete data', () => {
    const input=setup(fixtures.cases[0].matrix);
    input.records[1].values=[3,null,4];
    const result=calculateRepeatedMeasures(input);
    expect(result.n).toBe(4);expect(result.excluded).toEqual([{id:'S2',conditions:['C2']}]);
    expect(calculateRepeatedMeasures({...input,missingPolicy:'reject'}).error).toContain('incomplete');
});

it('rejects missing/duplicate IDs and malformed cells before analysis', () => {
    const input=setup(fixtures.cases[0].matrix);
    expect(calculateRepeatedMeasures({...input,records:[...input.records,input.records[0]]}).error).toContain('Duplicate');
    expect(calculateRepeatedMeasures({...input,records:[{id:'',values:[1,2,3]}]}).error).toContain('ID');
    for(const value of ['oops',Infinity,'1e999',true]) {
        const changed=structuredClone(input);changed.records[0].values[0]=value;
        expect(calculateRepeatedMeasures(changed).error).toContain('finite number');
    }
});

it('handles insufficient participants, unsupported size, and degenerate data', () => {
    expect(calculate([[1,2],[3,5]]).ok).toBe(false);
    expect(calculate([[1,1],[1,1],[1,1]]).ok).toBe(false);
    expect(calculate([[1,2],[2,3],[3,4]]).error).toContain('Residual');
    expect(calculate(Array.from({length:4},()=>Array(13).fill(1))).ok).toBe(false);
    expect(calculateRepeatedMeasures({conditions:['A','B'],records:Array(10001).fill({id:'x',values:[1,2]})}).ok).toBe(false);
});
