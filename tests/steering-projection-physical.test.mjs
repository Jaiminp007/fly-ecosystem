import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {createCueSharedSteering,chooseCueSharedSteering,terminateCueSharedSteering} from '../learning/cue-shared-steering.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe',cueTastePolicy:'shared-plus-cue'};
const features=[1,.5,0,0,.2,0,.3,.1],cue=[1,-1,1,-1];

test('matched steering modes use own pending actions and identical work',()=>{
  const control=createCueSharedSteering(1,33,'control'),candidate=createCueSharedSteering(1,33,'project');
  assert.equal(encodedStateBytes(control),encodedStateBytes(candidate));
  for(let tick=1;tick<=4;tick++)for(const model of [control,candidate])chooseCueSharedSteering(model,{agentId:1,tick,energy:20+tick,features,midpointAvailable:true,cue},{forcedAction:0});
  assert.equal(control.work.scalarOperations,candidate.work.scalarOperations);assert.deepEqual(control.projection,candidate.projection);
  assert.equal(control.projection.counts[0],3);assert.equal(control.projection.counts[1],0);assert.equal(control.projection.lastTick,3);
  assert.notDeepEqual(control.weights,candidate.weights);assert.equal(encodedStateBytes(control),encodedStateBytes(candidate));
  for(const model of [control,candidate])terminateCueSharedSteering(model,{agentId:1,tick:4,energy:0});
  assert.equal(control.work.scalarOperations,candidate.work.scalarOperations);assert.equal(candidate.projection.counts[0],4);
});

test('physical matched controls retain, reset, bill and restore projection state',()=>{
  const runs=['control','project'].map(steeringProjection=>new OdorRoutedExperiment({...options,steeringProjection,auditSnapshots:true})),events=[[],[]];
  for(const [index,run]of runs.entries())run.attach(event=>{if(event.type==='decision'){events[index].push(event);assert.equal(event.storageBytes,encodedStateBytes(event.auditState));}});
  assert.deepEqual(runs[0].world.checkpoint(),runs[1].world.checkpoint());runs.forEach(run=>run.advance(1));
  for(let index=0;index<events[0].length;index++){assert.equal(events[0][index].storageBytes,events[1][index].storageBytes);assert.equal(events[0][index].requestedExtra,events[1][index].requestedExtra);}
  const run=runs[1];run.advance(15);const anchor=run.checkpoint(false),saved=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,compactFrozen:true}),reset=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed:1004137408,mode:'reset',compactFrozen:true});
  for(const fly of saved.world.flies){const prior=anchor.state.learners[fly.id],state=saved.learners[fly.id],cleared=reset.learners[fly.id];
    assert.deepEqual(state.steering.projection,prior.steering.projection);assert.deepEqual(cleared.steering.projection.counts,[0,0]);
    assert.ok(cleared.charge.incurredEnergy>=prior.charge.incurredEnergy);assert.equal(cleared.charge.operationsBilled,cleared.work.scalarOperations);}
  const restored=OdorRoutedExperiment.restore(saved.checkpoint());saved.advance(5);restored.advance(5);assert.deepEqual(saved.checkpoint(),restored.checkpoint());
});

test('terminal projection updates and outstanding debt are retained',()=>{
  const run=new OdorRoutedExperiment({...options,steeringProjection:'project'});run.advance(3);
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);
  for(const state of Object.values(run.learners)){assert.ok(state.steering.dead);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);assert.ok(state.steering.projection.counts.reduce((sum,count)=>sum+count,0)>0);}
});
