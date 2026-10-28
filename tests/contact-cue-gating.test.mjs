import test from 'node:test';
import assert from 'node:assert/strict';
import {contactObservation} from '../learning/contact-observation.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('contact cue comparison is metered, order-independent and ignores noncontacts',()=>{
  const fly={x:0,y:0},first={x:2,y:0,cue:[1,-1,1,-1]},same={x:-2,y:0,cue:[1,-1,1,-1]},other={x:3,y:0,cue:[-1,-1,1,-1]},far={x:100,y:0,cue:other.cue};
  const base={scalarOperations:0},observed={scalarOperations:0};
  const plain=contactObservation(fly,[first,same,far],[0,0,0,0],base),equal=contactObservation(fly,[first,same,far],[0,0,0,0],observed,{compareCues:true});
  assert.equal(equal.contactHomogeneous,true);assert.deepEqual(equal.cue,plain.cue);assert.equal(observed.scalarOperations-base.scalarOperations,12);
  const unequal=contactObservation(fly,[other,first],[0,0,0,0],{scalarOperations:0},{compareCues:true});assert.equal(unequal.contactHomogeneous,false);
  const empty=contactObservation(fly,[far],[0,0,0,0],{scalarOperations:0},{compareCues:true});assert.equal(empty.contactPresent,false);assert.equal(empty.contactHomogeneous,false);
});

test('matched cue sensor filters only factual mixed-contact credit and restores exactly',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
  const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental'};
  const runs=['observe','filter'].map(contactCueMode=>new OdorRoutedExperiment({...options,contactCueMode})),events=[[],[]];
  for(const [index,run]of runs.entries()){
    const energyBefore=run.world.energy();
    const fly=run.world.flies[0];fly.x=100;fly.y=100;run.fixedMove=-1;run.learners[fly.id].taste.rngState=1;
    for(const patch of run.world.food){patch.x=900;patch.y=600;}
    Object.assign(run.world.food[0],{x:100,y:100,cue:[1,-1,1,-1],valence:1,amount:1,capacity:2});
    Object.assign(run.world.food[1],{x:105,y:100,cue:[-1,-1,1,-1],valence:1,amount:1,capacity:2});
    run.world.initialEnergy+=run.world.energy()-energyBefore;
    run.attach(event=>events[index].push(structuredClone(event)));
  }
  assert.deepEqual(runs[0].world.checkpoint(),runs[1].world.checkpoint());for(const run of runs)run.advance(1);
  const decisions=events.map(items=>items.find(event=>event.type==='decision'));
  assert.equal(decisions[0].choice.accept,true);assert.equal(decisions[0].own.contactHomogeneous,false);
  assert.deepEqual(decisions[0].own,decisions[1].own);assert.deepEqual(decisions[0].outputs,decisions[1].outputs);
  assert.equal(decisions[0].requestedExtra,decisions[1].requestedExtra);assert.equal(decisions[0].storageBytes,decisions[1].storageBytes);
  assert.equal(runs[0].learners[1].tasteExamples,1);assert.equal(runs[1].learners[1].tasteExamples,0);
  for(const run of runs){run.attach(null);const restored=OdorRoutedExperiment.restore(run.checkpoint());run.advance(4);restored.advance(4);assert.deepEqual(run.checkpoint(),restored.checkpoint());}
});
