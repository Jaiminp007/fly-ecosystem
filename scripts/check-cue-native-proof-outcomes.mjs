import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-native-proof-transfer/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),result=read(join(base,'results.json'));
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-10+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
const rows=protocol.inputs.map(input=>read(join(base,'rows',input.history.seed+'.json')));
for(const control of ['wall-only','reset','native','guarded','native-full']){
  const values=rows.map(row=>{const candidate=row.arms.proof.endpoint,reference=row.arms[control].endpoint,effect=row.effects[control];
    close(effect.energy,candidate.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder);assert.equal(effect.survivors,candidate.survivors-reference.survivors);return effect;});
  const comparison=result.comparisons[control];close(comparison.meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/8);
  assert.equal(comparison.positiveHistories,values.filter(value=>value.energy>0).length);assert.equal(comparison.survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));
}
const promising=['reset','native-full'].every(control=>{const value=result.comparisons[control];return value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;});assert.equal(result.promisingTransfer,promising);
const report={schema:1,passed:true,histories:rows.length,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Post-outcome reconstruction of paired endpoint arithmetic and fixed exploratory gate; not independent physics or qualification.'};
writeFileSync(join(base,'outcomes-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
