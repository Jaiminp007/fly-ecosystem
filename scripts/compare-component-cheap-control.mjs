import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-shared-transfer-components/20261026-v1'),prior=join(root,'evidence/cue-shared-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),rows=[];
for(const input of protocol.inputs){
  const maskPath=join(base,'rows',input.history.seed+'.json'),priorPath=join(prior,'rows',input.history.seed+'.json'),row=read(maskPath),old=read(priorPath);
  const cheap=old.arms['cue-shared'].probes['transfer-native-full'];assert.ok(cheap);
  const effects={};for(const arm of protocol.arms){
    assert.equal(row.arms[arm].startWorldSha256,cheap.startWorldSha256);
    effects[arm]={energy:row.arms[arm].endpoint.budgetAdjustedEnergyPerFounder-cheap.endpoint.budgetAdjustedEnergyPerFounder,survivors:row.arms[arm].endpoint.survivors-cheap.endpoint.survivors};
  }
  rows.push({seed:input.history.seed,maskRowSha256:hash(readFileSync(maskPath)),priorRowSha256:hash(readFileSync(priorPath)),effects});
}
const comparisons=Object.fromEntries(protocol.arms.map(arm=>{const values=rows.map(row=>row.effects[arm]);return [arm,{meanEnergy:values.reduce((sum,value)=>sum+value.energy,0)/8,positiveHistories:values.filter(value=>value.energy>0).length,survivorDifference:values.reduce((sum,value)=>sum+value.survivors,0)}];}));
const report={schema:1,comparisons,rows,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Post-outcome comparison to previously recorded same-world cheap native-full, not a prespecified test, independent sample, trained skill or qualification.'};
writeFileSync(join(base,'posthoc-cheap-control.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(comparisons));
