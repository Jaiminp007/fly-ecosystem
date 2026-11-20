// RSI C13 fixtures (17 green required before bank build; zero bank worlds).
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
import {fireTickProposal} from '../learning/taste-experiment.mjs';
test('C13 menu indices are surprise-gated gain (6/6 asserted; append-only)',()=>{
  assert.equal(C13_MENU_TRAIN,6);
  assert.equal(C13_MENU_T1,6);
  assert.equal(OL_MENU[6].kind,'replaySurprise');
  assert.equal(OL_MENU[6].gain,3.0);
  assert.equal(OL_MENU[6].live,1.0);
  assert.equal(OL_MENU.length,9); // indices 0-7 untouched (C12 index 7, C14 index 8; pinned kinds unchanged)
  assert.equal(OL_MENU[0].kind,'replayGain');
  assert.equal(OL_MENU[5].kind,'shrinkOnce');
});
test('C13 surprise sandbox runs live-fit path (fee billed, boolean verdict)',()=>{
  const s=mkS(21);
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI,1,100+i));
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI.map(v=>-v),0,200+i));
  const r=sandboxEvaluate(s,{kind:'replaySurprise',gain:3.0,live:1.0},[100,101,102,200,201,202],[103,104,105,203,204,205]);
  assert.ok(r.fee>0);
  assert.equal(typeof r.adopted,'boolean');
});
test('C13 live adoption inits surprise state + bills 2 (no crash on BT states)',()=>{
  const s=mkS(22);
  assert.equal(s.config.surpriseGain,0);
  assert.equal(s.surpriseEma,undefined); // BT construction: absent
  const out=adoptOperatorLive(s,{kind:'replaySurprise',gain:3.0,live:1.0});
  assert.equal(out.kind,'replaySurprise');
  assert.equal(s.config.surpriseGain,1.0);
  assert.equal(s.config.replaySurpriseGain,3.0);
  assert.equal(s.surpriseEma,0);
  assert.equal(s.surpriseTimer,0);
});
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';
import {collectTurnChoice} from '../scripts/turn-gated-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from '../scripts/turn-gated-dev-v1m.mjs';
import {majorityOperator,scoreRsiC13,rsiC13DevBank,C13_TAGS,C13_HISTORIES,C13_EXPECT_MAINS,C13_FIXTURE_SEEDS,C13_MENU_TRAIN,C13_MENU_T1} from '../scripts/rsi-c13-dev.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkS=(seed=7)=>attachOperatorLoop(createTasteEnergyBody(7,seed,{...BT_LEARNER_OPTIONS}));
const mkRec=(phi,target,experience)=>({phi:[...phi],target,experience});
const PHI=Array(16).fill(0.1);
const seedN=(s,n,target=1,base=0)=>{for(let i=0;i<n;i++)s.recent.push(mkRec(PHI,target,base+i+1));};

// --- module (8): loop + two-fire scheduling ---
test('C13 fire-once proposal adopts on sandbox pass (synthetic)',()=>{
  const s=mkS();seedN(s,8,1);
  const r=fireLooperProposal(s,2);
  assert.equal(r.skipped||false,false);
  assert.equal(typeof r.eval.adopted,'boolean');
  assert.equal(s.rsiLoop.proposals.length,1);
});
test('C13 fire skips on insufficient retained experience',()=>{
  const s=mkS();seedN(s,2,1);
  const r=fireLooperProposal(s,0);
  assert.equal(r.skipped,true);
  assert.equal(s.rsiLoop.proposals.length,0);
});
test('C13 double arm registered; candidate path untouched',()=>{
  assert.ok(TASTE_ARMS.includes('double'));
  assert.ok(TASTE_ARMS.includes('looper'));
  assert.ok(TASTE_ARMS.includes('candidate'));
});
test('C13 double fires at both ticks (512+1024); looper at 1024 only',()=>{
  const s=mkS(31);seedN(s,8,1);
  const dbl={arm:'double',looperMenuIndex:6},one={arm:'looper',looperMenuIndex:6};
  fireTickProposal(dbl,s,{tick:512});
  assert.equal(s.rsiLoop.proposals.length,1);
  fireTickProposal(one,s,{tick:512});
  assert.equal(s.rsiLoop.proposals.length,1); // looper silent at 512
  fireTickProposal(dbl,s,{tick:1024});
  assert.equal(s.rsiLoop.proposals.length,2);
});
test('C13 adopt-then-refire: second fire inherits adopted config',()=>{
  const s=mkS(32);seedN(s,8,1);
  const dbl={arm:'double',looperMenuIndex:6};
  fireTickProposal(dbl,s,{tick:512});
  adoptOperatorLive(s,OL_MENU[6]); // force the first-fire adoption branch
  assert.equal(s.config.replaySurpriseGain,3.0);
  fireTickProposal(dbl,s,{tick:1024});
  assert.equal(s.rsiLoop.proposals.length,2);
  assert.equal(s.config.replaySurpriseGain,3.0); // second decision conditioned on first
});

// --- instrument (9) ---
const mkRow=(tag,seed,specs,join=1)=>({tag,history:{seed},
  summary:{joinRate:join,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))},
  endpoint:{tick:1792,founders:24,survivors:22,scalarOperations:1e6,accountingResidual:0}});
const tBase=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const tUn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const teHB=hb=>{const cTurn=Math.round(10*(1-hb));return s=>[['A',true,9],['B',true,7],['C',false,cTurn],['D',false,1]];};
const cRows=(dT1,dT2,sT1,sT2,nT1,nT2)=>{const rows=[];const hs=[[467001,467010,467019],[467028,467037,467046]];
  for(const [h0,h1,h2] of hs){
    rows.push(mkRow('double-train',h0,tBase(h0)));
    rows.push(mkRow('double-T1',h1,teHB(dT1)(h1)));
    rows.push(mkRow('double-T2',h2,teHB(dT2)(h2)));
    rows.push(mkRow('static-train',h0,tBase(h0)));
    rows.push(mkRow('static-T1',h1,teHB(sT1)(h1)));
    rows.push(mkRow('static-T2',h2,teHB(sT2)(h2)));
    rows.push(mkRow('single-train',h0,tBase(h0)));
    rows.push(mkRow('single-T1',h1,teHB(nT1)(h1)));
    rows.push(mkRow('single-T2',h2,teHB(nT2)(h2)));
    rows.push(mkRow('unlearned',h2,tUn(h2)));
  }return rows;};
const cPairs=()=>[[467001,467010,467019],[467028,467037,467046]];

test('C13 collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true},action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
});
test('C13 scorer GO (successive +0.15/+0.2, double beats single)',()=>{
  const v=scoreRsiC13(cRows(0.9,0.9,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2c,true);
  assert.ok(Math.abs(v.lift1-0.2)<1e-9);assert.ok(Math.abs(v.lift2-0.2)<1e-9);
  assert.equal(v.g2a,true);
  assert.ok(v.doubleMinusSingle>0);assert.equal(v.g2b,true);
  assert.equal(v.g2d,true);
  assert.equal(v.verdict,'C13-GO');
});
test('C13 scorer NOGO on flat second adoption (no successive gain)',()=>{
  const v=scoreRsiC13(cRows(0.9,0.7,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'C13-NOGO');
});
test('C13 scorer NOGO when single matches (second fire adds nothing)',()=>{
  const v=scoreRsiC13(cRows(0.9,0.9,0.7,0.7,0.9,0.9),cPairs());
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'C13-NOGO');
});
test('C13 scorer INVALID on join fail',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreRsiC13(rows,cPairs());
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'C13-INVALID');
});
test('C13 scorer INCOMPLETE on untrained baseline',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map(r=>r.tag==='double-train'
    ?mkRow(r.tag,r.history.seed,[['A',true,5],['B',false,5],['C',true,5],['D',false,5]]):r);
  const v=scoreRsiC13(rows,cPairs());
  assert.equal(v.g0,false);
  assert.equal(v.verdict,'C13-INCOMPLETE-UNTRAINED');
});
test('C13 bank refuses rebuild (fresh-29 on disk; union-exclusion holds)',()=>{
  // Bank built (54 unique, 467001-467054 verified at build); the tmpdir-build
  // assumption is stale by bank lifecycle: expect refusal (prior evidence).
  const dir=mkdtempSync(join(tmpdir(),'c13-bank-'));
  assert.throws(()=>rsiC13DevBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('C13 exact transplant copies learned weights + digest holds',()=>{
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
test('C13 mains-caps frozen design (2 chains x 10 = 20) + structural guard',()=>{
  assert.equal(C13_TAGS.length*2,C13_EXPECT_MAINS);
  assert.equal(C13_FIXTURE_SEEDS.length,54);
  assert.equal(C13_MENU_TRAIN,6);assert.equal(C13_MENU_T1,6);
  const src=readFileSync(join(root,'scripts','rsi-c13-dev.mjs'),'utf8');
  assert.ok(src.includes('double-T2'),'runner must contain double transfer blocks');
  assert.ok(src.includes('majorityOperator'),'runner must vote adoptions (reporting)');
  assert.ok(src.includes('467001'),'runner must reference fresh-29 range');
  assert.ok(src.includes("'double'"),'runner must map double tags to the double arm');
  const exp=readFileSync(join(root,'learning','taste-experiment.mjs'),'utf8');
  assert.ok(exp.includes('looperMenuIndex'),'experiment must gate proposals by role');
  assert.ok(exp.includes('OL_PROPOSAL_TICK_EARLY'),'experiment must fire double at the early tick');
});
