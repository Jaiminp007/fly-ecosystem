import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-fixture/20261026-v2');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(root,name))),expected);
const rows=[];
for(const arm of protocol.arms){
  const start=read(join(base,arm+'-start.json')),final=read(join(base,arm+'-final.json'));
  const learners=Object.fromEntries(Object.entries(start.state.learners).map(([id,state])=>[id,structuredClone(state.steering)]));
  const traits=Object.fromEntries(start.world.world.flies.map(fly=>[fly.id,fly.genome.traits]));
  let decisions=0,available=0,midpoints=0,terminals=0;
  function estimate(state,features){return state.weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*features[index],0));}
  function update(state,energy,nextFeatures,canUse,terminal){
    const pending=state.pending,old=estimate(state,pending.features)[pending.action];
    const next=terminal?null:estimate(state,nextFeatures),bootstrap=terminal?0:canUse?Math.max(...next):next[0];
    const delta=(energy-pending.energy)/120+Math.exp(-1/256)*bootstrap-old;
    for(let index=0;index<8;index++)state.weights[pending.action][index]=Math.max(-8,Math.min(8,state.weights[pending.action][index]+.05*delta*pending.features[index]));
    state.work.scalarOperations+=terminal?81:113;state.updates++;state.pending=null;
  }
  const tape=readFileSync(join(base,arm+'.jsonl'));
  for(const line of tape.toString().trimEnd().split('\n')){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const state=learners[event.id],own=event.own,raw=own.raw,point=event.recommendation.point,distance=Math.hypot(...point);
      assert.equal(own.agentId,event.id);assert.equal(own.tick,event.tick);
      const features=[1,Math.max(0,Math.min(1,own.energy/120)),raw[10],raw[11],raw[13],Math.max(-1,Math.min(1,raw[12])),Math.min(1,distance/traits[event.id].sense),distance>0?point[1]/distance:0];
      assert.deepEqual(event.features,features);
      const canUse=event.recommendation.pair[0]>=0&&!event.guard.wall&&event.guard.viable;assert.equal(event.available,canUse);
      if(state.pending){assert.equal(event.tick,state.pending.tick+1);update(state,own.energy,features,canUse,false);}
      const predictions=estimate(state,features);state.work.scalarOperations+=32;
      assert.deepEqual(event.steering.predictions,predictions);
      const best=canUse&&predictions[1]>predictions[0]?1:0;
      let random=state.rngState;random^=random<<13;random^=random>>>17;random^=random<<5;state.rngState=random>>>0;state.work.scalarOperations+=9;
      const proposed=canUse&&state.rngState/4294967296<.1?1-best:best;
      const action=arm==='native'?0:arm==='guarded'?Number(canUse):proposed;
      assert.equal(event.steering.proposed,proposed);assert.equal(event.steering.action,action);assert.equal(event.steeringWork,state.work.scalarOperations);
      state.pending={tick:event.tick,energy:own.energy,action,features:[...features]};state.lastDecisionTick=event.tick;
      const sine=action&&distance>0?point[1]/distance:raw[2]-raw[1];
      assert.equal(event.outputs[0],Math.tanh(2*sine+1.8*(raw[10]-raw[11])));assert.ok(event.work>=event.steeringWork);
      decisions++;available+=Number(canUse);midpoints+=action;
    }else if(event.type==='observe'&&event.own.terminal){
      const state=learners[event.own.agentId];assert.equal(event.own.tick,state.pending.tick);
      update(state,event.own.energy,null,false,true);state.dead=true;terminals++;
    }
  }
  for(const [id,state]of Object.entries(learners))assert.deepEqual(state,final.state.learners[id].steering);
  rows.push({arm,decisions,available,midpoints,terminals,traceSha256:hash(tape)});
}
assert.ok(rows.every(row=>row.available>0&&row.terminals>0));
assert.ok(rows.find(row=>row.arm==='learned').midpoints>0);assert.equal(rows.find(row=>row.arm==='native').midpoints,0);
const report={schema:1,passed:true,rows,scope:'Independent reconstruction of fixture features, availability from reported guard, own-action temporal updates, RNG, control override, steering work counter and final learner state. Does not independently reconstruct physical observations, guard, total operation costs, storage/debt or dynamics.'};
writeFileSync(join(base,'steering-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
