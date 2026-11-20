// TRAIN-SCALE fixtures (12 green required before bank build; zero bank worlds).
// Synthetic states/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {copyWeights,checkScaledIntegrity,scaleSnapshot,snapshotWeights} from '../scripts/turn-gated-dev-v1m.mjs';
import {collectTurnChoice} from '../scripts/turn-gated-dev.mjs';
import {scoreTrainScale,trainScaleDevBank,TRS_TAGS,TRS_HISTORIES,TRS_EXPECT_MAINS,TRS_FIXTURE_SEEDS,TRS_ALPHA,TRS_LONG_MULT} from '../scripts/train-scale-dev.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkAgent=w=>({agentId:1,weights:{taste:[...w],actor:[...w],critic:[...w]}});

// --- module (4) ---
test('train-scale transplant imports work (exact + scaled a=0.25)',()=>{
  const src=snapshotWeights({1:mkAgent([1,2]),2:mkAgent([3,4])});
  const dst={1:mkAgent([0,0]),2:mkAgent([0,0])};
  copyWeights(src,dst);
  assert.deepEqual(dst[1].weights.taste,[1,2]);
  const scaled=scaleSnapshot(src,TRS_ALPHA);
  const dst2={1:mkAgent([0,0]),2:mkAgent([0,0])};
  copyWeights(scaled,dst2);
  const chk=checkScaledIntegrity(src,dst2,TRS_ALPHA);
  assert.equal(chk.ok,true);
  assert.ok(Math.abs(dst2[1].weights.taste[0]-0.25)<1e-12);
});
test('train-scale alpha constant guard (0.25 = dose-plateau value)',()=>{
  assert.equal(TRS_ALPHA,0.25);
});
test('train-scale billing identity (scale ops = element count)',()=>{
  const src=snapshotWeights({1:mkAgent([1,2,3])});
  const scaled=scaleSnapshot(src,TRS_ALPHA);
  let n=0;for(const id of Object.keys(scaled))for(const k of Object.keys(scaled[id]))n+=scaled[id][k].length;
  assert.equal(n,9);
});
test('train-scale sources-closure guard (frozen machinery imported, not duplicated)',()=>{
  const src=readFileSync(join(root,'scripts','train-scale-dev.mjs'),'utf8');
  assert.ok(src.includes('turn-gated-dev-v1m.mjs'),'must import frozen V1m transplant machinery');
  assert.ok(src.includes('taste-kernel-dev.mjs'),'must import T1 correctness primitive');
  assert.ok(!src.includes('function copyWeights'),'must not duplicate transplant code');
});

// --- instrument (8) ---
const mkRow=(tag,seed,corr,survFrac=0.9,join=1)=>{
  const contact=100,turn=Math.round(contact*corr);
  return {tag,history:{seed},
    endpoint:{tick:1792,founders:24,survivors:Math.round(24*survFrac),scalarOperations:1e6,accountingResidual:0},
    summary:{decisions:100,joined:Math.round(100*join),joinRate:join,
      cues:{'1,1,-1,-1':{contact,pause:20,turn,beneficial:0,harmful:10,label:'harmful'},
        '1,-1,1,-1':{contact,pause:20,turn:contact-turn,beneficial:10,harmful:0,label:'beneficial'}}}}};
const tRows=(s,l,r,surv=0.9)=>{const rows=[];for(let h=0;h<6;h++){const seed=455001+h;
  rows.push(mkRow('short',seed,s,surv));rows.push(mkRow('long',seed,l,surv));rows.push(mkRow('restart',seed,r,surv));}return rows;};

test('train-scale collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true},action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
  assert.equal(s.cues['1,1,-1,-1'].label,'harmful');
});
test('train-scale scorer GO (restart 0.95 vs long 0.82: +0.13 perturbation win)',()=>{
  const v=scoreTrainScale(tRows(0.82,0.82,0.95));
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2b,true);
  assert.ok(Math.abs(v.restartMinusLong-0.13)<1e-9);
  assert.equal(v.g2a,true);
  assert.equal(v.verdict,'TRS-GO');
});
test('train-scale scorer NOGO when time suffices (long 0.95, restart 0.95)',()=>{
  const v=scoreTrainScale(tRows(0.82,0.95,0.95));
  assert.ok(Math.abs(v.restartMinusLong)<1e-9);
  assert.equal(v.g2a,false);
  assert.ok(Math.abs(v.timeEffect-0.13)<1e-9);
  assert.equal(v.verdict,'TRS-NOGO');
});
test('train-scale scorer NOGO when both stuck (structural ceiling)',()=>{
  const v=scoreTrainScale(tRows(0.82,0.83,0.83));
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'TRS-NOGO');
});
test('train-scale scorer INVALID on join fail',()=>{
  const rows=tRows(0.82,0.82,0.95).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreTrainScale(rows);
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'TRS-INVALID');
});
test('train-scale scorer INCOMPLETE-HARSH on world kill (<30% survival)',()=>{
  const v=scoreTrainScale(tRows(0.82,0.82,0.95,0.1));
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'TRS-INCOMPLETE-HARSH');
});
test('train-scale bank builds in tmpdir (9-schema, 54 unique, union-excluded)',()=>{
  const dir=mkdtempSync(join(tmpdir(),'trs-bank-'));
  const p=trainScaleDevBank(join(dir,'bank.json'));
  assert.equal(p.experiment,'train-scale-dev-v1');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  for(const s of [455001,455054])assert.ok(flat.includes(s));
  for(const s of [450001,453001,454001])assert.ok(p.excludedSeeds.includes(s));
});
test('train-scale mains-caps + tick-count guards (6x3=18; long/restart 2x)',()=>{
  assert.equal(TRS_TAGS.length*TRS_HISTORIES,TRS_EXPECT_MAINS);
  assert.equal(TRS_FIXTURE_SEEDS.length,54);
  assert.equal(TRS_LONG_MULT,2);
  const src=readFileSync(join(root,'scripts','train-scale-dev.mjs'),'utf8');
  assert.ok(src.includes('BT_TICKS*TRS_LONG_MULT'),'runner must advance long/restart rows 2x');
  assert.ok(src.includes('455001'),'runner must reference fresh-17 range');
});
