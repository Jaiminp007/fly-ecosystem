// TURN-GATED V1k fixtures (10/10 green required before bank build; zero bank worlds).
// Synthetic learners/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,checkScaledIntegrity,digestWeights,scaleSnapshot,snapshotWeights,assertFreshTarget,scoreTurnGateV1k,
  scoreFlipSplit,scoreFlipSplitV1k,mechanismConfirmed,turnGateDevV1kBank,turnGateDevV1kSources} from '../scripts/turn-gated-dev-v1k.mjs';

const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({agentId:1,weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaiting:true,acquisition:true,dead:false,recent:[],older:[],
  motorPending:null,hold:{cruise:false,remaining:0},...extra});
const snap=a=>snapshotWeights(a);

test('transplant copies weights exactly; rejects id/shape mismatch',()=>{
  const src=snap({1:mkAgent([[1,2],[3,4],[5,6]]),2:mkAgent([[7,8],[9,10],[11,12]])});
  const dst={1:mkAgent([[0,0],[0,0],[0,0]]),2:mkAgent([[0,0],[0,0],[0,0]])};
  const r=copyWeights(src,dst);
  assert.equal(r.transferred,2);
  assert.deepEqual(dst[1].weights,{taste:[1,2],actor:[3,4],critic:[5,6]});
  assert.deepEqual(dst[2].weights,{taste:[7,8],actor:[9,10],critic:[11,12]});
  assert.throws(()=>copyWeights(snap({1:mkAgent([[1],[2],[3]])}),dst),/founder id mismatch/);
  assert.throws(()=>copyWeights(snap({1:mkAgent([[1,2,3],[4,5,6],[7,8,9]]),2:mkAgent([[1],[2],[3]])}),dst),/mismatch/);
});

test('fresh-target contract: fresh passes, every stale field fails',()=>{
  const fresh=mkAgent([[0],[0],[0]]);
  assert.doesNotThrow(()=>assertFreshTarget(fresh,'1'));
  const stale=[{...mkAgent([[0],[0],[0]]),lastObservedTick:5},{...mkAgent([[0],[0],[0]]),lastDecisionTick:7},
    {...mkAgent([[0],[0],[0]]),recent:[{x:1}]},{...mkAgent([[0],[0],[0]]),older:[{x:2}]},
    {...mkAgent([[0],[0],[0]]),motorPending:{}}];
  for(const t of stale)assert.throws(()=>assertFreshTarget(t,'9'),/not fresh/);
});

test('integrity checker passes clean copy; flags planted corruptions',()=>{
  const src=snap({1:mkAgent([[1,2],[3,4],[5,6]])});
  const good={1:mkAgent([[9,9],[9,9],[9,9]])};
  copyWeights(src,good);
  const ok=checkTransplantIntegrity(src,good);
  assert.equal(ok.ok,true);
  assert.deepEqual(ok.violations,[]);
  const missing={};
  const m1=checkTransplantIntegrity(src,missing);
  assert.equal(m1.ok,false);
  assert.ok(m1.violations.some(v=>v.includes('missing agent')));
  const wrong={1:mkAgent([[9,9],[9,9],[9,9]])};
  copyWeights(src,wrong);
  wrong[1].weights.taste=[0,0];
  const m2=checkTransplantIntegrity(src,wrong);
  assert.equal(m2.ok,false);
  assert.ok(m2.violations.some(v=>v.includes('value mismatch')));
  const ragged={1:mkAgent([[9,9],[9],[9,9]])};
  const m3=checkTransplantIntegrity(src,ragged);
  assert.equal(m3.ok,false);
  assert.ok(m3.violations.some(v=>v.includes('shape mismatch')));
});

test('scaleSnapshot halves weights; alpha=1 identity; rejects bad alpha',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  const half=scaleSnapshot(src,0.5);
  assert.deepEqual(half,{1:{taste:[1,2],actor:[3,4],critic:[5,6]}});
  assert.deepEqual(scaleSnapshot(src,1),src);
  const zero=scaleSnapshot(src,0);
  assert.deepEqual(zero,{1:{taste:[0,0],actor:[0,0],critic:[0,0]}});
  assert.throws(()=>scaleSnapshot(src,NaN),/finite/);
  assert.throws(()=>scaleSnapshot(src,-0.5),/non-negative/);
  assert.throws(()=>scaleSnapshot(src,Infinity),/finite/);
});

test('scaled-integrity passes scaled copy; flags exact/wrong-alpha/corrupt',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  const good={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(scaleSnapshot(src,0.5),good);
  assert.equal(checkScaledIntegrity(src,good,0.5).ok,true);
  const exact={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(src,exact);
  const m1=checkScaledIntegrity(src,exact,0.5);
  assert.equal(m1.ok,false);
  assert.ok(m1.violations.some(v=>v.includes('value mismatch')));
  const wrongA={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(scaleSnapshot(src,0.25),wrongA);
  assert.equal(checkScaledIntegrity(src,wrongA,0.5).ok,false);
  const ragged={1:mkAgent([[9,9],[9],[9,9]])};
  const m3=checkScaledIntegrity(src,ragged,0.5);
  assert.equal(m3.ok,false);
  assert.ok(m3.violations.some(v=>v.includes('shape mismatch')));
});

// V1k synthetic rows: train A-harm/B-ben/C-harm/D-ben; test splits BH (B: ben->harm)
// vs HB (C: harm->ben). Exact HB turn 7 (correctness 0.3); lossy HB turn 5 (0.5).
// BH exact/lossy turn 8 (0.8 both; no-harm floor holds, no lift needed).
const mkRowK=(tag,seed,specs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
const kTrain=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const kExact=s=>[['A',true,9],['B',true,8],['C',false,7],['D',false,1]];
const kLossy=s=>[['A',true,9],['B',true,8],['C',false,5],['D',false,1]];
const kUnlearn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const kRows=()=>{const rows=[];for(let h=0;h<3;h++){const s=448001+h;
  rows.push(mkRowK('train',s,kTrain(s)));rows.push(mkRowK('transferred',s,kExact(s)));
  rows.push(mkRowK('transferred-lossy',s,kLossy(s)));rows.push(mkRowK('unlearned',s,kUnlearn(s)));}return rows;};
const kPairs=()=>[0,1,2].map(h=>[[448001+h],[448001+h]]).map(([a,b])=>[a[0],b[0]]);

test('scorer GO-V1k on HB lift >= +0.1 with BH floor and same floor',()=>{
  const rows=kRows();
  const v=scoreTurnGateV1k(rows,kPairs());
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2a,true);
  assert.equal(v.g2b,true);
  assert.ok(Math.abs(v.hbLiftMean-0.2)<1e-9);
  assert.ok(Math.abs(v.bhLossyMean-0.8)<1e-9);
  assert.ok(Math.abs(v.sameLossyMean-0.9)<1e-9);
  assert.equal(v.gHbLift,true);
  assert.equal(v.gBhFloor,true);
  assert.equal(v.gSameFloor,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-K-GO');
});

test('scorer NOGO on flat HB lift / BH breach / same breach / G2a fail; INCOMPLETE / INVALID preserved',()=>{
  const flat=kRows().map(r=>r.tag==='transferred-lossy'
    ?mkRowK('transferred-lossy',r.history.seed,[['A',true,9],['B',true,8],['C',false,7],['D',false,1]]):r);
  const n=scoreTurnGateV1k(flat,kPairs());
  assert.equal(n.go,false);
  assert.equal(n.gHbLift,false);
  assert.equal(n.verdict,'PHASE-K-NOGO');
  const bhBad=kRows().map(r=>r.tag==='transferred-lossy'
    ?mkRowK('transferred-lossy',r.history.seed,[['A',true,9],['B',true,2],['C',false,5],['D',false,1]]):r);
  const n2=scoreTurnGateV1k(bhBad,kPairs());
  assert.equal(n2.go,false);
  assert.equal(n2.gBhFloor,false);
  assert.equal(n2.verdict,'PHASE-K-NOGO');
  const sameBad=kRows().map(r=>r.tag==='transferred-lossy'
    ?mkRowK('transferred-lossy',r.history.seed,[['A',true,1],['B',true,8],['C',false,5],['D',false,9]]):r);
  const n2b=scoreTurnGateV1k(sameBad,kPairs());
  assert.equal(n2b.go,false);
  assert.equal(n2b.gSameFloor,false);
  assert.equal(n2b.verdict,'PHASE-K-NOGO');
  const weak=kRows().map(r=>r.tag==='transferred'
    ?mkRowK('transferred',r.history.seed,[['A',true,5],['B',true,5],['C',false,5],['D',false,5]]):r);
  const n3=scoreTurnGateV1k(weak,kPairs());
  assert.equal(n3.g2a,false);
  assert.equal(n3.verdict,'PHASE-K-NOGO');
  const bad=kRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1k(bad,kPairs());
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const untrained=kRows().map(r=>r.tag==='train'
    ?mkRowK('train',r.history.seed,[['A',false,1],['B',false,1],['C',false,1]]):r);
  const iu=scoreTurnGateV1k(untrained,kPairs());
  assert.equal(iu.go,false);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  const short=kRows().slice(0,11);
  const sh=scoreTurnGateV1k(short,kPairs());
  assert.equal(sh.go,false);
  assert.equal(sh.verdict,'INVALID');
});

test('flip-split separates same-valence retention from flipped-cue residue (aggregate, descriptive)',()=>{
  const tr=mkRowK('train',448001,[['A',true],['B',false],['C',true]]);
  const te=mkRowK('transferred',448010,[['A',true,9],['B',true,5],['C',true,9],['D',false,1]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,448001);
  assert.equal(f.testSeed,448010);
  assert.equal(f.same.cues,2);
  assert.equal(f.same.contact,20);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  assert.equal(f.flipped.cues,1);
  assert.equal(f.flipped.contact,10);
  assert.ok(Math.abs(f.flipped.correctness-0.5)<1e-9);
  assert.equal(f.replayed.correctness,+(23/30).toFixed(4));
  assert.equal(f.replayed.cues,3);
  assert.equal(f.same.cues+f.flipped.cues,3);
  assert.equal(mechanismConfirmed(f),true);
  const fEmpty=scoreFlipSplit(mkRowK('train',448001,[['A',true]]),mkRowK('transferred',448010,[['B',true,5]]));
  assert.equal(fEmpty.same.cues,0);
  assert.equal(fEmpty.flipped.cues,0);
  assert.equal(fEmpty.same.correctness,null);
  assert.equal(fEmpty.flipped.correctness,null);
  assert.equal(fEmpty.replayed.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('direction-split partitions BH vs HB with hand-computed values; empty direction null',()=>{
  const tr=mkRowK('train',448001,[['A',true],['B',false],['C',true]]);
  const te=mkRowK('transferred',448010,[['A',true,9],['B',true,8],['C',false,3]]);
  const f=scoreFlipSplitV1k(tr,te);
  assert.equal(f.flippedBH.cues,1);
  assert.equal(f.flippedBH.contact,10);
  assert.ok(Math.abs(f.flippedBH.correctness-0.8)<1e-9);
  assert.equal(f.flippedHB.cues,1);
  assert.equal(f.flippedHB.contact,10);
  assert.ok(Math.abs(f.flippedHB.correctness-0.7)<1e-9);
  assert.equal(f.flippedBH.cues+f.flippedHB.cues,f.flipped.cues);
  const noHB=scoreFlipSplitV1k(
    mkRowK('train',448001,[['A',true],['B',false]]),
    mkRowK('transferred',448010,[['A',true,9],['B',true,8]]));
  assert.equal(noHB.flippedHB.cues,0);
  assert.equal(noHB.flippedHB.correctness,null);
  assert.equal(noHB.flippedBH.cues,1);
  const noShared=scoreFlipSplitV1k(
    mkRowK('train',448001,[['A',true]]),
    mkRowK('transferred',448010,[['B',false,5]]));
  assert.equal(noShared.flippedBH.cues,0);
  assert.equal(noShared.flippedBH.correctness,null);
  assert.equal(noShared.flippedHB.cues,0);
  assert.equal(noShared.flippedHB.correctness,null);
});

test('live bank 448001-448054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-attempt maintenance: the V1k bank built cleanly pre-build and is now
  // live in evidence (attempt-12 ran); the builder must refuse to rebuild it
  // anywhere. Read-only checks verify the committed bank (no rebuild).
  const p=turnGateDevV1kBank('evidence/turn-gated-dev/fresh-12/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1k');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),448001);
  assert.equal(Math.max(...flat),448054);
  for(const s of [381001,395019,396001,407001,414001,418001,444001,447001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gated-dev-v1k-bank-guard-'));
  assert.throws(()=>turnGateDevV1kBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
