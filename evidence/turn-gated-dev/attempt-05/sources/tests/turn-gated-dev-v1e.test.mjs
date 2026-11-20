// TURN-GATED V1e fixtures (G3 gate per plan; seg1-gated verdict + seg2-4
// descriptive trajectory). Zero bank worlds: synthetic learners/rows only.
// Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,digestWeights,snapshotWeights,assertFreshTarget,scoreTurnGateV1e,
  scoreFlipSplit,mechanismConfirmed,classifySeg,segSummary,turnGateDevV1eBank} from '../scripts/turn-gated-dev-v1e.mjs';

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

const rows18=(seedBase,t,s1,s2,s3,s4,u)=>{
  const rows=[];
  for(let h=0;h<3;h++){
    const mk=(tag,[th,tb])=>mkRow(tag,seedBase+h,[['h',true,th],['b',false,tb]]);
    rows.push(mk('train',t));
    rows.push(mk('transferred',s1));
    rows.push(mk('transferred-seg2',s2));
    rows.push(mk('transferred-seg3',s3));
    rows.push(mk('transferred-seg4',s4));
    rows.push(mk('unlearned',u));
  }
  return rows;
};
// gap = th/10 - tb/10. GO: train 0.7, seg1 0.4, unlearned 0.0.
test('scorer GO on trained + seg1 + seg2-4 present + flat unlearned',()=>{
  const v=scoreTurnGateV1e(rows18(410001,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]));
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2a,true);
  assert.ok(Math.abs(v.transMean-0.4)<1e-9);
  assert.equal(v.g2b,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-E-GO');
});

test('scorer NOGO / INVALID / INCOMPLETE branches + seg3/seg4 required',()=>{
  // seg1 gap 0.2 < 0.3 -> NOGO (seg values never gate)
  const n=scoreTurnGateV1e(rows18(410011,[8,1],[3,1],[10,0],[10,0],[10,0],[1,1]));
  assert.equal(n.go,false);
  assert.equal(n.verdict,'PHASE-E-NOGO');
  const bad=rows18(410011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1e(bad);
  assert.equal(iv.verdict,'INVALID');
  const flat=rows18(410011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).map(r=>r.tag==='train'?mkRow('train',r.history.seed,[['h',false,1],['b',false,1]]):r);
  const iu=scoreTurnGateV1e(flat);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  // each seg triple required (fail-closed completeness)
  for(const tag of ['transferred-seg2','transferred-seg3','transferred-seg4']){
    const missing=rows18(410011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).filter(r=>r.tag!==tag);
    assert.throws(()=>scoreTurnGateV1e(missing),new RegExp(tag));
  }
  // seg join failure -> INVALID (G1 covers all 18)
  const segBad=rows18(410011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).map(r=>r.tag==='transferred-seg4'?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  assert.equal(scoreTurnGateV1e(segBad).verdict,'INVALID');
});

test('flip-split separates same-valence retention from flipped-cue residue',()=>{
  const tr=mkRow('train',410001,[['A',true],['B',false],['C',true]]);
  const te=mkRow('transferred',410010,[['A',true,9],['B',true,5],['C',true,9],['D',false,1]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,410001);
  assert.equal(f.testSeed,410010);
  assert.equal(f.same.cues,2);
  assert.equal(f.same.contact,20);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  assert.equal(f.flipped.cues,1);
  assert.equal(f.flipped.contact,10);
  assert.ok(Math.abs(f.flipped.correctness-0.5)<1e-9);
  assert.equal(f.replayed.correctness,+(23/30).toFixed(4));
  assert.equal(f.same.cues+f.flipped.cues,3);
  assert.equal(mechanismConfirmed(f),true);
  const fEmpty=scoreFlipSplit(mkRow('train',410001,[['A',true]]),mkRow('transferred',410010,[['B',true,5]]));
  assert.equal(fEmpty.same.correctness,null);
  assert.equal(fEmpty.flipped.correctness,null);
  assert.equal(fEmpty.replayed.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('seg chain wires link-to-link deltas + classes across seg1..seg4',()=>{
  // flipped trajectory 0.5 -> 0.6 -> 0.7 -> 0.9 (turns 5/6/7/9 on harm cue B)
  const tr=mkRow('train',410019,[['A',true],['B',false],['E',false]]);
  const mkSeg=(tag,turnB)=>mkRow(tag,410028,[['A',true,10],['B',true,turnB],['E',false,1]]);
  const f1=scoreFlipSplit(tr,mkSeg('transferred',5));
  const f2=scoreFlipSplit(tr,mkSeg('transferred-seg2',6));
  const f3=scoreFlipSplit(tr,mkSeg('transferred-seg3',7));
  const f4=scoreFlipSplit(tr,mkSeg('transferred-seg4',9));
  assert.ok(Math.abs(f1.flipped.correctness-0.5)<1e-9);
  const s2=segSummary(f1,f2),s3=segSummary(f2,f3),s4=segSummary(f3,f4);
  assert.equal(s2.class,'RIGID');
  assert.ok(Math.abs(s2.deltaFlipped-0.1)<1e-9);
  assert.equal(s3.class,'RIGID'); // 0.7 boundary inclusive per plan [0.4,0.7]
  assert.ok(Math.abs(s3.deltaFlipped-0.1)<1e-9);
  assert.equal(s4.class,'CONVERGED');
  assert.ok(Math.abs(s4.deltaFlipped-0.2)<1e-9);
  // cumulative vs seg1 recoverable by summing links
  assert.ok(Math.abs((s2.deltaFlipped+s3.deltaFlipped+s4.deltaFlipped)-0.4)<1e-9);
});

test('classifySeg boundaries incl. plan-undefined intermediate zone (V1d regression carried over)',()=>{
  assert.equal(classifySeg({flipped:{correctness:0.73}}),'INTERMEDIATE');
  assert.equal(classifySeg({flipped:{correctness:0.84}}),'INTERMEDIATE');
  assert.equal(classifySeg({flipped:{correctness:0.85}}),'CONVERGED');
  assert.equal(classifySeg({flipped:{correctness:0.7}}),'RIGID');
  assert.equal(classifySeg({flipped:{correctness:0.4}}),'RIGID');
  assert.equal(classifySeg({flipped:{correctness:0.39}}),'DEGRADED');
  assert.equal(classifySeg({flipped:{correctness:null}}),'INDETERMINATE');
});

test('live bank 410001-410054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1e bank built cleanly pre-build (9/9 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=turnGateDevV1eBank('evidence/turn-gated-dev/fresh-05/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1e');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),410001);
  assert.equal(Math.max(...flat),410054);
  for(const s of [381001,395019,396001,407001,408001,409001,410001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gate-v1e-bank-guard-'));
  assert.throws(()=>turnGateDevV1eBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
