import test from 'node:test';
import assert from 'node:assert/strict';
import {createCueSharedSteering,freezeCueSharedSteering,cueSteeringRoute} from '../learning/cue-shared-steering.mjs';
import {certifyCueNative} from '../learning/cue-native-proof.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

function score(state,context,features){return state.weights.map((row,action)=>row.reduce((sum,value,index)=>sum+(value+state.contextWeights[context][action][index])*features[index],0));}
test('exact equality is safe, near ties and invalid observations fall back',()=>{
  const state=createCueSharedSteering(1,12);freezeCueSharedSteering(state);const raw=Array(17).fill(0),own={raw,energy:10,cue:[0,0,0,0]},work={scalarOperations:0},scratch={};
  assert.equal(certifyCueNative(state,own,work,scratch),true);assert.equal(scratch.reason,1);state.weights[0][0]=1e-14;
  assert.equal(certifyCueNative(state,own,work,scratch),false);state.weights[0][0]=1;
  assert.equal(certifyCueNative(state,own,work,scratch),true);assert.equal(scratch.reason,2);
  own.cue=[1,0,1,1];assert.equal(certifyCueNative(state,own,work,scratch),false);
});
test('certified native choice holds for all legal spatial feature extremes',()=>{
  let seed=989123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};let successes=0;
  for(let trial=0;trial<600;trial++){
    const state=createCueSharedSteering(1,trial+1);freezeCueSharedSteering(state);
    for(const row of state.weights)for(let index=0;index<8;index++)row[index]=(random()-.5)*2;
    for(const bank of state.contextWeights)for(const row of bank)for(let index=0;index<8;index++)row[index]=(random()-.5)*2;
    if(trial%2===0)state.weights[0][0]+=8;
    const raw=Array(17).fill(0);raw[12]=2*random()-1;raw[13]=2*random()-1;const cue=Array.from({length:4},()=>random()<.5?-1:1),energy=120*random();
    const safe=certifyCueNative(state,{raw,energy,cue},{scalarOperations:0},{});if(!safe)continue;successes++;
    const context=cueSteeringRoute(cue),known=[1,energy/120,0,0,raw[13],raw[12]];
    for(const distance of [0,.5,1])for(const bearing of [-1,0,1]){const values=score(state,context,[...known,distance,bearing]);assert.ok(values[0]>=values[1]);}
  }
  assert.ok(successes>100);
});
const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
function anchor(){
  const run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',auditSnapshots:true});run.advance(15);
  const checkpoint=run.checkpoint(false);for(const [index,fly]of checkpoint.world.world.flies.entries()){fly.x=index<2?6:500;fly.y=300;fly.heading=index<2?Math.PI:0;}
  return checkpoint;
}
test('reset tie proof preserves commands and RNG while recording unknown availability',()=>{
  const start=anchor(),events={baseline:[],proof:[]},settings={phase:'transfer',seed:1004137408,compactFrozen:true,wallShortcut:true,mode:'reset'};
  const baseline=OdorRoutedExperiment.fork(start,{...settings,emit:event=>events.baseline.push(structuredClone(event))});
  const proof=OdorRoutedExperiment.fork(start,{...settings,cueNativeProof:true,emit:event=>events.proof.push(structuredClone(event))});
  assert.deepEqual(baseline.world.checkpoint(),proof.world.checkpoint());baseline.advance(1);proof.advance(1);
  const certified=events.proof.filter(event=>event.type==='decision'&&event.cueNativeProof);assert.ok(certified.length>0);
  for(const event of certified){
    const original=events.baseline.find(item=>item.type==='decision'&&item.id===event.id);assert.equal(event.cueNativeProof.reason,1);
    assert.equal(original.steering.action,0);assert.deepEqual(event.outputs,original.outputs);assert.equal(event.available,null);assert.equal(event.guard,null);assert.equal(event.recommendation,null);
    assert.equal(event.storageBytes,encodedStateBytes(event.auditState));assert.equal(proof.learners[event.id].steering.rngState,baseline.learners[event.id].steering.rngState);
  }
  assert.equal(proof.statistics.transfer.unknownAvailability,certified.length);
});
test('proof falls back for a possibly superior midpoint and restores exact state',()=>{
  const start=anchor();for(const fly of start.world.world.flies){const state=start.state.learners[fly.id].steering;for(const row of state.weights)row.fill(0);for(const bank of state.contextWeights)for(const row of bank)row.fill(0);state.contextWeights[0][1][0]=2;}
  const events=[],run=OdorRoutedExperiment.fork(start,{phase:'transfer',seed:1004137408,wallShortcut:true,cueNativeProof:true,emit:event=>events.push(structuredClone(event))});
  assert.throws(()=>OdorRoutedExperiment.fork(start,{phase:'transfer',seed:1004137408,wallShortcut:true,cueNativeProof:true,steeringMode:'guarded'}));
  run.advance(1);assert.ok(events.some(event=>event.type==='decision'&&!event.wallShortcut&&event.cueNativeProof===null&&event.recommendation));
  run.advance(10);const restored=OdorRoutedExperiment.restore(run.checkpoint());run.advance(10);restored.advance(10);assert.deepEqual(run.checkpoint(),restored.checkpoint());
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);for(const state of Object.values(run.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
