import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/residual-proof-transfer/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}
  if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
function advance(seed){let value=seed;value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;}
function route(cue){if(cue.every(value=>value===0))return 0;assert.ok(cue.every(value=>value===-1||value===1));return 1+cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);}
function proof(state,own){
  const raw=own.raw,context=route(own.cue),known=[1,Math.max(0,Math.min(1,own.energy/120)),raw[10],raw[11],raw[13],Math.max(-1,Math.min(1,raw[12]))],bank=state.contextWeights[context];
  let upper=0,magnitude=1,equal=true;
  for(let index=0;index<8;index++){
    const positive=state.weights[1][index]+bank[1][index],negative=state.weights[0][index]+bank[0][index],difference=positive-negative;
    assert.ok(Number.isFinite(positive)&&Number.isFinite(negative));equal=equal&&positive===negative;magnitude+=Math.abs(positive)+Math.abs(negative);
    if(index<6)upper+=difference*known[index];else if(index===6)upper+=Math.max(0,difference)*(1+1e-12);else upper+=Math.abs(difference)*(1+1e-12);
  }
  upper+=1e-12*magnitude;return {route:context,upper,reason:equal?1:upper<0?2:0,known};
}
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
const {CoverageExperiment}=await import(pathToFileURL(join(base,'sources/learning/coverage-experiment.mjs')).href);
let decisions=0,receipts=0,replays=0,wallSkips=0,proofSkips=0,sensorChecks=0,maskedBodies=0;const rows=[];
for(const input of protocol.inputs){
  const anchor=read(join(root,input.anchor)),row=read(join(base,'rows',input.history.seed+'.json'));assert.equal(hash(readFileSync(join(root,input.anchor))),input.anchorSha256);let commonWorld=null;
  for(const arm of protocol.arms){
    const label=input.history.seed+'-'+arm,initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),pricing=initial.state.pricing;
    const worldHash=hash(JSON.stringify(initial.world));if(commonWorld===null)commonWorld=worldHash;else assert.equal(worldHash,commonWorld);assert.equal(worldHash,row.arms[arm].startWorldSha256);
    let reconstructed;
    if(arm==='native-full')reconstructed=CoverageExperiment.fork({...structuredClone(anchor),kind:'coverage-world'},{phase:'transfer',seed:input.history.probeSeeds.transfer,mode:'native-full'});
    else{
      reconstructed=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:input.history.probeSeeds.transfer,mode:arm==='reset'?'reset':'current',steeringMode:['native','guarded'].includes(arm)?arm:'learned',compactFrozen:true,wallShortcut:arm!=='standard',cueNativeProof:['proof','reset','native'].includes(arm)});
      for(const fly of reconstructed.world.flies){const state=reconstructed.learners[fly.id];for(const weights of state.steering.weights)weights.fill(0);state.work.scalarOperations+=16;state.charge.storageBytes=0;
        const operations=state.work.scalarOperations-state.charge.operationsBilled;assert.equal(operations,16);const due=operations*pricing.operationEnergy;state.charge.operationsBilled=state.work.scalarOperations;state.charge.outstandingEnergy+=due;state.charge.incurredEnergy+=due;maskedBodies++;}
    }
    assert.deepEqual(reconstructed.checkpoint(false),initial);
    const storage={},paid={},pending={},digest=createHash('sha256'),steering=Object.fromEntries(Object.entries(initial.state.learners).filter(([,state])=>state.steering).map(([id,state])=>[id,structuredClone(state.steering)]));let events=0;
    const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        if(event.steering){
          const state=steering[event.id],wall=event.wallShortcut===true,proofEnabled=['proof','reset','native'].includes(arm);let proved=false;
          if(wall){assert.ok(event.own.raw[10]!==0||event.own.raw[11]!==0);assert.equal(event.available,false);assert.equal(event.guard.wall,true);wallSkips++;}
          else if(proofEnabled){const expected=proof(state,event.own);proved=expected.reason!==0;if(proved){assert.deepEqual(event.cueNativeProof,expected);assert.equal(event.available,null);assert.equal(event.guard,null);proofSkips++;}else assert.equal(event.cueNativeProof,null);}
          if(wall||proved){assert.equal(event.recommendation,null);assert.equal(event.features,null);assert.equal(event.steering.predictions,null);assert.equal(event.steering.action,0);}
          else{const context=route(event.own.cue),predictions=state.weights.map((weights,action)=>weights.reduce((sum,value,index)=>sum+(value+state.contextWeights[context][action][index])*event.features[index],0));
            assert.deepEqual(event.steering.predictions,predictions);const action=arm==='native'?0:arm==='guarded'?Number(event.available):Number(event.available&&predictions[1]>predictions[0]);assert.equal(event.steering.action,action);}
          state.rngState=advance(state.rngState);state.work.scalarOperations+=wall||proved?9:66;state.lastDecisionTick=event.tick;
          assert.equal(event.steeringWork,state.work.scalarOperations);assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);
        }
        decisions++;
      }else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,row.arms[arm].trace.events);assert.equal(digest.digest('hex'),row.arms[arm].trace.sha256);
    for(const [id,state]of Object.entries(final.state.learners)){
      const prior=initial.state.learners[id],charge=state.charge;
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
      if(state.steering){if(state.steering.dead)steering[id].dead=true;assert.deepEqual(state.steering,steering[id]);assert.deepEqual(state.taste.weights,prior.taste.weights);for(const context of ['present','absent'])assert.deepEqual(state.banks[context].weights,prior.banks[context].weights);}
    }
    if(arm!=='native-full'){
      const original=reconstructed.world.sensors.bind(reconstructed.world);
      Object.defineProperty(reconstructed.world,'sensors',{configurable:true,enumerable:false,value:(fly,foodIndex,agentIndex,challenge)=>{
        const state=reconstructed.learners[fly.id],before=state.work.scalarOperations,scan=bytes(state.spatialPoints)+bytes(state.scratch.bins??{});let sensed=[];
        const shared={nearby:(body,radius)=>{sensed=foodIndex.nearby(body,radius);return sensed;}};
        const raw=original(fly,shared,agentIndex,challenge),wall=raw[10]!==0||raw[11]!==0;
        const expected=arm==='standard'?2+sensed.length+9*state.spatialPoints.length:wall?4+scan+2:4+2+sensed.length+9*state.spatialPoints.length;
        assert.equal(state.work.scalarOperations-before,expected);if(arm!=='standard')assert.equal(state.wallSkip,wall);sensorChecks++;return raw;
      }});
    }
    const replayDigest=createHash('sha256');let replayEvents=0;reconstructed.attach(event=>{if(event.type==='decision')assert.equal(event.storageBytes,bytes(reconstructed.learners[event.id]));replayDigest.update(JSON.stringify(event)+'\n');replayEvents++;});
    const endpoint=reconstructed.advance(protocol.ticks);reconstructed.attach(null);assert.deepEqual(endpoint,row.arms[arm].endpoint);assert.deepEqual(reconstructed.checkpoint(false),final);
    assert.equal(replayEvents,events);assert.equal(replayDigest.digest('hex'),row.arms[arm].trace.sha256);replays++;
  }
  rows.push(row);console.log(JSON.stringify({seed:input.history.seed,decisions,replays,proofSkips}));
}
const result=read(join(base,'results.json'));for(const control of ['standard','wall-only','reset','native','guarded','native-full']){
  const values=rows.map(row=>{const current=row.arms.proof.endpoint,reference=row.arms[control].endpoint,effect=row.effects[control];close(effect.energy,current.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder);assert.equal(effect.survivors,current.survivors-reference.survivors);return effect;});
  close(result.comparisons[control].meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/8);assert.equal(result.comparisons[control].positiveHistories,values.filter(value=>value.energy>0).length);
  assert.equal(result.comparisons[control].survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));
}
assert.equal(decisions,receipts);const report={schema:1,passed:true,decisions,receipts,replays,wallSkips,proofSkips,sensorChecks,maskedBodies,
  scope:'Independent mask/setup, cue proofs, frozen steering/RNG, sensor work, encoded state, ledger and outcome arithmetic plus captured-source replay; not independent physics or complete low-level energy adequacy.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
