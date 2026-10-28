import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),study=join(root,'evidence/cue-shared-development/20261026-v1'),base=join(root,'evidence/cue-shared-exposure/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
const blank=()=>({decisions:0,available:0,combinedMidpoint:0,sharedMidpoint:0,residualMidpoint:0,sharedDiffers:0,residualDiffers:0,oppositeSigns:0,sharedMarginAbs:0,residualMarginAbs:0});
const add=(target,source)=>{for(const key of Object.keys(target))target[key]+=source[key];};const totals=blank(),rows=[];
for(const input of protocol.inputs){
  const seed=input.history.seed,label=seed+'-cue-shared-probe-transfer-current',startPath=join(study,'starts',label+'.json'),start=read(startPath),studyRow=read(join(study,'rows',seed+'.json'));
  const counts=blank(),stream=createReadStream(join(study,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);if(event.type!=='decision')continue;
    const state=start.state.learners[event.id].steering,features=event.features;
    assert.ok(event.own.cue.every(value=>value===0));
    const shared=state.weights.map(row=>row.reduce((sum,value,index)=>sum+value*features[index],0));
    const residual=state.contextWeights[0].map(row=>row.reduce((sum,value,index)=>sum+value*features[index],0));
    const combined=state.weights.map((row,action)=>row.reduce((sum,value,index)=>sum+(value+state.contextWeights[0][action][index])*features[index],0));
    assert.deepEqual(combined,event.steering.predictions);
    const both=Number(event.available&&combined[1]>combined[0]),sharedOnly=Number(event.available&&shared[1]>shared[0]),residualOnly=Number(event.available&&residual[1]>residual[0]);
    assert.equal(both,event.steering.action);counts.decisions++;counts.available+=Number(event.available);counts.combinedMidpoint+=both;counts.sharedMidpoint+=sharedOnly;counts.residualMidpoint+=residualOnly;
    counts.sharedDiffers+=Number(both!==sharedOnly);counts.residualDiffers+=Number(both!==residualOnly);
    if(event.available){const sharedMargin=shared[1]-shared[0],residualMargin=residual[1]-residual[0];counts.oppositeSigns+=Number(sharedMargin*residualMargin<0);counts.sharedMarginAbs+=Math.abs(sharedMargin);counts.residualMarginAbs+=Math.abs(residualMargin);}
  }
  assert.equal(digest.digest('hex'),studyRow.traces[label].sha256);add(totals,counts);rows.push({seed,startSha256:hash(readFileSync(startPath)),counts});
}
const report={schema:1,totals,rows,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),
  scope:'Post-outcome same-observation value decomposition only; shared-only/residual-only are counterfactual commands without physical outcomes or training labels.'};
writeFileSync(join(base,'transfer-component-census.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(totals));
