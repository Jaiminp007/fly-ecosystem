import test from 'node:test';
import assert from 'node:assert/strict';
import {TasteExperiment,runTasteProbe} from '../learning/taste-experiment.mjs';
import {pursuitMotor} from '../learning/pursuit-authority.mjs';
import {motorPrimitive} from '../learning/cue-foraging.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
// Fresh V2 synthetic range, disjoint from V1's 355001-355009 (auto-excluded).
const history={seed:366001,cueSeed:366002,resourceSeeds:[366003,366004,366005,366006]};
const create=(arm='candidate',extra={})=>new TasteExperiment({history,arm,reference:{...structuredClone(VALUE_REFERENCE),founders:2},...extra});
const decisionsOf=(run,ticks=1)=>{const events=[];run.emit=e=>{if(e.type==='decision')events.push(e);};run.advance(ticks);run.emit=null;return events;};

test('Q shares P turn law exactly, always translates on cruise, never on stationary',()=>{
  const run=create('candidate',{body:'Q'});
  const before=run.endpoint().scalarOperations,events=decisionsOf(run,3);
  assert.ok(events.length>=4);
  let headingDiffs=0;
  for(const e of events){
    const s=(e.action===0||e.action===2)?1:-1;
    const expected=pursuitMotor(e.own.raw,s);
    assert.equal(e.outputs[0],expected.outputs[0]);
    assert.equal(e.outputs[1],e.action>=2?-1:0);
    assert.equal(e.outputs[2],expected.outputs[2]);
    const nativeTurn=motorPrimitive(e.own.raw,(e.action===0||e.action===2)?1:-1)[0];
    if((e.action===0||e.action===1)&&Math.abs(e.outputs[0]-nativeTurn)>1e-6)headingDiffs++;
  }
  assert.ok(headingDiffs>=1);
  assert.ok(run.endpoint().scalarOperations-before>=events.length*11);
  const resumed=TasteExperiment.restore(run.checkpoint());
  assert.equal(resumed.body,'Q');
  run.advance(3);resumed.advance(3);
  assert.deepEqual(run.checkpoint(),resumed.checkpoint());
  assert.throws(()=>create('nativeFullCruise',{body:'Q'}));
  assert.throws(()=>create('candidate',{body:'X'}));
});

test('Q fixed cruise always translates at half speed; P stops sometimes',()=>{
  const q=create('acceptCruise',{body:'Q'});
  const qev=decisionsOf(q,3);
  assert.ok(qev.length>=4&&qev.every(e=>e.outputs[1]===0));
  const p=create('acceptCruise',{body:'P'});
  const pev=decisionsOf(p,40);
  assert.ok(pev.some(e=>e.outputs[1]===-1)&&pev.some(e=>e.outputs[1]===0));
});

test('direct N-to-Q probe shares physical starts and tags body',()=>{
  const run=create();run.advance(3);
  const anchor=run.checkpoint();
  const spec={family:'A',version:'current',seed:366007,ticks:4,founders:2};
  const native=runTasteProbe(anchor,spec),direct=runTasteProbe(anchor,{...spec,body:'Q'});
  assert.equal(native.body,'N');assert.equal(direct.body,'Q');
  assert.equal(native.startWorldSha256,direct.startWorldSha256);
  assert.throws(()=>runTasteProbe(anchor,{...spec,body:'X'}));
});
