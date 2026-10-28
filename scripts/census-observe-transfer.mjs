import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),study=join(root,'evidence/target-taste-development/20261026-v1'),output=join(root,'evidence/observe-transfer-census/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(study,'protocol.json'));
const blank=()=>({decisions:0,available:0,moves:[0,0,0],steering:[0,0],sharedOnlyDiffers:0,residualOnlyDiffers:0,oppositeMargins:0});
const add=(target,source)=>{for(const key of ['decisions','available','sharedOnlyDiffers','residualOnlyDiffers','oppositeMargins'])target[key]+=source[key];for(const key of ['moves','steering'])for(let index=0;index<target[key].length;index++)target[key][index]+=source[key][index];};
const rows=[],totals=blank();
for(const history of protocol.histories){const seed=history.seed,label=seed+'-observe-probe-transfer-current',row=read(join(study,'rows',seed+'.json')),trace=row.traces[label],startPath=join(study,'starts',label+'.json'),start=read(startPath),counts=blank();
  const stream=createReadStream(join(study,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;if(event.type!=='decision')continue;
    assert.ok(event.own.cue.every(value=>value===0));assert.equal(event.choice.route,'absent');assert.equal(event.choice.accept,true);
    const state=start.state.learners[event.id],raw=event.own.raw,contact=event.own.contactPresent,phi=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),contact?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,contact?raw[13]*.25:0];
    const motor=state.banks.absent.weights.map(weights=>weights.reduce((sum,value,index)=>sum+value*phi[index],0));let move=2;for(let action=1;action>=0;action--)if(motor[action]>motor[move])move=action;assert.equal(event.choice.action,move);
    const shared=state.steering.weights.map(weights=>weights.reduce((sum,value,index)=>sum+value*event.features[index],0)),residual=state.steering.contextWeights[0].map(weights=>weights.reduce((sum,value,index)=>sum+value*event.features[index],0));
    const combined=state.steering.weights.map((weights,action)=>weights.reduce((sum,value,index)=>sum+(value+state.steering.contextWeights[0][action][index])*event.features[index],0));assert.deepEqual(combined,event.steering.predictions);
    const full=Number(event.available&&combined[1]>combined[0]),sharedAction=Number(event.available&&shared[1]>shared[0]),residualAction=Number(event.available&&residual[1]>residual[0]);assert.equal(full,event.steering.action);
    counts.decisions++;counts.available+=Number(event.available);counts.moves[move]++;counts.steering[full]++;counts.sharedOnlyDiffers+=Number(full!==sharedAction);counts.residualOnlyDiffers+=Number(full!==residualAction);
    if(event.available)counts.oppositeMargins+=Number((shared[1]-shared[0])*(residual[1]-residual[0])<0);
  }
  assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);add(totals,counts);rows.push({seed,startSha256:hash(readFileSync(startPath)),counts});
}
const report={schema:1,studyProtocolSha256:hash(readFileSync(join(study,'protocol.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),totals,rows,scope:'Same-observation frozen policy decomposition; not causal effects or training labels.'};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(totals));
