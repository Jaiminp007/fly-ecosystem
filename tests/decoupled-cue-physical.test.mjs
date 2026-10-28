import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe'};
function arrange(run){const before=run.world.energy();for(const patch of run.world.food){patch.x=900;patch.y=600;}const fly=run.world.flies[0];fly.x=100;fly.y=100;run.fixedMove=-1;run.learners[fly.id].taste.rngState=1;
  Object.assign(run.world.food[0],{x:100,y:100,amount:1,capacity:2,cue:[...run.codebook.A.find(item=>item.valence===1).bits],valence:1});run.world.initialEnergy+=run.world.energy()-before;}
test('matched cue-taste controls pay equal sensing and learn own executed contact',()=>{
  const runs=['shared','shared-plus-cue'].map(cueTastePolicy=>new OdorRoutedExperiment({...options,cueTastePolicy})),events=[[],[]];
  for(const [index,run]of runs.entries()){arrange(run);run.attach(event=>{events[index].push(structuredClone(event));if(event.type==='decision')assert.equal(event.storageBytes,encodedStateBytes(run.learners[event.id]));});}
  assert.deepEqual(runs[0].world.checkpoint(),runs[1].world.checkpoint());assert.deepEqual(runs[0].learners,runs[1].learners);for(const run of runs)run.advance(1);
  const choices=events.map(list=>list.find(event=>event.type==='decision'&&event.id===1));assert.deepEqual(choices[0].choice,choices[1].choice);assert.equal(choices[0].requestedExtra,choices[1].requestedExtra);assert.equal(choices[0].storageBytes,choices[1].storageBytes);
  for(const run of runs){const state=run.learners[1];assert.equal(state.tasteExamples,1);assert.equal(state.cueTaste.seen,1);assert.equal(state.cueTaste.updates,2);assert.ok(state.cueTaste.reservoir.every(item=>item.agentId===1));assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
  assert.deepEqual(runs[0].learners[1].cueTaste,runs[1].learners[1].cueTaste);
});
test('frozen probes copy, reset and compact both cue model stores without erasing debt',()=>{
  const run=new OdorRoutedExperiment({...options,cueTastePolicy:'shared-plus-cue'});arrange(run);run.advance(1);const anchor=run.checkpoint(false),earlier=structuredClone(anchor);
  for(const fly of earlier.world.world.flies){earlier.state.learners[fly.id].cueTaste.weights[0]=2;earlier.state.learners[fly.id].cueTaste.residuals[0]=3;}
  const saved=OdorRoutedExperiment.fork(anchor,{phase:'A',seed:1004137408,modelAnchor:earlier,compactFrozen:true}),reset=OdorRoutedExperiment.fork(anchor,{phase:'A',seed:1004137408,mode:'reset',compactFrozen:true});
  for(const fly of saved.world.flies){const state=saved.learners[fly.id],control=reset.learners[fly.id];assert.equal(state.cueTaste.weights[0],2);assert.equal(state.cueTaste.residuals[0],3);assert.deepEqual(state.cueTaste.reservoir,[]);assert.deepEqual(state.cueTaste.recent,[]);
    assert.ok(control.cueTaste.weights.every(value=>value===0)&&control.cueTaste.residuals.every(value=>value===0));assert.ok(state.charge.incurredEnergy>=anchor.state.learners[fly.id].charge.incurredEnergy);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
  const restored=OdorRoutedExperiment.restore(saved.checkpoint());saved.advance(5);restored.advance(5);assert.deepEqual(saved.checkpoint(),restored.checkpoint());
});
test('terminal work and debt remain charged for decoupled taste',()=>{
  const run=new OdorRoutedExperiment({...options,cueTastePolicy:'shared'});run.advance(3);for(const fly of run.world.flies){run.world.initialEnergy+=1e-9-fly.energy;fly.energy=1e-9;fly.genome.traits.lifespan=.01;}
  run.advance(2);assert.equal(run.endpoint().survivors,0);assert.ok(run.endpoint().outstandingEnergy>0);for(const state of Object.values(run.learners)){assert.ok(state.dead);assert.equal(state.charge.operationsBilled,state.work.scalarOperations);}
});
