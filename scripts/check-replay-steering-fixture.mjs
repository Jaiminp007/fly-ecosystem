import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/replay-steering-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
function advance(seed){let value=seed;value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;}
function values(state,features){return state.weights.map(row=>row.reduce((sum,value,index)=>sum+value*features[index],0));}
function update(state,record,rate){
  const predicted=values(state,record.features)[record.action];
  const next=record.terminal?0:values(state,record.nextFeatures),target=record.terminal?0:record.available?Math.max(...next):next[0];
  const error=record.reward+Math.exp(-1/256)*target-predicted;
  state.weights[record.action]=state.weights[record.action].map((weight,index)=>Math.max(-8,Math.min(8,weight+rate*error*record.features[index])));
}
function transition(state,energy,features,available,terminal){
  const pending=state.pending,record={agentId:state.agentId,tick:pending.tick,action:pending.action,features:pending.features,
    nextFeatures:terminal?null:features,available:terminal?false:available,reward:(energy-pending.energy)/120,terminal};
  update(state,record,.05);state.updates++;state.seen++;
  state.work.scalarOperations+=(terminal?12:20)+(terminal?76:108)+2;
  if(state.memory.length<32)state.memory.push(record);
  else{state.retentionRngState=advance(state.retentionRngState);const index=Math.floor(state.retentionRngState/4294967296*state.seen);state.work.scalarOperations+=10;if(index<32)state.memory[index]=record;}
  state.replayRngState=advance(state.replayRngState);const sample=state.memory[Math.floor(state.replayRngState/4294967296*state.memory.length)];
  update(state,sample,.01);state.replayUpdates++;state.pending=null;state.work.scalarOperations+=9+(sample.terminal?76:108);
}
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const rows=[];
for(const arm of protocol.arms){
  const start=read(join(base,arm+'-start.json')),states=structuredClone(start.state.learners),pending={};let decisions=0,updates=0,terminals=0;
  const stream=createReadStream(join(base,arm+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const before=states[event.id].steering,expected=structuredClone(before),own=event.own;
      if(expected.pending){assert.equal(expected.pending.tick+1,event.tick);transition(expected,own.energy,event.features,event.available,false);updates++;}
      const predictions=values(expected,event.features),best=event.available&&predictions[1]>predictions[0]?1:0;
      expected.rngState=advance(expected.rngState);const proposed=event.available&&expected.rngState/4294967296<.1?1-best:best;
      const action=arm==='native'?0:arm==='guarded'?Number(event.available):proposed;
      expected.pending={tick:event.tick,energy:own.energy,action,features:event.features};expected.lastDecisionTick=event.tick;expected.work.scalarOperations+=49;
      assert.deepEqual(event.steering,{action,proposed,predictions});assert.deepEqual(event.auditState.steering,expected);
      states[event.id]=event.auditState;pending[event.id]=event.tick;decisions++;
    }else if(event.type==='observe'){
      const id=event.own.agentId,expected=structuredClone(states[id].steering);assert.equal(pending[id],event.own.tick);
      if(event.own.terminal){assert.equal(expected.pending.tick,event.own.tick);transition(expected,event.own.energy,null,false,true);expected.dead=true;updates++;terminals++;}
      assert.deepEqual(event.auditState.steering,expected);states[id]=event.auditState;delete pending[id];
    }
  }
  assert.equal(Object.keys(pending).length,0);const final=read(join(base,arm+'-final.json'));
  for(const [id,state]of Object.entries(states))assert.deepEqual(state,final.state.learners[id]);
  rows.push({arm,decisions,updates,terminals,traceSha256:digest.digest('hex')});
}
const report={schema:1,passed:true,rows,scope:'Independent reconstruction of steering decisions, own factual replay records, reservoir RNG, weights and declared steering work; not independent physical dynamics or low-level cost adequacy.'};
writeFileSync(join(base,'steering-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
