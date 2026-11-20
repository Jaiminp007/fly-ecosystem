// R-GAP fixture tests (V1a G5 gate, part 1). Zero bank contact: synthetic
// seeds 389001+ (auto union-excluded: bodyTransferExclusions scans tests/).
// Covers: schedWindowOpen boundaries, S2 learn/freeze behavior in mini runs,
// per-representation + td battery smoke, scorer verdict logic.
import test from 'node:test';
import assert from 'node:assert/strict';
import {TasteExperiment,schedWindowOpen,runTasteProbe} from '../learning/taste-experiment.mjs';
import {scoreRGap} from '../scripts/r-gap-dev.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';

test('schedWindowOpen splits every phase at its midpoint',()=>{
  assert.equal(schedWindowOpen('frontload',0,512),true);
  assert.equal(schedWindowOpen('frontload',255,512),true);
  assert.equal(schedWindowOpen('frontload',256,512),false);
  assert.equal(schedWindowOpen('frontload',511,512),false);
  assert.equal(schedWindowOpen('recent',0,512),false);
  assert.equal(schedWindowOpen('recent',255,512),false);
  assert.equal(schedWindowOpen('recent',256,512),true);
  assert.equal(schedWindowOpen('recent',511,512),true);
  assert.equal(schedWindowOpen('frontload',0,256),true);
  assert.equal(schedWindowOpen('frontload',128,256),false);
  assert.equal(schedWindowOpen('recent',127,256),false);
  assert.equal(schedWindowOpen('recent',128,256),true);
  assert.equal(schedWindowOpen('candidate',999,512),true);
});

const synthHistory=(s)=>({seed:s,cueSeed:s+1,resourceSeeds:[s+2,s+3,s+4,s+5],
  probeSeeds:{A:s+6,B:s+7,transfer:s+8}});
const mkRun=(arm,seed,learnerOptions)=>new TasteExperiment({history:synthHistory(seed),arm,
  learnerOptions:{...BT_LEARNER_OPTIONS,...learnerOptions},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
const snapshot=r=>{const o={};for(const[id,s]of Object.entries(r.learners))o[id]=[...s.weights.taste];return o;};

test('frontload learns in-window (0-255) and freezes out-window (256-299)',()=>{
  const run=mkRun('frontload',389011,{});
  run.advance(255);
  const w0=snapshot(run);
  run.advance(1); // tick 255 boundary-adjacent still in window
  const w1=snapshot(run);
  assert.notDeepEqual(w1,w0,'no learning inside window');
  run.advance(43); // ticks 256-299, window closed
  const w2=snapshot(run);
  assert.deepEqual(w2,w1,'weights moved while frozen');
});

test('recent freezes first (0-255) then learns (256-299)',()=>{
  const run=mkRun('recent',389021,{});
  run.advance(255);
  const w0=snapshot(run);
  run.advance(1);
  const w1=snapshot(run);
  assert.deepEqual(w1,w0,'weights moved while frozen');
  run.advance(43);
  const w2=snapshot(run);
  assert.notDeepEqual(w2,w1,'no learning inside window');
});

test('sched arms bill identically to candidate arm per tick (uniform billing)',()=>{
  // Same initial state, same 32 ticks, all in-window for frontload: op counts must match exactly.
  const a=mkRun('frontload',389031,{}),b=mkRun('candidate',389031,{});
  a.advance(32);b.advance(32);
  const ops=r=>Object.values(r.learners).reduce((x,s)=>x+s.work.scalarOperations,0);
  assert.equal(ops(a),ops(b));
});

for(const [tag,opts] of [['shared',{motorRepresentation:'shared'}],['appetite',{motorRepresentation:'appetite'}],
  ['td',{motorRule:'td'}],['tdwarm',{motorRule:'td',criticWarmStart:true}]]){
  test(`direct-probe smoke on synthetic ${tag} anchor (no battery wrapper)`,()=>{
    const run=mkRun('candidate',389041+['shared','appetite','td','tdwarm'].indexOf(tag),opts);
    run.advance(16);
    const anchor=run.checkpoint(false);
    const before=JSON.stringify(anchor).length;
    assert.ok(before>0);
    for(const [family,version] of [['A','current'],['A','reset'],['B','current'],['B','reset'],['transfer','current'],['transfer','reset']]){
      const seed=389051+['A','B','transfer'].indexOf(family);
      const p=runTasteProbe(anchor,{family,version,seed,ticks:8,founders:run.founderIds.length});
      assert.ok(Number.isFinite(p.value),`${tag}/${family}:${version} non-finite`);
      assert.ok(p.endpoint.scalarOperations>=0);
    }
  });
}

test('scoreRGap verdict branches: GO / NOGO / INVALID-billing / INVALID-baseline',()=>{
  const mk=(dA,dB,dT)=>({dA,dB,dT});
  const go={
    control:{1:mk(1.0,1.0,0.0),2:mk(1.0,1.0,0.0)},
    prop:{1:mk(2.0,2.0,0.0),2:mk(2.0,2.0,0.0)}};
  assert.equal(scoreRGap(go).verdict,'PHASE-A-GO');
  const flat={
    control:{1:mk(1.0,1.0,0.0),2:mk(1.0,1.0,0.0)},
    prop:{1:mk(1.1,1.1,0.0),2:mk(1.1,1.1,0.0)}};
  assert.equal(scoreRGap(flat).verdict,'PHASE-A-NOGO');
  const conf={
    control:{1:mk(1.0,1.0,0.0),2:mk(1.0,1.0,0.0)},
    prop:{1:mk(2.0,2.0,0.5),2:mk(2.0,2.0,0.0)}};
  assert.equal(scoreRGap(conf).verdict,'INVALID-BILLING');
  const dead={
    control:{1:mk(0.01,0.01,0.0),2:mk(0.01,0.01,0.0)},
    prop:{1:mk(5.0,5.0,0.0),2:mk(5.0,5.0,0.0)}};
  assert.equal(scoreRGap(dead).verdict,'INVALID-BASELINE');
});
