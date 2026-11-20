// M-POP fixture tests (G5, plan V1/V1a). Zero bank worlds: synthetic seeds
// 389001+ (auto union-excluded: bodyTransferExclusions scans tests/*.mjs).
// Covers: newborn sync (unit, incl. frozen/phase-A + fixed arms), scoring
// verdict branches, bank build smoke. No engine runs except the bank-free
// sync helper (pure object manipulation).
import test from 'node:test';
import assert from 'node:assert/strict';
import {syncNewbornLearners,schedWindowOpen} from '../learning/taste-experiment.mjs';

const fakeRun=(arm,flies)=>({arm,phaseIndex:0,learnerOptions:{},
  world:{flies},learners:{}});

test('sync creates zeroed learners for newborns (candidate stays acquiring)',()=>{
  const r=fakeRun('candidate',[{id:101,brainSeed:389001},{id:102,brainSeed:389002}]);
  assert.equal(syncNewbornLearners(r),2);
  assert.equal(syncNewbornLearners(r),0); // idempotent
  for(const id of [101,102]){
    const s=r.learners[id];
    assert.ok(s.weights.taste.every(v=>v===0));
    assert.equal(s.acquisition,true);
  }
});

test('sync respects frozen semantics (unlearned always; frozen only outside A)',()=>{
  const u=fakeRun('unlearned',[{id:201,brainSeed:389011}]);
  syncNewbornLearners(u);
  assert.equal(u.learners[201].acquisition,false);
  const fA=fakeRun('frozen',[{id:202,brainSeed:389012}]);fA.phaseIndex=0;
  syncNewbornLearners(fA);
  assert.equal(fA.learners[202].acquisition,true); // phase A: learns like old-timers
  const fB=fakeRun('frozen',[{id:203,brainSeed:389013}]);fB.phaseIndex=2;
  syncNewbornLearners(fB);
  assert.equal(fB.learners[203].acquisition,false); // phase C: frozen at birth
});

test('sync handles fixed-program arms without crashing',()=>{
  const r=fakeRun('acceptCruise',[{id:301,brainSeed:389021}]);
  r.program='fixed';
  assert.equal(syncNewbornLearners(r),1);
  assert.equal(r.learners[301].agentId,301);
});

test('gap scorer branches (synthetic lineages)', async ()=>{
  const {scoreMpop}=await import('../scripts/m-pop-dev.mjs');
  // Synthetic rows: per history per arm, founder lines with alive/desc counts.
  const row=(tag,seed,lines)=>({tag,history:{seed},perLine:lines});
  const go=[
    row('candidate',1,[{a:1,d:3,g:2},{a:1,d:2,g:1},{a:0,d:0,g:0},{a:1,d:4,g:2}]),
    row('candidate',2,[{a:1,d:3,g:2},{a:1,d:2,g:1},{a:1,d:1,g:1},{a:0,d:0,g:0}]),
    row('unlearned',1,[{a:1,d:0,g:0},{a:0,d:0,g:0},{a:0,d:0,g:0},{a:0,d:0,g:0}]),
    row('unlearned',2,[{a:1,d:0,g:0},{a:0,d:0,g:0},{a:0,d:0,g:0},{a:0,d:0,g:0}]),
    row('frozen',1,[{a:1,d:1,g:1},{a:0,d:0,g:0},{a:1,d:0,g:0},{a:0,d:0,g:0}]),
    row('frozen',2,[{a:1,d:1,g:1},{a:1,d:0,g:0},{a:0,d:0,g:0},{a:0,d:0,g:0}]),
  ];
  const v=scoreMpop(go,10);
  assert.equal(v.verdict,'PHASE-A-GO');
  assert.ok(v.go);
  const flat=JSON.parse(JSON.stringify(go));
  for(const r of flat)if(r.tag==='candidate')for(const l of r.perLine){l.a=0;l.d=0;l.g=0;}
  const v2=scoreMpop(flat,10);
  assert.equal(v2.verdict,'PHASE-A-NOGO');
  assert.equal(scoreMpop(go,0).verdict,'INVALID-FEASIBLE');
});
