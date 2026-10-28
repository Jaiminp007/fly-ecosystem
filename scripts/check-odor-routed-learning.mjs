import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=process.argv[2]?join(root,process.argv[2]):join(root,'evidence/odor-routed-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const canonical=value=>JSON.stringify(value),discount=Math.exp(-1/256);
function advance(value){let next=value;next^=next<<13;next^=next>>>17;next^=next<<5;return next>>>0;}
function scores(weights,phi){return weights.map(vector=>vector.reduce((sum,weight,index)=>sum+weight*phi[index],0));}
function expectedValue(weights,phi){const values=scores(weights,phi);let best=2;for(let index=1;index>=0;index--)if(values[index]>values[best])best=index;return .9*values[best]+.1*(values[0]+values[1]+values[2])/3;}
function compareMatrix(actual,expected){assert.equal(actual.length,expected.length);for(let row=0;row<actual.length;row++){assert.equal(actual[row].length,expected[row].length);for(let index=0;index<actual[row].length;index++)close(actual[row][index],expected[row][index]);}}
function checkUpdate(before,after,nextEnergy,nextPhi,terminal){
  const pending=before.pending;assert.ok(pending);const weights=structuredClone(before.weights),eligibility=structuredClone(before.eligibility);
  const reward=(nextEnergy-pending.energy)/120,prediction=scores(weights,pending.phi)[pending.action];
  const delta=reward+(terminal?0:discount*expectedValue(weights,nextPhi))-prediction;
  for(let action=0;action<3;action++)for(let index=0;index<13;index++){
    eligibility[action][index]=discount*.9*eligibility[action][index]+(action===pending.action?pending.phi[index]:0);
    weights[action][index]=Math.max(-8,Math.min(8,weights[action][index]+.05*delta*eligibility[action][index]));
  }
  const record={agentId:before.agentId,tick:pending.tick,action:pending.action,phi:pending.phi,nextPhi:terminal?Array(13).fill(0):nextPhi,reward,terminal};
  const memory=structuredClone(before.memory);let retentionRng=before.retentionRngState;
  if(memory.length<32)memory.push(record);
  else{retentionRng=advance(retentionRng);const index=Math.floor(retentionRng/4294967296*(before.memorySeen+1));if(index<32)memory[index]=record;}
  assert.equal(canonical(memory),canonical(after.memory));assert.equal(after.memorySeen,before.memorySeen+1);assert.equal(after.retentionRngState,retentionRng);
  const replayRng=advance(before.replayRngState),replay=memory[Math.floor(replayRng/4294967296*memory.length)];assert.equal(after.replayRngState,replayRng);
  const replayPrediction=scores(weights,replay.phi)[replay.action],target=replay.reward+(replay.terminal?0:discount*expectedValue(weights,replay.nextPhi)),error=target-replayPrediction;
  for(let index=0;index<13;index++)weights[replay.action][index]=Math.max(-8,Math.min(8,weights[replay.action][index]+.01*error*replay.phi[index]));
  if(terminal)for(const vector of eligibility)vector.fill(0);
  compareMatrix(after.weights,weights);compareMatrix(after.eligibility,eligibility);
  assert.equal(after.transitions,before.transitions+1);assert.equal(after.work.liveUpdates,before.work.liveUpdates+1);assert.equal(after.work.replayUpdates,before.work.replayUpdates+1);
}
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const rows=[];
for(const arm of protocol.arms){
  const start=read(join(base,arm+'-start.json')),states=structuredClone(start.state.learners),pending={};let updates=0,terminalUpdates=0,routeBoundaries=0;
  const stream=createReadStream(join(base,arm+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const before=states[event.id],after=event.auditState,route=event.own.odorPresent?'present':'absent',bankBefore=before.banks[route],bankAfter=after.banks[route];
      const raw=event.own.raw,phi=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),event.own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,event.own.contactPresent?raw[13]*.25:0];
      if(before.route!==null&&before.route!==route){assert.equal(bankBefore.pending,null);routeBoundaries++;}
      if(bankBefore.pending){assert.equal(event.tick,bankBefore.pending.tick+1);checkUpdate(bankBefore,bankAfter,event.own.energy,phi,false);updates++;}
      else{compareMatrix(bankAfter.weights,bankBefore.weights);assert.equal(canonical(bankAfter.memory),canonical(bankBefore.memory));}
      states[event.id]=after;pending[event.id]=event.tick;
    }else if(event.type==='observe'){
      const id=event.own.agentId,before=states[id],after=event.auditState;assert.equal(pending[id],event.own.tick);
      if(event.own.terminal){const bankBefore=before.banks[before.route],bankAfter=after.banks[before.route];assert.equal(bankBefore.pending.tick,event.own.tick);checkUpdate(bankBefore,bankAfter,event.own.energy,null,true);updates++;terminalUpdates++;}
      states[id]=after;delete pending[id];
    }
  }
  assert.equal(Object.keys(pending).length,0);
  const final=read(join(base,arm+'-final.json'));for(const [id,state]of Object.entries(states))assert.deepEqual(state,final.state.learners[id]);
  rows.push({arm,updates,terminalUpdates,routeBoundaries,traceSha256:digest.digest('hex')});
}
const report={schema:1,passed:true,rows,scope:'Independent routed-bank TD, eligibility, own reservoir selection and replay reconstruction using factual logged observations; not independent physical dynamics or low-level cost adequacy.'};
writeFileSync(join(base,'learning-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
