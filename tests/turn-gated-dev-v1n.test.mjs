// TURN-GATED V1n fixtures (13/13 green required before bank build; zero bank worlds).
// Synthetic learners/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {copyWeights,checkScaledIntegrity,scaleSnapshot,snapshotWeights,scoreFlipSplitV1m} from '../scripts/turn-gated-dev-v1m.mjs';
import {collectTurnChoice} from '../scripts/turn-gated-dev.mjs';
import {scoreTurnGateV1n,turnGateDevV1nBank,turnGateDevV1nSources,
  TN_EXPECT_MAINS,TN_EXPECT_PROBES,TN_ARMS,TN_PAIRS,TN_ALPHAS,TN_FIXTURE_SEEDS} from '../scripts/turn-gated-dev-v1n.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({agentId:1,weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaiting:true,acquisition:true,dead:false,recent:[],older:[],
  motorPending:null,hold:{cruise:false,remaining:0},...extra});
const snap=a=>snapshotWeights(a);

// V1n synthetic dose rows: BH 0.8 all arms; same 0.9; HB 0.05->0.8 ... 0.25->0.4.
// Train gap 0.7. Best alpha 0.05 hits MET bar (0.8 >= 0.7-0.1).
const mkRowN=(tag,seed,specs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
const nTrain=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const nLossy=a=>s=>{const hbTurn={0.05:2,0.1:3,0.15:4,0.2:5,0.25:6}[a];
  return [['A',true,9],['B',true,8],['C',false,hbTurn],['D',false,1]];};
const nUnlearn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const nRows=()=>{const rows=[];for(let h=0;h<3;h++){const s=453001+h;
  rows.push(mkRowN('train',s,nTrain(s)));
  for(const a of TN_ALPHAS)rows.push(mkRowN(`transferred-lossy-${a}`,s,nLossy(a)(s)));
  rows.push(mkRowN('unlearned',s,nUnlearn(s)));}return rows;};
const nPairs=()=>[0,1,2].map(h=>[453001+h,453001+h]);

test('V1n transplant imports work (exact copy + scaled integrity)',()=>{
  const src=snap({1:mkAgent([[1,2],[3,4],[5,6]])});
  const dst={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(src,dst);
  assert.deepEqual(dst[1].weights,{taste:[1,2],actor:[3,4],critic:[5,6]});
  const scaled=scaleSnapshot(src,0.1);
  const dst2={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(scaled,dst2);
  const chk=checkScaledIntegrity(src,dst2,0.1);
  assert.equal(chk.ok,true);
});
test('V1n dose-selection: argmax over 5 alphas (peak at 0.05)',()=>{
  const v=scoreTurnGateV1n(nRows(),nPairs());
  assert.deepEqual(v.hbByAlpha,{0.05:0.8,0.1:0.7,0.15:0.6,0.2:0.5,0.25:0.4});
  assert.equal(v.bestAlpha,0.05);
  assert.ok(Math.abs(v.bestHb-0.8)<1e-9);
});
test('V1n mains-caps frozen design (7 tags x 3 pairs = 21)',()=>{
  assert.equal(TN_ARMS.length*TN_PAIRS.length,TN_EXPECT_MAINS);
  assert.equal(TN_EXPECT_PROBES,0);
  assert.equal(TN_FIXTURE_SEEDS.length,54);
});
test('V1n structural source guard (dose blocks + range present)',()=>{
  const src=readFileSync(join(root,'scripts','turn-gated-dev-v1n.mjs'),'utf8');
  assert.ok(src.includes('transferred-lossy-'),'runner must contain lossy dose blocks');
  assert.ok(src.includes('453001'),'runner must reference fresh-15 range');
  assert.ok(src.includes('turn-gated-dev-v1m.mjs'),'runner must import frozen V1m machinery');
});
test('V1n bank refuses rebuild post-spend (453xxx in prior evidence)',()=>{
  // V1n PHASE-N-GO committed the bank; the tmpdir-build assumption is stale by
  // bank lifecycle (V1k/V1l/V1m/T1/K1 precedent): expect refusal.
  const dir=mkdtempSync(join(tmpdir(),'v1n-bank-'));
  assert.throws(()=>turnGateDevV1nBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('V1n collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true},action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
  assert.equal(s.cues['1,1,-1,-1'].label,'harmful');
});
test('V1n scorer GO when best-alpha HB-seg1 within 0.1 of train',()=>{
  const v=scoreTurnGateV1n(nRows(),nPairs());
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2b,true);
  assert.equal(v.g2a,true);
  assert.equal(v.gBhFloor,true);assert.equal(v.gSameFloor,true);
  assert.equal(v.verdict,'PHASE-N-GO');
});
test('V1n scorer NOGO when no alpha reaches the MET bar',()=>{
  const flat=nRows().map(r=>r.tag.startsWith('transferred-lossy')
    ?mkRowN(r.tag,r.history.seed,[['A',true,9],['B',true,8],['C',false,8],['D',false,1]]):r);
  const n=scoreTurnGateV1n(flat,nPairs());
  assert.equal(n.g2a,false);
  assert.equal(n.verdict,'PHASE-N-NOGO');
});
test('V1n scorer NOGO on unlearned non-flat (g2b collapse analog)',()=>{
  const rows=nRows().map(r=>r.tag==='unlearned'
    ?mkRowN(r.tag,r.history.seed,[['A',true,9],['B',true,9],['C',false,1],['D',false,1]]):r);
  const v=scoreTurnGateV1n(rows,nPairs());
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'PHASE-N-NOGO');
});
test('V1n scorer INVALID on join fail',()=>{
  const rows=nRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreTurnGateV1n(rows,nPairs());
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'PHASE-N-INVALID');
});
test('V1n scorer INCOMPLETE on untrained baseline',()=>{
  const rows=nRows().map(r=>r.tag==='train'
    ?mkRowN(r.tag,r.history.seed,[['A',true,5],['B',true,5],['C',false,5],['D',false,5]]):r);
  const v=scoreTurnGateV1n(rows,nPairs());
  assert.equal(v.g0,false);
  assert.equal(v.verdict,'PHASE-N-INCOMPLETE-UNTRAINED');
});
test('V1n null-hygiene: VOID arm fails closed (bestAlpha null -> NOGO)',()=>{
  const rows=nRows().map(r=>r.tag==='transferred-lossy-0.05'
    ?{...r,summary:{joinRate:1,cues:{}}}:r);
  const v=scoreTurnGateV1n(rows,nPairs());
  assert.equal(v.bestAlpha,null);
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'PHASE-N-NOGO');
});
test('V1n BH floor breach fails closed',()=>{
  const rows=nRows().map(r=>r.tag==='transferred-lossy-0.1'
    ?mkRowN(r.tag,r.history.seed,[['A',true,9],['B',true,2],['C',false,3],['D',false,1]]):r);
  const v=scoreTurnGateV1n(rows,nPairs());
  assert.equal(v.gBhFloor,false);
  assert.equal(v.verdict,'PHASE-N-NOGO');
});
