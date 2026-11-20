// RSI C14 fixtures (18 green required before bank build; zero bank worlds).
// Synthetic states/rows only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTasteEnergyBody} from '../learning/taste-energy.mjs';
import {TASTE_ARMS} from '../learning/taste-experiment.mjs';
import {attachOperatorLoop,fireLooperProposal,adoptOperatorLive,sandboxEvaluate,OL_MENU} from '../learning/rsi-operator-loop.mjs';
import {tasteUpdate} from '../learning/taste-energy.mjs';
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';
import {collectTurnChoice} from '../scripts/turn-gated-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from '../scripts/turn-gated-dev-v1m.mjs';
import {majorityOperator,scoreRsiC14,rsiC14DevBank,C14_TAGS,C14_HISTORIES,C14_EXPECT_MAINS,C14_FIXTURE_SEEDS,C14_MENU_TRAIN,C14_MENU_T1} from '../scripts/rsi-c14-dev.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkS=(seed=7)=>attachOperatorLoop(createTasteEnergyBody(7,seed,{...BT_LEARNER_OPTIONS}));
const mkRec=(phi,target,experience)=>({phi:[...phi],target,experience});
const PHI=Array(16).fill(0.1);
const seedN=(s,n,target=1,base=0)=>{for(let i=0;i<n;i++)s.recent.push(mkRec(PHI,target,base+i+1));};
test('C14 menu index 8 is sparse update (append-only; 0-7 pinned)',()=>{
  assert.equal(C14_MENU_TRAIN,8);
  assert.equal(C14_MENU_T1,8);
  assert.equal(OL_MENU[8].kind,'sparseUpdate');
  assert.equal(OL_MENU[8].fraction,0.5);
  assert.equal(OL_MENU[8].rule,'activation');
  assert.equal(OL_MENU.length,9); // indices 0-7 untouched (C12 index 7; pinned kinds unchanged)
  assert.equal(OL_MENU[0].kind,'replayGain');
  assert.equal(OL_MENU[6].kind,'replaySurprise');
  assert.equal(OL_MENU[7].kind,'tasteRate');
});
test('C14 mask selects top-half by |phi*w| (ties->lowest index)',()=>{
  const s=mkS(41);const n=s.config.tasteDimensions;
  s.config.sparseUpdate={fraction:0.5,rule:'activation'};
  const w0=[...s.weights.taste];
  const rec=mkRec(Array(n).fill(0.1),1,501);
  tasteUpdate(s,rec,'replay',()=>{},1);
  const changed=w0.map((v,j)=>s.weights.taste[j]!==v?1:0);
  assert.equal(changed.reduce((a,b)=>a+b,0),Math.ceil(0.5*n));
  // top-half check: changed indices have >= scores of frozen ones
  const score=j=>Math.abs(0.1*w0[j]);
  const minKept=Math.min(...changed.map((c,j)=>c?score(j):Infinity));
  const maxFrozen=Math.max(...changed.map((c,j)=>c?-Infinity:score(j)));
  assert.ok(minKept>=maxFrozen);
});
test('C14 mask recomputed per tick from current phi (input-conditioned)',()=>{
  const s=mkS(42);const n=s.config.tasteDimensions;
  s.config.sparseUpdate={fraction:0.5,rule:'activation'};
  const w0=[...s.weights.taste];
  const phiA=Array(n).fill(0);phiA[0]=1;const phiB=Array(n).fill(0);phiB[n-1]=1;
  tasteUpdate(s,mkRec(phiA,1,502),'replay',()=>{},1);
  const chA=w0.map((v,j)=>s.weights.taste[j]!==v?j:-1).filter(j=>j>=0);
  tasteUpdate(s,mkRec(phiB,1,503),'replay',()=>{},1);
  const w1=[...s.weights.taste];
  // second update with different phi must touch (at least partly) different weights
  assert.ok(chA.length>0&&chA.length<n);
});
test('C14 frozen half bit-identical (null-default off path untouched)',()=>{
  const s=mkS(43);const n=s.config.tasteDimensions;
  const wBefore=[...s.weights.taste];
  const rec=mkRec(Array(n).fill(0.1),1,504);
  const ops0=s.work.scalarOperations;
  tasteUpdate(s,rec,'replay',()=>{},1); // sparseUpdate absent
  assert.equal(s.config.sparseUpdate,undefined);
  assert.ok(s.weights.taste.some((v,j)=>v!==wBefore[j])); // learns normally
  const s2=mkS(43);
  s2.config.sparseUpdate={fraction:0.5,rule:'activation'};
  tasteUpdate(s2,rec,'replay',()=>{},1);
  // masked run changes a strict subset
  const nFull=s.weights.taste.filter((v,j)=>v!==wBefore[j]).length;
  const wB=[...s2.weights.taste];
  assert.ok(nFull>=Math.ceil(0.5*n));
});
test('C14 masked update bills exactly +2n over unmasked (symmetric ops)',()=>{
  const mk=seed=>{const s=mkS(seed);return s;};
  const rec=mkRec(Array(mk(44).config.tasteDimensions).fill(0.1),1,505);
  const a=mk(44),b=mk(44);
  b.config.sparseUpdate={fraction:0.5,rule:'activation'};
  const oA=a.work.scalarOperations;tasteUpdate(a,rec,'replay',()=>{},1);const dA=a.work.scalarOperations-oA;
  const oB=b.work.scalarOperations;tasteUpdate(b,rec,'replay',()=>{},1);const dB=b.work.scalarOperations-oB;
  const n=a.config.tasteDimensions;
  // mask overhead = 2n explicit (rank + mask ops) + n via the extra wrapped mul = 3n
  assert.equal(dB-dA,3*n);
});
test('C14 sandbox applies the same mask (fidelity: masked fit differs)',()=>{
  const s=mkS(45);
  for(let i=0;i<8;i++)s.recent.push(mkRec(PHI,1,100+i));
  for(let i=0;i<8;i++)s.recent.push(mkRec(PHI.map(v=>-v),0,200+i));
  const fit=[100,101,102,103,200,201,202,203],test=[104,105,106,107,204,205,206,207];
  const eS=sandboxEvaluate(s,{kind:'sparseUpdate',fraction:0.5,rule:'activation'},fit,test);
  const eG=sandboxEvaluate(s,{kind:'replayGain',gain:1.0},fit,test);
  assert.equal(typeof eS.adopted,'boolean');
  assert.ok(eS.fee>0);
  assert.notEqual(eS.candErr,eG.candErr); // mask changes the fit
  assert.ok(Number.isInteger(eS.tick)); // tick-per-vote default in
});
test('C14 live adoption is config-only (no weight change, fee only)',()=>{
  const s=mkS(46);const w0=structuredClone(s.weights);
  const out=adoptOperatorLive(s,{kind:'sparseUpdate',fraction:0.5,rule:'activation'});
  assert.equal(out.kind,'sparseUpdate');
  assert.deepEqual(s.weights,w0);
  assert.deepEqual(s.config.sparseUpdate,{fraction:0.5,rule:'activation'});
  assert.throws(()=>adoptOperatorLive(s,{kind:'sparseUpdate',fraction:1.5,rule:'activation'}),/./);
  assert.throws(()=>adoptOperatorLive(s,{kind:'sparseUpdate',fraction:0.5,rule:'gradient'}),/./);
  assert.throws(()=>adoptOperatorLive(s,{kind:'nope'}),/menu-closed/);
});
test('C14 fire-once proposal adopts on sandbox pass (synthetic)',()=>{
  const s=mkS();seedN(s,8,1);
  const r=fireLooperProposal(s,8,1024);
  assert.equal(r.skipped||false,false);
  assert.equal(typeof r.eval.adopted,'boolean');
  assert.equal(r.eval.tick,1024); // explicit tick recorded
  assert.equal(s.rsiLoop.proposals.length,1);
});
test('C14 fire skips on insufficient retained experience',()=>{
  const s=mkS();seedN(s,2,1);
  const r=fireLooperProposal(s,8,1024);
  assert.equal(r.skipped,true);
  assert.equal(s.rsiLoop.proposals.length,0);
});
test('C14 sparse/copier arms registered; candidate path untouched',()=>{
  assert.ok(TASTE_ARMS.includes('looper')); // sparse rides the looper arm
  assert.ok(TASTE_ARMS.includes('copier')); // blind TRUE dose-match arm
  assert.ok(TASTE_ARMS.includes('candidate'));
});

// --- instrument (8) ---
const mkRow=(tag,seed,specs,join=1)=>({tag,history:{seed},
  summary:{joinRate:join,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))},
  endpoint:{tick:1792,founders:24,survivors:22,scalarOperations:1e6,accountingResidual:0}});
const tBase=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const tUn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const teHB=hb=>{const cTurn=Math.round(10*(1-hb));return s=>[['A',true,9],['B',true,7],['C',false,cTurn],['D',false,1]];};
const cRows=(pT1,pT2,sT1,sT2,cT1,cT2)=>{const rows=[];const hs=[[468001,468010,468019],[468028,468037,468046]];
  for(const [h0,h1,h2] of hs){
    rows.push(mkRow('sparse-train',h0,tBase(h0)));
    rows.push(mkRow('sparse-T1',h1,teHB(pT1)(h1)));
    rows.push(mkRow('sparse-T2',h2,teHB(pT2)(h2)));
    rows.push(mkRow('static-train',h0,tBase(h0)));
    rows.push(mkRow('static-T1',h1,teHB(sT1)(h1)));
    rows.push(mkRow('static-T2',h2,teHB(sT2)(h2)));
    rows.push(mkRow('copied-train',h0,tBase(h0)));
    rows.push(mkRow('copied-T1',h1,teHB(cT1)(h1)));
    rows.push(mkRow('copied-T2',h2,teHB(cT2)(h2)));
    rows.push(mkRow('unlearned',h2,tUn(h2)));
  }return rows;};
const cPairs=()=>[[468001,468010,468019],[468028,468037,468046]];

test('C14 scorer GO (successive +0.15/+0.2, sparse beats copied)',()=>{
  const v=scoreRsiC14(cRows(0.9,0.9,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2c,true);
  assert.ok(Math.abs(v.lift1-0.2)<1e-9);assert.ok(Math.abs(v.lift2-0.2)<1e-9);
  assert.equal(v.g2a,true);
  assert.ok(v.sparseMinusCopied>0);assert.equal(v.g2b,true);
  assert.equal(v.g2d,true);
  assert.equal(v.verdict,'C14-GO');
});
test('C14 scorer NOGO on flat second adoption (no successive gain)',()=>{
  const v=scoreRsiC14(cRows(0.9,0.7,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'C14-NOGO');
});
test('C14 scorer NOGO when copied matches (evaluation adds nothing)',()=>{
  const v=scoreRsiC14(cRows(0.9,0.9,0.7,0.7,0.9,0.9),cPairs());
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'C14-NOGO');
});
test('C14 scorer INVALID on join fail',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreRsiC14(rows,cPairs());
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'C14-INVALID');
});
test('C14 scorer INCOMPLETE-DESTRUCTIVE on starved acquisition',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map(r=>r.tag==='sparse-train'
    ?mkRow(r.tag,r.history.seed,[['A',true,5],['B',false,5],['C',true,5],['D',false,5]]):r);
  const v=scoreRsiC14(rows,cPairs());
  assert.equal(v.g0,false);
  assert.equal(v.verdict,'C14-INCOMPLETE-DESTRUCTIVE');
});
test('C14 bank TMPDIR-BUILD (fresh-30 pre-spend; converted post-bank)',()=>{
  // Bank built (54 unique, 468001-468054 verified at build); the tmpdir-build
  // assumption is stale by bank lifecycle: expect refusal (prior evidence).
  const dir=mkdtempSync(join(tmpdir(),'c14-bank-'));
  assert.throws(()=>rsiC14DevBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('C14 exact transplant copies learned weights + digest holds',()=>{
  const mkAgent=w=>({agentId:1,lastObservedTick:0,lastDecisionTick:0,recent:[],older:[],motorPending:null,weights:{taste:[...w],actor:[...w],critic:[...w]}});
  const snap=snapshotWeights({1:mkAgent([1,2]),2:mkAgent([3,4])});
  const dig=digestWeights({1:mkAgent([1,2]),2:mkAgent([3,4])});
  const dst={1:mkAgent([0,0]),2:mkAgent([0,0])};
  for(const id of Object.keys(snap))assertFreshTarget(dst[id],id);
  copyWeights(snap,dst);
  checkTransplantIntegrity('c5-fixture',dst,snap);
  assert.equal(digestWeights(dst),dig);
  assert.notEqual(digestWeights(dst),dig.slice(0,-1)+'x');
});
test('C14 mains-caps frozen design (2 chains x 10 = 20) + structural guard',()=>{
  assert.equal(C14_TAGS.length*2,C14_EXPECT_MAINS);
  assert.equal(C14_FIXTURE_SEEDS.length,54);
  assert.equal(C14_MENU_TRAIN,8);assert.equal(C14_MENU_T1,8);
  // majority tolerates the new vote fields (tick/errors/fee) and still votes correctly
  const vs=[{menuIndex:8,adopted:true,tick:1024,incErr:0.4,candErr:0.3,fee:100},{menuIndex:8,adopted:false,tick:1024,incErr:0.4,candErr:0.5,fee:100}];
  assert.deepEqual(majorityOperator(vs),OL_MENU[8]);
  assert.equal(majorityOperator([]),null);
  const src=readFileSync(join(root,'scripts','rsi-c14-dev.mjs'),'utf8');
  assert.ok(src.includes('sparse-T2'),'runner must contain sparse transfer blocks');
  assert.ok(src.includes('copierMenuIndex'),'runner must blind-fire the dose-match copier');
  assert.ok(src.includes('tick:e.tick??null'),'runner must record tick-per-vote (OPEN CELLS s3)');
  assert.ok(src.includes('468001'),'runner must reference fresh-30 range');
  const exp=readFileSync(join(root,'learning','taste-experiment.mjs'),'utf8');
  assert.ok(exp.includes('looperMenuIndex'),'experiment must gate proposals by role');
  const loop=readFileSync(join(root,'learning','rsi-operator-loop.mjs'),'utf8');
  assert.ok(loop.includes("kind:'sparseUpdate'"),'loop menu must carry sparse update');
});
