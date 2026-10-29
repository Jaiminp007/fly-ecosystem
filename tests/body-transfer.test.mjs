import test from 'node:test';
import assert from 'node:assert/strict';
import {TasteExperiment,runTasteProbe,TASTE_ARMS} from '../learning/taste-experiment.mjs';
import {pursuitMotor} from '../learning/pursuit-authority.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
const history={seed:355001,cueSeed:355002,resourceSeeds:[355003,355004,355005,355006]};
const create=(arm='candidate',extra={})=>new TasteExperiment({history,arm,reference:{...structuredClone(VALUE_REFERENCE),founders:2},...extra});
const decisionsOf=(run,ticks=1)=>{const events=[];run.emit=e=>{if(e.type==='decision')events.push(e);};run.advance(ticks);run.emit=null;return events;};

test('P actuator matches pursuitMotor exactly, forces stationary to -1, bills primitive plus two predicates',()=>{
  const run=create('candidate',{body:'P'});
  const before=run.endpoint().scalarOperations,events=decisionsOf(run);
  assert.ok(events.length>=2);
  for(const e of events){
    const expected=pursuitMotor(e.own.raw,(e.action===0||e.action===2)?1:-1);
    if(e.action>=2)expected.outputs[1]=-1;
    assert.deepEqual(e.outputs,expected.outputs);
  }
  const delta=run.endpoint().scalarOperations-before;
  assert.ok(delta>=events.length*11);
});

test('P fixed arms pay primitive costs and stationary never translates',()=>{
  const cruise=create('acceptCruise',{body:'P'});
  const before=runDelta(cruise),stationary=create('acceptStationary',{body:'P'});
  const sev=[];stationary.emit=e=>{if(e.type==='decision')sev.push(e);};stationary.advance(1);
  assert.ok(sev.length>=2&&sev.every(e=>e.outputs[1]===-1));
  assert.ok([24,31,38].includes(before));
  function runDelta(r){const b=r.endpoint().scalarOperations;r.advance(1);return r.endpoint().scalarOperations-b;}
});

test('N body is default, bit-identical stock path, restores with body',()=>{
  assert.ok(TASTE_ARMS.includes('nativeFullCruise'));
  const run=create();
  assert.equal(run.body,'N');
  const resumed=TasteExperiment.restore(run.checkpoint());
  assert.equal(resumed.body,'N');
  run.advance(5);resumed.advance(5);
  assert.deepEqual(run.checkpoint(),resumed.checkpoint());
  const fast=create('acceptCruise',{cruiseSpeed:1});
  fast.advance(1);assert.ok(fast.world.flies.every(f=>f.lastActions[1]===1));
});

test('nativeFullCruise is a fixed full-speed reference and rejects body P',()=>{
  const run=create('nativeFullCruise');
  assert.equal(run.program,'fixed');
  const events=decisionsOf(run);
  assert.ok(events.length>=2&&events.every(e=>e.outputs[1]===1));
  const resumed=TasteExperiment.restore(run.checkpoint());
  run.advance(5);resumed.advance(5);
  assert.deepEqual(run.checkpoint(),resumed.checkpoint());
  assert.throws(()=>create('nativeFullCruise',{body:'P'}));
  assert.throws(()=>create('candidate',{body:'X'}));
});

test('direct N-to-P probe shares physical starts, freezes weights, tags body',()=>{
  const run=create();run.advance(3);
  const anchor=run.checkpoint();
  const spec={family:'A',version:'current',seed:355007,ticks:4,founders:2};
  const native=runTasteProbe(anchor,spec),direct=runTasteProbe(anchor,{...spec,body:'P'});
  assert.equal(native.body,'N');assert.equal(direct.body,'P');
  assert.equal(native.startWorldSha256,direct.startWorldSha256);
  assert.throws(()=>runTasteProbe(anchor,{...spec,body:'X'}));
});

test('checkpoints without body backfill to N',()=>{
  const run=create('candidate',{body:'P'});run.advance(1);
  const cp=run.checkpoint();delete cp.state.body;
  assert.equal(TasteExperiment.restore(cp).body,'N');
});
