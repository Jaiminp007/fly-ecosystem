import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1');
const output=join(root,'evidence/own-steering-motor-diagnosis/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const protocol=read(join(base,'protocol.json'));
mkdirSync(join(root,'evidence/own-steering-motor-diagnosis'),{recursive:true});mkdirSync(output,{recursive:false});
const manifest={schema:1,kind:'saved-own-motor-value-diagnostic',developmentProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),
  developmentResultsSha256:hash(readFileSync(join(base,'results.json'))),sourceSha256:hash(readFileSync(fileURLToPath(import.meta.url))),
  designSha256:hash(readFileSync(join(root,'docs/OWN_STEERING_MOTOR_DIAGNOSIS.md'))),scope:'Factual visited-state descriptions on reused histories, not counterfactual outcomes or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const rows=[];
for(const history of protocol.histories){
  const baseRow=read(join(base,'rows',history.seed+'.json'));
  if(!baseRow.anchorPhases.includes('C')){rows.push({seed:history.seed,missingC:true});continue;}
  assert.ok(['A','B','C'].every(phase=>baseRow.anchorPhases.includes(phase)));
  const anchors=Object.fromEntries(['A','B','C'].map(phase=>{
    const path=join(base,'anchors',history.seed+'-'+phase+'.json');return [phase,{snapshot:read(path),sha256:hash(readFileSync(path))}];
  }));
  const label=history.seed+'-probe-transfer-current',expected=baseRow.traces[label],stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');
  stream.on('data',chunk=>digest.update(chunk));let decisions=0,events=0;
  const phases=Object.fromEntries(['A','B','C'].map(phase=>[phase,{actions:[0,0,0],valueSums:[0,0,0],stationaryVsFullSum:0}]));
  const changes={AtoB:0,BtoC:0,AtoC:0},founders={};
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;if(event.type!=='decision')continue;
    const own=event.own,raw=own.raw;assert.equal(own.agentId,event.id);assert.equal(own.tick,event.tick);assert.equal(own.odorPresent,false);
    assert.equal(event.choice.accept,true);assert.equal(event.choice.feedProbability,1);
    const phi=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,own.contactPresent?raw[13]*.25:0];
    const actions={};
    for(const phase of ['A','B','C']){
      const checkpoint=anchors[phase].snapshot,model=checkpoint.state.learners[event.id];assert.equal(model.agentId,event.id);
      assert.ok(checkpoint.world.world.flies.some(fly=>fly.id===event.id));
      const values=model.weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*phi[index],0));
      let action=2;for(let index=1;index>=0;index--)if(values[index]>values[action])action=index;
      actions[phase]=action;const tally=phases[phase];tally.actions[action]++;for(let index=0;index<3;index++)tally.valueSums[index]+=values[index];
      tally.stationaryVsFullSum+=values[0]-values[2];
    }
    assert.equal(actions.C,event.choice.action);changes.AtoB+=Number(actions.A!==actions.B);changes.BtoC+=Number(actions.B!==actions.C);changes.AtoC+=Number(actions.A!==actions.C);
    const body=founders[event.id]??={decisions:0,actionsA:[0,0,0],actionsB:[0,0,0],actionsC:[0,0,0]};
    body.decisions++;for(const phase of ['A','B','C'])body['actions'+phase][actions[phase]]++;decisions++;
  }
  assert.equal(events,expected.events);assert.equal(digest.digest('hex'),expected.sha256);
  const row={seed:history.seed,missingC:false,decisions,phases,changes,founders,anchorSha256:Object.fromEntries(Object.entries(anchors).map(([phase,value])=>[phase,value.sha256])),traceSha256:expected.sha256};
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(row,null,2)+'\n',{flag:'wx'});rows.push(row);console.log(JSON.stringify({seed:history.seed,decisions,actions:Object.fromEntries(Object.entries(phases).map(([phase,value])=>[phase,value.actions])),changes}));
}
const observed=rows.filter(row=>!row.missingC),decisions=observed.reduce((sum,row)=>sum+row.decisions,0);
const phases=Object.fromEntries(['A','B','C'].map(phase=>[phase,{actions:[0,1,2].map(index=>observed.reduce((sum,row)=>sum+row.phases[phase].actions[index],0)),
  meanValues:[0,1,2].map(index=>observed.reduce((sum,row)=>sum+row.phases[phase].valueSums[index],0)/decisions),
  meanStationaryVsFull:observed.reduce((sum,row)=>sum+row.phases[phase].stationaryVsFullSum,0)/decisions}]));
const changes=Object.fromEntries(['AtoB','BtoC','AtoC'].map(key=>[key,observed.reduce((sum,row)=>sum+row.changes[key],0)]));
const result={schema:1,qualified:false,observedHistories:observed.length,missingHistories:rows.filter(row=>row.missingC).map(row=>row.seed),decisions,phases,changes,scope:manifest.scope};
writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
