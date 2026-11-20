// TURN-GATED V1j fixtures (9/9 green required before bank build; zero bank worlds).
// Synthetic learners/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,checkScaledIntegrity,digestWeights,scaleSnapshot,snapshotWeights,assertFreshTarget,scoreTurnGateV1j,
  scoreFlipSplit,mechanismConfirmed,turnGateDevV1jBank,turnGateDevV1jSources} from '../scripts/turn-gated-dev-v1j.mjs';

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

const mkRow=(tag,seed,turnPairs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(turnPairs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
// Pair design: train A-harm/B-ben/C-harm; exact: A 9, B(harm) 5, C 9 (same 0.9, flipped 0.5);
// lossy: A 9, B(harm) 8, C 9 (same 0.9, flipped 0.8) -> lift 0.3 >= 0.1, floor 0.9 >= 0.5 -> GO.
const goRows=()=>{
  const rows=[];
  for(let h=0;h<3;h++){
    const s=418001+h;
    rows.push(mkRow('train',s,[['A',true],['B',false],['C',true],['E',false]]));
    rows.push(mkRow('transferred',s,[['A',true,9],['B',true,5],['C',true,9],['E',false,1]]));
    rows.push(mkRow('transferred-lossy',s,[['A',true,9],['B',true,8],['C',true,9],['E',false,1]]));
    rows.push(mkRow('unlearned',s,[['A',true,1],['B',false,1],['C',true,1],['E',false,1]]));
  }
  return rows;
};
const goPairs=()=>[0,1,2].map(h=>[[418001+h],[418001+h]]).map(([a,b])=>[a[0],b[0]]);

test('scorer GO-V1j on lift >= +0.1 with same floor (exact replicates, lossy improves)',()=>{
  const rows=goRows();
  const v=scoreTurnGateV1j(rows,goPairs());
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2a,true);
  assert.equal(v.g2b,true);
  assert.ok(Math.abs(v.liftMean-0.3)<1e-9);
  assert.ok(Math.abs(v.sameLossyMean-0.9)<1e-9);
  assert.equal(v.gLift,true);
  assert.equal(v.gFloor,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-J-GO');
});

test('scorer NOGO on flat lift / floor breach / G2a fail; INCOMPLETE / INVALID preserved',()=>{
  const flat=goRows().map(r=>r.tag==='transferred-lossy'
    ?mkRow('transferred-lossy',r.history.seed,[['A',true,9],['B',true,5],['C',true,9],['E',false,1]]):r);
  const n=scoreTurnGateV1j(flat,goPairs());
  assert.equal(n.go,false);
  assert.equal(n.verdict,'PHASE-J-NOGO');
  const low=goRows().map(r=>r.tag==='transferred-lossy'
    ?mkRow('transferred-lossy',r.history.seed,[['A',true,2],['B',true,9],['C',true,2],['E',false,1]]):r);
  const n2=scoreTurnGateV1j(low,goPairs());
  assert.equal(n2.go,false);
  assert.equal(n2.verdict,'PHASE-J-NOGO');
  const weak=goRows().map(r=>r.tag==='transferred'
    ?mkRow('transferred',r.history.seed,[['A',true,3],['B',true,3],['C',true,3],['E',false,3]]):r);
  const n3=scoreTurnGateV1j(weak,goPairs());
  assert.equal(n3.g2a,false);
  assert.equal(n3.verdict,'PHASE-J-NOGO');
  const bad=goRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1j(bad,goPairs());
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const untrained=goRows().map(r=>r.tag==='train'
    ?mkRow('train',r.history.seed,[['A',false,1],['B',false,1],['C',false,1]]):r);
  const iu=scoreTurnGateV1j(untrained,goPairs());
  assert.equal(iu.go,false);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  const short=goRows().slice(0,11);
  const sh=scoreTurnGateV1j(short,goPairs());
  assert.equal(sh.go,false);
  assert.equal(sh.verdict,'INVALID');
});

test('flip-split separates same-valence retention from flipped-cue residue',()=>{
  const tr=mkRow('train',418001,[['A',true],['B',false],['C',true]]);
  const te=mkRow('transferred',418010,[['A',true,9],['B',true,5],['C',true,9],['D',false,1]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,418001);
  assert.equal(f.testSeed,418010);
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
  const fEmpty=scoreFlipSplit(mkRow('train',418001,[['A',true]]),mkRow('transferred',418010,[['B',true,5]]));
  assert.equal(fEmpty.same.cues,0);
  assert.equal(fEmpty.flipped.cues,0);
  assert.equal(fEmpty.same.correctness,null);
  assert.equal(fEmpty.flipped.correctness,null);
  assert.equal(fEmpty.replayed.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('live bank 418001-418054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1j bank built cleanly pre-build (9/9 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=turnGateDevV1jBank('evidence/turn-gated-dev/fresh-10/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1j');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),418001);
  assert.equal(Math.max(...flat),418054);
  for(const s of [381001,395019,396001,407001,414001,418001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gated-dev-v1j-bank-guard-'));
  assert.throws(()=>turnGateDevV1jBank(join(dir,'protocol.json')),/already used in prior evidence/);

});
