import test from 'node:test';
import assert from 'node:assert/strict';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('focal steering swaps affect only one frozen probe controller and restore exactly',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]},run=new OdorRoutedExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',steeringProtection:'protect',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe',cueTastePolicy:'shared-plus-cue',cueTasteReplay:'rbase',contactBandit:'learned',contactGateReplay:'reservoir'});run.advance(20);const anchor=run.checkpoint(false),focal=run.world.flies[0].id,base={phase:'transfer',seed:1347207440,compactFrozen:true},learned=OdorRoutedExperiment.fork(anchor,base),native=OdorRoutedExperiment.fork(anchor,{...base,steeringMode:'native'});assert.deepEqual(learned.world.checkpoint(),native.world.checkpoint());learned.focalSteering={[focal]:'native'};native.focalSteering={[focal]:'learned'};let seen=0;
  learned.attach(event=>{if(event.type==='decision'&&event.id===focal){assert.equal(event.steering.action,0);seen++;}});native.attach(event=>{if(event.type==='decision'){if(event.id===focal)assert.equal(event.steering.action,event.steering.proposed);else assert.equal(event.steering.action,0);}});learned.advance(4);native.advance(4);assert.ok(seen>0);learned.attach(null);native.attach(null);const restored=OdorRoutedExperiment.restore(native.checkpoint());native.advance(5);restored.advance(5);assert.deepEqual(native.checkpoint(),restored.checkpoint());
});
