import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {predictTargetTaste} from '../learning/odor-routed-taste.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',contactCueMode:'filter'};
function bias(run){for(const state of Object.values(run.learners)){state.taste.weights.fill(0);state.taste.weights[0]=-8;for(const row of state.steering.weights)row.fill(0);state.steering.weights[1][0]=8;for(const bank of state.steering.contextWeights)for(const row of bank)row.fill(0);}}

test('target predictions use own weights and absent odor is explicitly neutral',()=>{
  const run=new OdorRoutedExperiment(options),state=run.learners[1];state.taste.weights[0]=-8;const before=state.work.scalarOperations;
  assert.ok(predictTargetTaste(state,[1,-1,1,-1])<.5);assert.equal(state.work.scalarOperations-before,37);
  const next=state.work.scalarOperations;assert.equal(predictTargetTaste(state,[0,0,0,0]),1);assert.equal(state.work.scalarOperations-next,2);
  assert.throws(()=>predictTargetTaste(state,[1,0,1,1]));
});

test('matched cue interface bills equal access and trains the executed action',()=>{
  const observe=new OdorRoutedExperiment({...options,targetCueMode:'observe'}),filter=new OdorRoutedExperiment({...options,targetCueMode:'filter'});bias(observe);bias(filter);
  let witnessed=false;const seen=[];
  for(const [index,run]of [observe,filter].entries())run.attach(event=>{if(event.type==='decision'&&event.targetEvaluation?.reject&&event.steering.proposed===1){
    const state=run.learners[event.id];if(index===1){assert.equal(event.steering.action,0);assert.equal(state.steering.pending.action,0);witnessed=true;}seen[index]??=event;
  }});
  observe.advance(1);filter.advance(1);assert.ok(witnessed);assert.ok(seen[0]&&seen[1]);assert.equal(seen[0].id,seen[1].id);
  assert.deepEqual(seen[0].targetEvaluation,seen[1].targetEvaluation);assert.ok(Math.abs(seen[1].requestedExtra-seen[0].requestedExtra-2*filter.pricing.operationEnergy)<1e-12);assert.equal(seen[0].storageBytes,seen[1].storageBytes);
  assert.equal(seen[0].steering.action,1);assert.equal(seen[1].steering.action,0);
  filter.attach(null);const restored=OdorRoutedExperiment.restore(filter.checkpoint());filter.advance(5);restored.advance(5);assert.deepEqual(filter.checkpoint(),restored.checkpoint());
});

test('transfer masks target cues and shortcuts cannot silently bypass sensing',()=>{
  const run=new OdorRoutedExperiment(options);run.advance(3);const anchor=run.checkpoint(false),probe=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,targetCueMode:'filter'});let decisions=0;
  probe.attach(event=>{if(event.type==='decision'){decisions++;assert.ok(probe.learners[event.id].targetCues.every(cue=>cue.every(value=>value===0)));if(event.available)assert.deepEqual(event.targetEvaluation,{scores:[1,1],reject:false});}});
  probe.advance(10);assert.ok(decisions>0);assert.throws(()=>OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,targetCueMode:'filter',wallShortcut:true}));
  assert.throws(()=>OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,targetCueMode:'filter',wallShortcut:true,cueNativeProof:true}));
});
