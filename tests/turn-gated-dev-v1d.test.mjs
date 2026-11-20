// TURN-GATED V1d fixtures (G3 gate per plan; seg2 interpretive classes
// descriptive per plan). Zero bank worlds: synthetic learners/rows only.
// Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,digestWeights,snapshotWeights,assertFreshTarget,scoreTurnGateV1d,
  scoreFlipSplit,mechanismConfirmed,classifySeg2,seg2Summary,turnGateDevV1dBank} from '../scripts/turn-gated-dev-v1d.mjs';

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

const twelve=(seedBase,seg1Turn,seg1Ben,seg2Turn)=>{ 
  const rows=[];
  for(let h=0;h<3;h++){
    rows.push(mkRow('train',seedBase+h,[['h',true],['b',false]]));
    rows.push(mkRow('transferred',seedBase+h,[['h',true,seg1Turn],['b',false,seg1Ben]]));
    rows.push(mkRow('transferred-seg2',seedBase+h,[['h',true,seg2Turn],['b',false,1]]));
    rows.push(mkRow('unlearned',seedBase+h,[['h',true,1],['b',false,1]]));
  }
  return rows;
};

test('scorer GO on trained + transferred-seg1 + seg2-present + flat unlearned',()=>{
  // seg1: harm 5/10, ben 1/10 -> gap (0.5-0.1)=0.4 >= 0.3
  const v=scoreTurnGateV1d(twelve(409001,5,1,5));
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2a,true);
  assert.ok(Math.abs(v.transMean-0.4)<1e-9);
  assert.equal(v.g2b,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-D-GO');
});

test('scorer NOGO / INVALID / INCOMPLETE-UNTRAINED branches + seg2 required',()=>{
  // seg1 gap (0.3-0.1)=0.2 < 0.3 -> NOGO (seg2 identical, never gates)
  const n=scoreTurnGateV1d(twelve(409011,3,1,10));
  assert.equal(n.go,false);
  assert.equal(n.verdict,'PHASE-D-NOGO');
  const bad=twelve(409011,5,1,5).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1d(bad);
  assert.equal(iv.verdict,'INVALID');
  const flat=twelve(409011,5,1,5).map(r=>r.tag==='train'?mkRow('train',r.history.seed,[['h',false,1],['b',false,1]]):r);
  const iu=scoreTurnGateV1d(flat);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  // seg2 triple missing -> throws (fail-closed completeness)
  const noSeg2=twelve(409011,5,1,5).filter(r=>r.tag!=='transferred-seg2');
  assert.throws(()=>scoreTurnGateV1d(noSeg2),/transferred-seg2/);
  // seg2 join failure -> INVALID (G1 covers all 12)
  const seg2Bad=twelve(409011,5,1,5).map(r=>r.tag==='transferred-seg2'?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  assert.equal(scoreTurnGateV1d(seg2Bad).verdict,'INVALID');
});

test('flip-split separates same-valence retention from flipped-cue residue',()=>{
  const tr=mkRow('train',409001,[['A',true],['B',false],['C',true]]);
  const te=mkRow('transferred',409010,[['A',true,9],['B',true,5],['C',true,9],['D',false,1]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,409001);
  assert.equal(f.testSeed,409010);
  assert.equal(f.same.cues,2);
  assert.equal(f.same.contact,20);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  assert.equal(f.flipped.cues,1);
  assert.equal(f.flipped.contact,10);
  assert.ok(Math.abs(f.flipped.correctness-0.5)<1e-9);
  assert.equal(f.replayed.correctness,+(23/30).toFixed(4));
  assert.equal(f.same.cues+f.flipped.cues,3);
  assert.equal(mechanismConfirmed(f),true);
  const fEmpty=scoreFlipSplit(mkRow('train',409001,[['A',true]]),mkRow('transferred',409010,[['B',true,5]]));
  assert.equal(fEmpty.same.correctness,null);
  assert.equal(fEmpty.flipped.correctness,null);
  assert.equal(fEmpty.replayed.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('seg2 classification: converged / rigid / degraded / indeterminate + delta',()=>{
  const tr=mkRow('train',409019,[['A',true],['B',false],['E',false]]);
  const s1=mkRow('transferred',409028,[['A',true,10],['B',true,5],['E',false,1]]);
  const f1=scoreFlipSplit(tr,s1);
  assert.ok(Math.abs(f1.flipped.correctness-0.5)<1e-9);
  // converged: seg2 flipped 1.0
  const sC=mkRow('transferred-seg2',409028,[['A',true,10],['B',true,10],['E',false,1]]);
  const cC=seg2Summary(f1,scoreFlipSplit(tr,sC));
  assert.equal(cC.class,'CONVERGED');
  assert.ok(Math.abs(cC.deltaFlipped-0.5)<1e-9);
  // rigid: seg2 flipped 0.5 (no movement)
  const sR=mkRow('transferred-seg2',409028,[['A',true,10],['B',true,5],['E',false,1]]);
  const cR=seg2Summary(f1,scoreFlipSplit(tr,sR));
  assert.equal(cR.class,'RIGID');
  assert.ok(Math.abs(cR.deltaFlipped-0)<1e-9);
  // degraded: seg2 flipped 0.2 (below band)
  const sD=mkRow('transferred-seg2',409028,[['A',true,10],['B',true,2],['E',false,1]]);
  const cD=seg2Summary(f1,scoreFlipSplit(tr,sD));
  assert.equal(cD.class,'DEGRADED');
  assert.ok(cD.deltaFlipped<0);
  // indeterminate: empty overlap -> nulls propagate
  const sN=mkRow('transferred-seg2',409028,[['Z',true,5]]);
  const cN=seg2Summary(f1,scoreFlipSplit(tr,sN));
  assert.equal(cN.seg2.flipped.correctness,null);
  assert.equal(cN.deltaFlipped,null);
  assert.equal(cN.class,'INDETERMINATE');
});

test('seg2 classification covers the plan-undefined intermediate zone (regression)',()=>{
  // Production finding (attempt-04): flipped 0.730/0.741 land between the
  // RIGID band top (0.7) and CONVERGED (0.85); the else-clause mislabeled
  // them DEGRADED (reserved for <0.4). They are INTERMEDIATE. Pure-unit:
  // seg2Summary/classifySeg2 only read .flipped.correctness.
  assert.equal(classifySeg2({flipped:{correctness:0.73}}),'INTERMEDIATE');
  assert.equal(classifySeg2({flipped:{correctness:0.84}}),'INTERMEDIATE');
  assert.equal(classifySeg2({flipped:{correctness:0.85}}),'CONVERGED');
  assert.equal(classifySeg2({flipped:{correctness:0.7}}),'RIGID');
  assert.equal(classifySeg2({flipped:{correctness:0.4}}),'RIGID');
  assert.equal(classifySeg2({flipped:{correctness:0.39}}),'DEGRADED');
  assert.equal(classifySeg2({flipped:{correctness:null}}),'INDETERMINATE');
  const s=seg2Summary({flipped:{correctness:0.543}},{flipped:{correctness:0.73}});
  assert.equal(s.class,'INTERMEDIATE');
  assert.ok(Math.abs(s.deltaFlipped-0.187)<1e-9);
});

test('live bank 409001-409054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1d bank built cleanly pre-build (8/8 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=turnGateDevV1dBank('evidence/turn-gated-dev/fresh-04/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1d');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),409001);
  assert.equal(Math.max(...flat),409054);
  for(const s of [381001,395019,396001,407001,408001,409001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gate-v1d-bank-guard-'));
  assert.throws(()=>turnGateDevV1dBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
