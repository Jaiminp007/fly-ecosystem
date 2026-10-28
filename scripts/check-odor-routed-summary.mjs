import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(base,'protocol.json')),result=read(join(base,'results.json')),rows=[],acquisition={};
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
for(const arm of protocol.acquisitionArms)acquisition[arm]={survivors:0,present:[0,0,0],absent:[0,0,0],bothBanksAllSpeeds:0};
function verifyEndpoint(endpoint,checkpoint){
  const states=Object.values(checkpoint.state.learners),living=checkpoint.world.world.flies;
  assert.equal(endpoint.survivors,living.length);close(endpoint.physicalEnergy,living.reduce((sum,fly)=>sum+fly.energy,0));
  close(endpoint.outstandingEnergy,states.reduce((sum,state)=>sum+state.charge.outstandingEnergy,0));
  close(endpoint.budgetAdjustedEnergyPerFounder,(endpoint.physicalEnergy-endpoint.startingEnergy-endpoint.outstandingEnergy+endpoint.startingDebt)/endpoint.founders);
}
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json'));rows.push(row);
  for(const phase of row.anchorPhases){const anchor=read(join(base,'anchors',history.seed+'-'+phase+'.json'));assert.equal(anchor.world.world.tick,{A:512,B:1024,C:1536,D:1792}[phase]);}
  for(const arm of protocol.acquisitionArms){
    const entry=row.acquisition[arm],checkpoint=read(join(base,'finals',history.seed+'-acquire-'+arm+'.json')),summary=acquisition[arm];verifyEndpoint(entry.endpoint,checkpoint);
    summary.survivors+=entry.endpoint.survivors;
    for(const count of Object.values(entry.counts))for(const route of ['present','absent'])for(let index=0;index<3;index++)summary[route][index]+=count[route][index];
    for(const fly of checkpoint.world.world.flies){const count=entry.counts[fly.id];if(count&&count.present.every(value=>value>0)&&count.absent.every(value=>value>0))summary.bothBanksAllSpeeds++;}
  }
  for(const [key,entry]of Object.entries(row.probes))if(entry){
    const checkpoint=read(join(base,'finals',history.seed+'-probe-'+key+'.json'));assert.equal(hash(JSON.stringify(checkpoint)),entry.finalSha256);verifyEndpoint(entry.endpoint,checkpoint);
  }
  for(const mode of ['reset','native','guarded','native-full']){
    const current=row.probes['transfer-current']?.endpoint,control=row.probes['transfer-'+mode]?.endpoint,effect=row.effects[mode];
    if(!current||!control){assert.equal(effect,null);continue;}
    close(effect.energy,current.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder);assert.equal(effect.survivors,current.survivors-control.survivors);
  }
}
for(const mode of ['reset','native','guarded','native-full']){
  const values=rows.map(row=>row.effects[mode]),actual=result.comparisons[mode],complete=values.every(Boolean);assert.equal(actual.complete,complete);
  assert.equal(actual.positiveHistories,values.filter(value=>value&&value.energy>0).length);
  if(complete){close(actual.meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/8);assert.equal(actual.survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));}
  else{assert.equal(actual.meanEnergy,null);assert.equal(actual.survivorDifference,null);}
}
for(const phase of ['A','B']){
  const values=rows.map(row=>[row.probes[phase+'-earlier']?.endpoint,row.probes[phase+'-current']?.endpoint,row.probes[phase+'-reset']?.endpoint]),actual=result.retention[phase];
  const complete=values.every(value=>value.every(Boolean));assert.equal(actual.complete,complete);
  if(complete){
    const saved=values.reduce((sum,value)=>sum+value[0].budgetAdjustedEnergyPerFounder-value[2].budgetAdjustedEnergyPerFounder,0)/8;
    const current=values.reduce((sum,value)=>sum+value[1].budgetAdjustedEnergyPerFounder-value[2].budgetAdjustedEnergyPerFounder,0)/8;
    close(actual.savedAdvantage,saved);close(actual.currentAdvantage,current);if(saved>0)close(actual.ratio,current/saved);else assert.equal(actual.ratio,null);
  }else assert.equal(actual.ratio,null);
}
const expected=['reset','native-full'].every(mode=>{const value=result.comparisons[mode];return value.complete&&value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;});
assert.equal(result.promisingTransfer,expected);assert.equal(result.qualified,false);
const report={schema:1,passed:true,histories:rows.length,acquisition,scope:'Independent endpoint, action-support and summary arithmetic from saved checkpoints and rows; relies on separately verified trace provenance, not independent physics.'};
writeFileSync(join(base,'summary-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
