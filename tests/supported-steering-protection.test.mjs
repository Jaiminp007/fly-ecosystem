import test from 'node:test';
import assert from 'node:assert/strict';
import {createCueSharedSteering,chooseCueSharedSteering,cueSteeringRoute} from '../learning/cue-shared-steering.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const features=[1,.5,0,0,.2,0,.3,.1],firstCue=[1,-1,1,-1],secondCue=[-1,1,-1,1];
const choose=(model,tick,energy,cue)=>chooseCueSharedSteering(model,{agentId:1,tick,energy,cue,features,midpointAvailable:true},{forcedAction:0});
const combined=(model,route)=>model.weights[0].map((value,index)=>value+model.contextWeights[route][0][index]);

test('supported actions retain combined coefficients while unseen routes generalize',()=>{
  const modes=['control','protect'].map(mode=>createCueSharedSteering(1,33,null,mode)),route=cueSteeringRoute(firstCue),other=cueSteeringRoute(secondCue);
  for(const model of modes){choose(model,1,100,firstCue);choose(model,2,101,secondCue);}
  const prior=modes.map(model=>combined(model,route)),unseen=modes.map(model=>combined(model,0));for(const model of modes)choose(model,3,102,secondCue);
  for(let index=0;index<8;index++)assert.ok(Math.abs(combined(modes[1],route)[index]-prior[1][index])<1e-12);
  assert.notDeepEqual(combined(modes[0],route),prior[0]);assert.notDeepEqual(combined(modes[1],0),unseen[1]);
  for(const model of modes){assert.equal(model.support[route][0],true);assert.equal(model.support[other][0],true);assert.equal(model.support[route][1],false);}
  assert.equal(modes[0].work.scalarOperations,modes[1].work.scalarOperations);assert.equal(encodedStateBytes(modes[0]),encodedStateBytes(modes[1]));
});

test('clipping can defeat protection and remains observable',()=>{
  const model=createCueSharedSteering(1,33,null,'protect');model.support[0][0]=true;model.contextWeights[0][0][0]=8;
  choose(model,1,100,firstCue);const before=combined(model,0)[0];choose(model,2,0,secondCue);
  assert.equal(model.contextWeights[0][0][0],8);assert.notEqual(combined(model,0)[0],before);
});

test('physical controls bill support, reset it, retain debt and restore exactly',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]},options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',cueTastePolicy:'shared-plus-cue'};
  const runs=['control','protect'].map(steeringProtection=>new OdorRoutedExperiment({...options,steeringProtection,auditSnapshots:true})),events=[[],[]];
  for(const [index,run]of runs.entries())run.attach(event=>{if(event.type==='decision'){events[index].push(event);assert.equal(event.storageBytes,encodedStateBytes(event.auditState));}});
  assert.deepEqual(runs[0].world.checkpoint(),runs[1].world.checkpoint());for(const run of runs)run.advance(1);
  for(let index=0;index<events[0].length;index++){assert.equal(events[0][index].storageBytes,events[1][index].storageBytes);assert.equal(events[0][index].requestedExtra,events[1][index].requestedExtra);}
  const run=runs[1];run.advance(10);const anchor=run.checkpoint(false),settings={phase:'transfer',seed:1004137408,compactFrozen:true},saved=OdorRoutedExperiment.fork(anchor,settings),reset=OdorRoutedExperiment.fork(anchor,{...settings,mode:'reset'});
  for(const fly of saved.world.flies){const before=anchor.state.learners[fly.id],current=saved.learners[fly.id],empty=reset.learners[fly.id];assert.deepEqual(current.steering.support,before.steering.support);assert.ok(empty.steering.support.flat().every(value=>!value));assert.ok(empty.charge.incurredEnergy>=before.charge.incurredEnergy);assert.equal(empty.charge.operationsBilled,empty.work.scalarOperations);}
  const restored=OdorRoutedExperiment.restore(saved.checkpoint());saved.advance(5);restored.advance(5);assert.deepEqual(saved.checkpoint(),restored.checkpoint());
  for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);
  for(const state of Object.values(run.learners)){assert.ok(state.steering.dead);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
});
