import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),study=join(root,'evidence/cue-shared-development/20261026-v1'),base=join(root,'evidence/cue-shared-exposure/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
const totals={survivors:0,zeroAbsentAtA:0,zeroAbsentAtC:0,changedAbsentInD:0,bothSteeringActionsInD:0,midpointAvailableInD:0,absentChangeD:0,sharedChangeD:0};const rows=[];
for(const input of protocol.inputs){
  const prefix=input.history.seed+'-cue-shared-',paths=Object.fromEntries(['A','C','D'].map(phase=>[phase,join(study,'anchors',prefix+phase+'.json')]));
  const anchors=Object.fromEntries(Object.entries(paths).map(([phase,path])=>[phase,read(path)])),census=read(join(base,'rows',input.history.seed+'.json')).arms['cue-shared'];
  const row={seed:input.history.seed,sha256:Object.fromEntries(Object.entries(paths).map(([phase,path])=>[phase,hash(readFileSync(path))])),founders:[]};
  for(const fly of anchors.D.world.world.flies){
    const id=fly.id,first=anchors.A.state.learners[id].steering,later=anchors.C.state.learners[id].steering,last=anchors.D.state.learners[id].steering,counts=census.phases.D.byFounder[id];assert.ok(counts);
    const zeroAtA=first.contextWeights[0].flat().every(value=>value===0),zeroAtC=later.contextWeights[0].flat().every(value=>value===0);
    let absentChangeD=0,sharedChangeD=0;for(let action=0;action<2;action++)for(let index=0;index<8;index++){
      absentChangeD+=Math.abs(last.contextWeights[0][action][index]-later.contextWeights[0][action][index]);sharedChangeD+=Math.abs(last.weights[action][index]-later.weights[action][index]);
    }
    const both=counts.steering.every(value=>value>0),available=counts.available>0;
    row.founders.push({id,zeroAtA,zeroAtC,absentChangeD,sharedChangeD,decisions:counts.decisions,available:counts.available,actions:counts.steering});
    totals.survivors++;totals.zeroAbsentAtA+=Number(zeroAtA);totals.zeroAbsentAtC+=Number(zeroAtC);totals.changedAbsentInD+=Number(absentChangeD>0);
    totals.bothSteeringActionsInD+=Number(both);totals.midpointAvailableInD+=Number(available);totals.absentChangeD+=absentChangeD;totals.sharedChangeD+=sharedChangeD;
  }
  rows.push(row);
}
const report={schema:1,totals,rows,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),
  scope:'Outcome-selected D-survivor saved-weight and D action-support census; not counterfactual action value or qualification.'};
writeFileSync(join(base,'context-support-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(totals));
