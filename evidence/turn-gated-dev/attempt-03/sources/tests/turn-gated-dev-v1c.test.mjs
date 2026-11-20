// TURN-GATED V1c fixtures (G3 gate per plan + Amendment A1 governs the
// flip-split metric). Zero bank worlds: synthetic learners/rows only.
// Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,digestWeights,snapshotWeights,assertFreshTarget,scoreTurnGateV1c,
  scoreFlipSplit,mechanismConfirmed,turnGateDevV1cBank} from '../scripts/turn-gated-dev-v1c.mjs';

const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({agentId:1,weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaitingObservation:false,acquisition:true,dead:false,recent:[],older:[],
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

const mkRow=(tag,seed,turnPairs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(turnPairs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});

test('scorer GO on trained replication + transferred transfer + flat unlearned',()=>{
  const rows=[];
  for(let h=0;h<3;h++){
    rows.push(mkRow('train',408001+h,[['h',true],['b',false]]));
    rows.push(mkRow('transferred',408001+h,[['h',true,5],['b',false,1]]));
    rows.push(mkRow('unlearned',408001+h,[['h',true,1],['b',false,1]]));
  }
  const v=scoreTurnGateV1c(rows);
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2a,true);
  assert.ok(Math.abs(v.transMean-0.4)<1e-9);
  assert.equal(v.g2b,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-C-GO');
});

test('scorer NOGO / INVALID / INCOMPLETE-UNTRAINED branches',()=>{
  const rows=[];
  for(let h=0;h<3;h++){
    rows.push(mkRow('train',408011+h,[['h',true],['b',false]]));
    rows.push(mkRow('transferred',408011+h,[['h',true,3],['b',false,1]]));
    rows.push(mkRow('unlearned',408011+h,[['h',true,1],['b',false,1]]));
  }
  const n=scoreTurnGateV1c(rows);
  assert.equal(n.go,false);
  assert.equal(n.verdict,'PHASE-C-NOGO');
  const bad=rows.map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1c(bad);
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const flat=rows.map(r=>r.tag==='train'?mkRow('train',r.history.seed,[['h',false,1],['b',false,1]]):r);
  const iu=scoreTurnGateV1c(flat);
  assert.equal(iu.go,false);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
});

test('flip-split separates same-valence retention from flipped-cue residue',()=>{
  // train codebook: A harmful, B beneficial, C harmful.
  // test codebook:  A harmful (same), B HARMFUL (flipped), C harmful (same), D beneficial (test-only, excluded).
  const tr=mkRow('train',408001,[['A',true],['B',false],['C',true]]);
  const te=mkRow('transferred',408010,[['A',true,9],['B',true,5],['C',true,9],['D',false,1]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,408001);
  assert.equal(f.testSeed,408010);
  // same: A (turn 9/10, harm -> 0.9) + C (9/10, harm -> 0.9); correctness needs no both-classes
  assert.equal(f.same.cues,2);
  assert.equal(f.same.contact,20);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  // flipped: B, test-harmful, turn 5/10 -> correctness 0.5
  assert.equal(f.flipped.cues,1);
  assert.equal(f.flipped.contact,10);
  assert.ok(Math.abs(f.flipped.correctness-0.5)<1e-9);
  // replayed: vs train labels — A harm 9/10 ok, B train-ben 5/10 -> 0.5 wrong, C harm 9/10 ok
  // wcorr = (10*0.9 + 10*0.5 + 10*0.9)/30 = 23/30
  assert.equal(f.replayed.correctness,+(23/30).toFixed(4));
  assert.equal(f.replayed.cues,3);
  // test-only cue D excluded from every subset
  assert.equal(f.same.cues+f.flipped.cues,3);
  // same 0.9 >= 0.85 and flipped 0.5 in band -> confirms
  assert.equal(mechanismConfirmed(f),true);
  // disjoint rows -> empty subsets -> null correctness (never imputed, never confirms)
  const fEmpty=scoreFlipSplit(mkRow('train',408001,[['A',true]]),mkRow('transferred',408010,[['B',true,5]]));
  assert.equal(fEmpty.same.cues,0);
  assert.equal(fEmpty.flipped.cues,0);
  assert.equal(fEmpty.same.correctness,null);
  assert.equal(fEmpty.flipped.correctness,null);
  assert.equal(fEmpty.replayed.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('flip-split confirms the V1b-shaped mechanism on synthetic replication',()=>{
  // same-val cues near-perfect, flipped near-chance -> confirms
  const tr2=mkRow('train',408019,[['A',true],['B',false],['E',false]]);
  const te2=mkRow('transferred',408028,[['A',true,10],['B',true,5],['E',false,1]]);
  // contact 10 each: B flipped harm turn 5/10 -> 0.5; same: A harm 10/10 + E ben 1/10 -> (10*1+10*0.9)/20=0.95
  const f=scoreFlipSplit(tr2,te2);
  assert.ok(Math.abs(f.same.correctness-0.95)<1e-9);
  assert.ok(Math.abs(f.flipped.correctness-0.5)<1e-9);
  assert.equal(mechanismConfirmed(f),true);
  // full relearning (flipped 1.0) -> falsified pattern, not confirmed
  const te3=mkRow('transferred',408028,[['A',true,10],['B',true,10],['E',false,1]]);
  const f3=scoreFlipSplit(tr2,te3);
  assert.ok(f3.flipped.correctness>0.7);
  assert.equal(mechanismConfirmed(f3),false);
  // pure replay (flipped cue answered per TRAIN valence: B train-ben, turn 1/10 -> test-correctness 0.1)
  const te4=mkRow('transferred',408028,[['A',true,10],['B',true,1],['E',false,1]]);
  const f4=scoreFlipSplit(tr2,te4);
  assert.ok(Math.abs(f4.flipped.correctness-0.1)<1e-9);
  assert.equal(mechanismConfirmed(f4),false);
});

test('live bank 408001-408054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1c bank built cleanly pre-build (8/8 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=turnGateDevV1cBank('evidence/turn-gated-dev/fresh-03/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1c');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),408001);
  assert.equal(Math.max(...flat),408054);
  for(const s of [381001,395019,396001,407001,408001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gate-v1c-bank-guard-'));
  assert.throws(()=>turnGateDevV1cBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
