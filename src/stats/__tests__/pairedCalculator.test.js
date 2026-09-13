import { expect, it } from 'vitest';
import reference from '../../../docs/audits/2026-09-12/paired-reference.json';
import { calculatePairedCalculator, parsePairedInput, swapPairedInput } from '../pairedCalculator.js';
import { createPairedDraft } from '../../utils/pairedDraft.js';
const defaults=createPairedDraft();
it.each(reference.cases)('matches independent R paired inference: $id', fixture=>{
 const result=calculatePairedCalculator({...defaults,...fixture,inputMode:'summary',summary:fixture});
 expect(result.ok).toBe(true);expect(result.t).toBeCloseTo(fixture.t,8);expect(result.df).toBe(fixture.df);expect(result.sd).toBeCloseTo(fixture.differenceSd,10);
 expect(Math.abs(result.p-fixture.p)).toBeLessThan(1e-7);
 for(const [actual,expected] of [[result.ciLower,fixture.lower],[result.ciUpper,fixture.upper]]){
  if(typeof expected==='string')expect(actual).toBe(expected==='Inf'?Infinity:-Infinity);else expect(Math.abs(actual-expected)).toBeLessThan(1e-6);
 }
});
it('excludes entire incomplete/invalid rows without shifting later pairs and retains original line numbers',()=>{
 const text='1,10\n,20\n3,nope\n\n4,40\n5\n6,60,600\n7 70\n8\t80\n9;90\n1;,2';
 const review=parsePairedInput(text);
 expect(review.pairs).toEqual([{row:1,first:1,second:10},{row:5,first:4,second:40},{row:8,first:7,second:70},{row:9,first:8,second:80},{row:10,first:9,second:90}]);
 expect(review.total).toBe(10);expect(review.dropped).toBe(5);expect(review.excluded.map(row=>row.row)).toEqual([2,3,6,7,11]);
});
it.each(['1,2x','1,Infinity','1,0x20','1,2 3','1,,2','Header,Other','1,'])('excludes malformed pair %j',text=>{expect(parsePairedInput(text).usable).toBe(0);});
it('preserves raw precision and computes the paired differences before inference',()=>{
 const raw={text:'1.123456789,0.5\n2.234567891,1\n4.345678912,2\n5.456789123,4\n,5'};
 const result=calculatePairedCalculator({...defaults,raw});expect(result.ok).toBe(true);expect(result.n).toBe(4);expect(result.dBar).toBeCloseTo(1.41512317875,12);
 const summary={mean1:result.mean1,mean2:result.mean2,sd1:result.sd1,sd2:result.sd2,n:result.n,r:result.r};
 const summarized=calculatePairedCalculator({...defaults,inputMode:'summary',summary});expect(summarized.t).toBeCloseTo(result.t,10);expect(summarized.p).toBeCloseTo(result.p,10);
});
it('swaps columns without moving or dropping invalid rows and reverses directional inference',()=>{
 const text='1,3\n,20\n4,bad\n6\n5,2\n6,7,8';const swapped=swapPairedInput(text);
 expect(swapped).toBe('3,1\n20,\nbad,4\n6\n2,5\n6,7,8');
 const options={...defaults,tails:1,direction:'greater',raw:{text}};const first=calculatePairedCalculator(options),second=calculatePairedCalculator({...options,raw:{text:swapped}});
 expect(second.t).toBe(-first.t);expect(second.p).toBeCloseTo(1-first.p,10);expect(second.review.dropped).toBe(first.review.dropped);
});
it.each([{r:''},{r:1.1},{r:-1.1},{mean1:''},{sd1:0},{sd2:-1},{n:2.5},{n:1},{n:2,r:0}])('blocks invalid paired summary inputs: %j',change=>{
 expect(calculatePairedCalculator({...defaults,inputMode:'summary',summary:{...defaults.summary,...change}}).ok).toBe(false);
});
it.each(['','1,2','1,2\n2,3','1e308,-1e308\n2,1'])('blocks insufficient, constant or overflowing differences: %j',text=>{expect(calculatePairedCalculator({...defaults,raw:{text}}).ok).toBe(false);});
it('supports a constant condition when differences vary and labels correlation undefined',()=>{
 const result=calculatePairedCalculator({...defaults,raw:{text:'4,1\n4,2\n4,5'}});expect(result.ok).toBe(true);expect(result.r).toBeNull();expect(result.n).toBe(3);
});
it('caps displayed exclusion details while retaining complete counts',()=>{const review=parsePairedInput('1,\n'.repeat(150));expect(review.total).toBe(150);expect(review.dropped).toBe(150);expect(review.excluded).toHaveLength(100);});
