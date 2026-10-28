import test from 'node:test';
import assert from 'node:assert/strict';
import {CoverageExperiment} from '../learning/coverage-experiment.mjs';
import {createCoverageTasteBody,chooseCoverageTaste,observeCoverageTaste} from '../learning/coverage-taste.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
const reference={...VALUE_REFERENCE,founders:4};
test('taste credit admits the executed stationary accepting action, not a shadow recommendation',()=>{
  const state=createCoverageTasteBody(1,19),raw=Array(17).fill(0);
  const own={agentId:1,tick:1,energy:65,raw,cue:[1,1,1,1],contactPresent:true,odorPresent:true};
  chooseCoverageTaste(state,own,{fixedMove:1});assert.equal(state.pending.action,2);
  observeCoverageTaste(state,{agentId:1,tick:1,energy:66,lastFood:1,terminal:false});assert.equal(state.tasteExamples,0);
  let accepted=false;
  for(let tick=2;tick<=40;tick++){
    const choice=chooseCoverageTaste(state,{...own,tick},{fixedMove:-1});
    assert.equal(state.pending.action,0);
    observeCoverageTaste(state,{agentId:1,tick,energy:66,lastFood:choice.accept?1:0,terminal:false});
    accepted ||= choice.accept;
  }
  assert.ok(accepted&&state.tasteExamples>0);assert.ok(state.taste.memory.every(record=>record.agentId===1));
});
test('full physical continuation is exact and observers cannot change behavior',()=>{
  const events=[],first=new CoverageExperiment({history,reference,emit:event=>events.push(structuredClone(event))});
  first.advance(32);const second=CoverageExperiment.restore(first.checkpoint());
  first.advance(32);second.advance(32);assert.deepEqual(first.checkpoint(),second.checkpoint());
  const decisions=events.filter(event=>event.type==='decision');assert.ok(decisions.length>0);
  for(const event of decisions){assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);}
  for(const state of Object.values(first.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
test('probes share physical state, freeze weights, include setup costs and settle extinction debt',()=>{
  const run=new CoverageExperiment({history,reference});run.advance(20);const anchor=run.checkpoint(false);
  const current=CoverageExperiment.fork(anchor,{phase:'transfer',seed:1004137408}),reset=CoverageExperiment.fork(anchor,{phase:'transfer',seed:1004137408,mode:'reset'}),bare=CoverageExperiment.fork(anchor,{phase:'transfer',seed:1004137408,mode:'native-full'});
  assert.deepEqual(current.world.checkpoint(),reset.world.checkpoint());assert.deepEqual(current.world.checkpoint(),bare.world.checkpoint());
  assert.ok(current.endpoint().budgetAdjustedEnergyPerFounder<0);
  const weights=Object.values(current.learners).map(state=>structuredClone(state.weights));current.advance(16);
  assert.deepEqual(Object.values(current.learners).map(state=>state.weights),weights);
  for(const state of Object.values(reset.learners))assert.ok(state.weights.flat().every(value=>value===0));
  for(const fly of bare.world.flies){bare.world.initialEnergy+=.000001-fly.energy;fly.energy=.000001;fly.x=0;fly.y=0;}
  bare.advance(2);assert.equal(bare.endpoint().survivors,0);assert.ok(bare.endpoint().outstandingEnergy>0);
});
