// RSI C1 fixtures (10 green required; zero worlds).
// Synthetic taste states/records only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTasteEnergyBody,chooseTasteEnergyAction,tasteUpdate} from '../learning/taste-energy.mjs';
import {attachOperatorLoop,proposeOperator,sandboxEvaluate,loopDigest,OL_MENU,OL_LIFETIME_MAX,OL_ADOPT_FACTOR} from '../learning/rsi-operator-loop.mjs';
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkState=(seed=42)=>attachOperatorLoop(createTasteEnergyBody(7,seed,{...BT_LEARNER_OPTIONS}));
const mkRec=(phi,target,experience)=>({phi:[...phi],target,experience});
const PHI1=Array(16).fill(0.1);
const seedRecords=(s,n=8,target=1)=>{for(let i=0;i<n;i++)s.recent.push(mkRec(PHI1,target,i+1));};

// --- module (6) ---
test('C1 menu-closedness (index bounds + unknown kind rejected)',()=>{
  const s=mkState();
  assert.throws(()=>proposeOperator(s,9),/menu-closed/); // bound tracks menu length (C6 index 6, C12 index 7, C14 index 8; intent unchanged)
  assert.throws(()=>proposeOperator(s,-1),/menu-closed/);
  assert.throws(()=>proposeOperator(s,1.5),/menu-closed/);
  seedRecords(s);
  assert.throws(()=>sandboxEvaluate(s,{kind:'nope'},[1,2],[3,4]),/menu-closed/);
  const op=proposeOperator(s,0);
  assert.deepEqual(op,OL_MENU[0]);
  assert.equal(OL_MENU.length,9); // C6 index 6 + C12 index 7 + C14 index 8 (append-only; intent unchanged)
});
test('C1 fit/test disjointness enforced (anti-sandbagging)',()=>{
  const s=mkState();seedRecords(s);
  assert.throws(()=>sandboxEvaluate(s,proposeOperator(s,0),[1,2],[2,3]),/disjoint/);
  assert.throws(()=>sandboxEvaluate(s,proposeOperator(s,0),[1,2],[]),/non-empty/);
  assert.throws(()=>sandboxEvaluate(s,proposeOperator(s,0),[],[1,2]),/non-empty/);
});
test('C1 clone isolation + checkpoint byte-identity (live untouched)',()=>{
  const s=mkState();seedRecords(s,8,1);
  const wBefore=structuredClone(s.weights),cBefore=structuredClone(s.config);
  const rBefore=s.recent.length,oBefore=s.older.length;
  const ev=sandboxEvaluate(s,proposeOperator(s,1),[1,2,3,4],[5,6,7,8]);
  assert.deepEqual(s.weights,wBefore);
  assert.deepEqual(s.config,cBefore);
  assert.equal(s.recent.length,rBefore);assert.equal(s.older.length,oBefore);
  assert.equal(typeof ev.fee,'number');
});
test('C1 billing exactness (V1c flat fee only)',()=>{
  const s=mkState();seedRecords(s);
  const w0=s.work.scalarOperations;
  const ev=sandboxEvaluate(s,proposeOperator(s,2),[1,2],[3,4]);
  assert.equal(ev.fitN,2);assert.equal(ev.testN,2);
  assert.equal(ev.fee,2*(2+2)*(16+1));
  assert.equal(s.work.scalarOperations-w0,ev.fee);
});
test('C1 adoption-bar math (strict 0.95 factor)',()=>{
  const s=mkState();seedRecords(s,8,1);
  // Zeroed weights, consistent records: gain must improve (adopt).
  const ev=sandboxEvaluate(s,proposeOperator(s,2),[1,2,3,4],[5,6,7,8]);
  assert.ok(ev.candErr<ev.incErr,`gain should improve zeroed weights (${ev.candErr} vs ${ev.incErr})`);
  assert.equal(ev.adopted,ev.candErr<ev.incErr*OL_ADOPT_FACTOR);
  assert.equal(OL_ADOPT_FACTOR,0.95);
});
test('C1 lifetime boundedness (5th proposal refused)',()=>{
  const s=mkState();seedRecords(s);
  for(let i=0;i<OL_LIFETIME_MAX;i++)sandboxEvaluate(s,proposeOperator(s,i%OL_MENU.length),[1,2],[3,4]);
  assert.equal(s.rsiLoop.proposals.length,OL_LIFETIME_MAX);
  assert.throws(()=>proposeOperator(s,0),/lifetime/);
  assert.throws(()=>sandboxEvaluate(s,{kind:'replayGain',gain:1},[1,2],[3,4]),/lifetime/);
});

// --- instrument (4) ---
test('C1 honest self-assessment (sandbox points the right way, both directions)',()=>{
  // (a) zeroed + consistent records: gain adopts (improvement real).
  const a=mkState(11);seedRecords(a,8,1);
  const ea=sandboxEvaluate(a,proposeOperator(a,2),[1,2,3,4],[5,6,7,8]);
  assert.equal(ea.adopted,true);
  // (b) trained weights + shrink: shrinking good weights hurts (reject).
  const b=mkState(12);
  for(let i=0;i<8;i++)tasteUpdate(b,mkRec(PHI1,1,100+i),'live',()=>{});
  b.recent=[];b.older=[];seedRecords(b,8,1);
  const eb=sandboxEvaluate(b,{kind:'shrinkOnce',alpha:0.25},[1,2,3,4],[5,6,7,8]);
  assert.equal(eb.adopted,false);
});
test('C1 attach null-hygiene (behavior identical with loop attached)',()=>{
  const mk=(seed,withLoop)=>{
    const t=createTasteEnergyBody(7,seed,{...BT_LEARNER_OPTIONS});
    if(withLoop)attachOperatorLoop(t);return t;
  };
  const raw=Array(17).fill(0);raw[16]=1;raw[3]=0.5;
  const run=t=>{const own={agentId:7,tick:1,energy:65,raw,cue:[1,1,-1,-1],contactPresent:true,odorPresent:true};
    return chooseTasteEnergyAction(t,own,()=>{});};
  const a=mk(99,false),b=mk(99,true);
  assert.equal(run(a),run(b));
  assert.deepEqual(a.weights,b.weights);
});
test('C1 loop digest stable across evaluations (log-only growth)',()=>{
  const s=mkState();seedRecords(s);
  const d0=JSON.parse(loopDigest(s));
  assert.deepEqual(d0,{proposals:[],evaluations:0});
  sandboxEvaluate(s,proposeOperator(s,0),[1,2],[3,4]);
  const d1=JSON.parse(loopDigest(s));
  assert.equal(d1.evaluations,1);assert.equal(d1.proposals.length,1);
});
test('C1 sources-closure guard (menu/sandbox/checkpoint blocks present)',()=>{
  const src=readFileSync(join(root,'learning','rsi-operator-loop.mjs'),'utf8');
  assert.ok(src.includes('OL_MENU'),'module must define the menu');
  assert.ok(src.includes('sandboxEvaluate'),'module must define the sandbox');
  assert.ok(src.includes('byte-identity'),'module must verify checkpoint identity');
  assert.ok(!src.includes('engine.mjs'),'loop must not import the world engine');
  assert.ok(src.includes('structuredClone(tasteState)'),'sandbox must clone (no live application)');
});
