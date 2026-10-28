import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1'),diagnosis=join(root,'evidence/own-steering-motor-diagnosis/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=value=>createHash('sha256').update(value).digest('hex');
const input=read(join(diagnosis,'protocol.json')),protocol=read(join(base,'protocol.json')),result=read(join(diagnosis,'results.json'));
assert.equal(sha(readFileSync(join(base,'protocol.json'))),input.developmentProtocolSha256);
assert.equal(sha(readFileSync(join(base,'results.json'))),input.developmentResultsSha256);
assert.equal(sha(readFileSync(join(root,'scripts/diagnose-own-steering-motor.mjs'))),input.sourceSha256);
assert.equal(sha(readFileSync(join(root,'docs/OWN_STEERING_MOTOR_DIAGNOSIS.md'))),input.designSha256);
let total=0;const aggregate={A:[0,0,0],B:[0,0,0],C:[0,0,0]},changes={AtoB:0,BtoC:0,AtoC:0};
for(const history of protocol.histories){
  const original=read(join(base,'rows',history.seed+'.json'));if(!original.anchorPhases.includes('C'))continue;
  const row=read(join(diagnosis,history.seed+'.json')),models={};
  for(const phase of ['A','B','C']){
    const bytes=readFileSync(join(base,'anchors',history.seed+'-'+phase+'.json'));assert.equal(sha(bytes),row.anchorSha256[phase]);models[phase]=JSON.parse(bytes).state.learners;
  }
  const counts={A:[0,0,0],B:[0,0,0],C:[0,0,0]},changed={AtoB:0,BtoC:0,AtoC:0};let decisions=0,events=0;
  const name=history.seed+'-probe-transfer-current',stream=createReadStream(join(base,'traces',name+'.jsonl')),digest=createHash('sha256');stream.on('data',block=>digest.update(block));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;if(event.type!=='decision')continue;
    const raw=event.own.raw,contact=event.own.contactPresent;
    const features=[1,raw[0]/4,raw[1]/4,raw[2]/4,raw[3]/4,raw[4]/4,raw[10]/4,raw[11]/4,raw[13]/4,contact?.25:0,raw[3]*raw[0]/4,raw[3]*raw[13]/4,contact?raw[13]/4:0],actions={};
    for(const phase of ['A','B','C']){
      const weights=models[phase][event.id].weights,values=weights.map(vector=>vector.reduce((sum,weight,index)=>sum+weight*features[index],0));
      const action=values[2]>=values[1]&&values[2]>=values[0]?2:values[1]>=values[0]?1:0;
      actions[phase]=action;counts[phase][action]++;aggregate[phase][action]++;
    }
    assert.equal(actions.C,event.choice.action);changed.AtoB+=Number(actions.A!==actions.B);changed.BtoC+=Number(actions.B!==actions.C);changed.AtoC+=Number(actions.A!==actions.C);decisions++;
  }
  assert.equal(digest.digest('hex'),original.traces[name].sha256);assert.equal(events,original.traces[name].events);assert.equal(decisions,row.decisions);
  for(const phase of ['A','B','C'])assert.deepEqual(counts[phase],row.phases[phase].actions);
  assert.deepEqual(changed,row.changes);for(const key of Object.keys(changes))changes[key]+=changed[key];total+=decisions;
}
assert.equal(total,result.decisions);assert.deepEqual(changes,result.changes);
for(const phase of ['A','B','C'])assert.deepEqual(aggregate[phase],result.phases[phase].actions);
const report={schema:1,passed:true,decisions:total,aggregate,changes,scope:'Independent feature and greedy-action reconstruction from logged observations and own saved weights; not a counterfactual outcome or physical replay.'};
writeFileSync(join(diagnosis,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
