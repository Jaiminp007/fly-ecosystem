import test from 'node:test';
import assert from 'node:assert/strict';
import {OwnSteeringExperiment} from '../learning/own-steering-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {enterCuePhase,updateCueResources} from '../learning/cue-foraging.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
test('cue-phase food geometry cannot supply the midpoint action',()=>{
  const run=new OwnSteeringExperiment({history,reference:{...VALUE_REFERENCE,founders:2}}),world=run.world;
  const positions=world.food.map(({x,y})=>[x,y]);let minimum=Infinity;
  for(let first=0;first<positions.length;first++)for(let second=first+1;second<positions.length;second++){
    minimum=Math.min(minimum,Math.hypot(positions[first][0]-positions[second][0],positions[first][1]-positions[second][1]));
  }
  assert.equal(minimum,32);
  for(const [index,phase] of CONTINUAL_PHASES.entries()){
    const resource=enterCuePhase(world,phase,history.resourceSeeds[index],run.codebook);
    if(resource.nextShift!==null){world.tick=resource.nextShift;updateCueResources(world,resource);}
    assert.deepEqual(world.food.map(({x,y})=>[x,y]),positions);
  }
});
test('normal acquisition fixture records zero midpoint availability and zero action-1 updates',()=>{
  const run=new OwnSteeringExperiment({history,reference:{...VALUE_REFERENCE,founders:4}});run.advance(80);
  assert.equal(run.statistics.A.available,0);assert.equal(run.statistics.A.steering[1],0);
  for(const state of Object.values(run.learners))assert.ok(state.steering.weights[1].every(value=>value===0));
});
test('randomized acquisition geometry preserves energy and RNG, and matches across controls',()=>{
  const reference={...VALUE_REFERENCE,founders:4};
  const grid=new OwnSteeringExperiment({history,reference}),learned=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual'});
  const native=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual',steeringMode:'native'});
  const guarded=new OwnSteeringExperiment({history,reference,acquisitionGeometry:'continual',steeringMode:'guarded'});
  assert.deepEqual(learned.world.checkpoint(),native.world.checkpoint());assert.deepEqual(learned.world.checkpoint(),guarded.world.checkpoint());
  assert.equal(learned.world.energy(),grid.world.energy());assert.equal(learned.world.rng.state,grid.world.rng.state);assert.equal(learned.world.ecologyRng.state,grid.world.ecologyRng.state);
  assert.deepEqual(learned.world.food.map(patch=>patch.amount),grid.world.food.map(patch=>patch.amount));
  assert.notDeepEqual(learned.world.food.map(patch=>[patch.x,patch.y]),grid.world.food.map(patch=>[patch.x,patch.y]));
  const positions=learned.world.food.map(({x,y})=>[x,y]);
  for(const [index,phase] of CONTINUAL_PHASES.entries()){
    const resource=enterCuePhase(learned.world,phase,history.resourceSeeds[index],learned.codebook);
    if(resource.nextShift!==null){learned.world.tick=resource.nextShift;updateCueResources(learned.world,resource);}
    assert.deepEqual(learned.world.food.map(({x,y})=>[x,y]),positions);
  }
});
test('randomized acquisition fixture exposes and executes both steering actions',()=>{
  const run=new OwnSteeringExperiment({history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual'});
  run.advance(80);assert.ok(run.statistics.A.available>0);assert.ok(run.statistics.A.steering.every(count=>count>0));
  assert.ok(Object.values(run.learners).some(state=>state.steering.weights[1].some(value=>value!==0)));
  const restored=OwnSteeringExperiment.restore(run.checkpoint());run.advance(16);restored.advance(16);assert.deepEqual(run.checkpoint(),restored.checkpoint());
  const anchor=run.checkpoint(false),transfer=OwnSteeringExperiment.fork(anchor,{phase:'transfer',seed:1004137408});
  assert.equal(transfer.world.config.cueForaging,false);
  assert.notDeepEqual(transfer.world.food.map(patch=>[patch.x,patch.y]),run.world.food.map(patch=>[patch.x,patch.y]));
  const weights=Object.values(transfer.learners).map(state=>structuredClone(state.steering.weights));transfer.advance(8);
  assert.deepEqual(Object.values(transfer.learners).map(state=>state.steering.weights),weights);
});
