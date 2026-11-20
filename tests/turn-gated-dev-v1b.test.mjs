// TURN-GATED V1b fixtures (G3 gate per Amendment A1). Zero bank worlds:
// synthetic learners/rows only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,digestWeights,snapshotWeights,assertFreshTarget,scoreTurnGateV1b,
  turnGateDevV1bBank} from '../scripts/turn-gated-dev-v1b.mjs';

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
    rows.push(mkRow('train',407001+h,[['h',true],['b',false]]));
    rows.push(mkRow('transferred',407001+h,[['h',true,5],['b',false,1]]));
    rows.push(mkRow('unlearned',407001+h,[['h',true,1],['b',false,1]]));
  }
  const v=scoreTurnGateV1b(rows);
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2a,true);
  assert.ok(Math.abs(v.transMean-0.4)<1e-9);
  assert.equal(v.g2b,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-B-GO');
});

test('scorer NOGO / INVALID / INCOMPLETE-UNTRAINED branches',()=>{
  const rows=[];
  for(let h=0;h<3;h++){
    rows.push(mkRow('train',407011+h,[['h',true],['b',false]]));
    rows.push(mkRow('transferred',407011+h,[['h',true,3],['b',false,1]]));
    rows.push(mkRow('unlearned',407011+h,[['h',true,1],['b',false,1]]));
  }
  const n=scoreTurnGateV1b(rows);
  assert.equal(n.go,false);
  assert.equal(n.verdict,'PHASE-B-NOGO');
  const bad=rows.map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1b(bad);
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const flat=rows.map(r=>r.tag==='train'?mkRow('train',r.history.seed,[['h',false,1],['b',false,1]]):r);
  const iu=scoreTurnGateV1b(flat);
  assert.equal(iu.go,false);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
});

test('spent bank 407001-407054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-spend maintenance (V1c): the V1b bank built cleanly pre-spend and
  // is now spent (attempt-02, verdict PHASE-B-GO, commit b253899); the
  // builder must refuse to rebuild it anywhere. The committed bank itself
  // remains valid (read-only check, no rebuild). This guards the
  // never-duplicate-runs rule mechanically.
  const p=turnGateDevV1bBank('evidence/turn-gated-dev/fresh-02/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1b');
  assert.equal(p.histories.length,6);
  const dir=mkdtempSync(join(tmpdir(),'turn-gate-v1b-bank-guard-'));
  assert.throws(()=>turnGateDevV1bBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
