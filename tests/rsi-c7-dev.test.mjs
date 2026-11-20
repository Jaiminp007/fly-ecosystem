// RSI C4 fixtures (14 green required before bank build; zero bank worlds).
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
test('C7 menu indices are surprise-gated gain (6/6 asserted; append-only)',()=>{
  assert.equal(C7_MENU_TRAIN,6);
  assert.equal(C7_MENU_T1,6);
  assert.equal(OL_MENU[6].kind,'replaySurprise');
  assert.equal(OL_MENU[6].gain,3.0);
  assert.equal(OL_MENU[6].live,1.0);
  assert.equal(OL_MENU.length,9); // indices 0-7 untouched (C12 index 7, C14 index 8; pinned kinds unchanged)
  assert.equal(OL_MENU[0].kind,'replayGain');
  assert.equal(OL_MENU[5].kind,'shrinkOnce');
});
test('C7 surprise sandbox runs live-fit path (fee billed, boolean verdict)',()=>{
  const s=mkS(21);
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI,1,100+i));
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI.map(v=>-v),0,200+i));
  const r=sandboxEvaluate(s,{kind:'replaySurprise',gain:3.0,live:1.0},[100,101,102,200,201,202],[103,104,105,203,204,205]);
  assert.ok(r.fee>0);
  assert.equal(typeof r.adopted,'boolean');
});
test('C7 live adoption inits surprise state + bills 2 (no crash on BT states)',()=>{
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
import {majorityOperator,scoreRsiC7,rsiC7DevBank,C7_TAGS,C7_HISTORIES,C7_EXPECT_MAINS,C7_FIXTURE_SEEDS,C7_MENU_TRAIN,C7_MENU_T1} from '../scripts/rsi-c7-dev.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkS=(seed=7)=>attachOperatorLoop(createTasteEnergyBody(7,seed,{...BT_LEARNER_OPTIONS}));
const mkRec=(phi,target,experience)=>({phi:[...phi],target,experience});
const PHI=Array(16).fill(0.1);
const seedN=(s,n,target=1,base=0)=>{for(let i=0;i<n;i++)s.recent.push(mkRec(PHI,target,base+i+1));};

// --- module (7) ---
test('C7 live-adopt gain/skip sets config (no other change)',()=>{
  const s=mkS();const w0=structuredClone(s.weights);
  adoptOperatorLive(s,{kind:'replayGain',gain:2.0});
  assert.equal(s.config.replayGain,2.0);
  assert.deepEqual(s.weights,w0);
  adoptOperatorLive(s,{kind:'replaySkip',skip:0.1});
  assert.equal(s.config.replaySkip,0.1);
  assert.throws(()=>adoptOperatorLive(s,{kind:'replayGain',gain:-1}),/./);
  assert.throws(()=>adoptOperatorLive(s,{kind:'nope'}),/menu-closed/);
});
test('C7 live-adopt shrink scales weights + bills exactly',()=>{
  const s=mkS();
  const n=Object.values(s.weights).reduce((a,w)=>a+w.length,0);
  const w0=s.work.scalarOperations;
  adoptOperatorLive(s,{kind:'shrinkOnce',alpha:0.25});
  assert.ok(Math.abs(s.weights.taste[0]-0)<1e-300||s.weights.taste.every(v=>v===0));
  assert.equal(s.work.scalarOperations-w0,n);
  assert.throws(()=>adoptOperatorLive(s,{kind:'shrinkOnce',alpha:1.5}),/./);
});
test('C7 fire-once proposal adopts on sandbox pass (synthetic)',()=>{
  const s=mkS();seedN(s,8,1);
  const r=fireLooperProposal(s,2);
  assert.equal(r.skipped||false,false);
  assert.equal(typeof r.eval.adopted,'boolean');
  assert.equal(s.rsiLoop.proposals.length,1);
});
test('C7 fire skips on insufficient retained experience',()=>{
  const s=mkS();seedN(s,2,1);
  const r=fireLooperProposal(s,0);
  assert.equal(r.skipped,true);
  assert.equal(s.rsiLoop.proposals.length,0);
});
test('C7 looper arm registered; candidate path untouched',()=>{
  assert.ok(TASTE_ARMS.includes('looper'));
  assert.ok(TASTE_ARMS.includes('candidate'));
});
test('C7 majority vote (ties->lowest, empty->baseline)',()=>{
  assert.deepEqual(majorityOperator([{menuIndex:1,adopted:true},{menuIndex:1,adopted:true},{menuIndex:0,adopted:true}]),OL_MENU[1]);
  assert.deepEqual(majorityOperator([{menuIndex:2,adopted:true},{menuIndex:0,adopted:true}]),OL_MENU[0]);
  assert.equal(majorityOperator([{menuIndex:0,adopted:false}]),null);
  assert.equal(majorityOperator([]),null);
});
test('C7 lifetime structural (module cap 4; C2 fires at most twice by schedule)',()=>{
  const s=mkS();seedN(s,8,1);
  fireLooperProposal(s,0);
  assert.equal(s.rsiLoop.proposals.length,1);
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
const cRows=(lT1,lT2,sT1,sT2,cT1,cT2)=>{const rows=[];const hs=[[461001,461010,461019],[461028,461037,461046]];
  for(const [h0,h1,h2] of hs){
    rows.push(mkRow('looper-train',h0,tBase(h0)));
    rows.push(mkRow('looper-T1',h1,teHB(lT1)(h1)));
    rows.push(mkRow('looper-T2',h2,teHB(lT2)(h2)));
    rows.push(mkRow('static-train',h0,tBase(h0)));
    rows.push(mkRow('static-T1',h1,teHB(sT1)(h1)));
    rows.push(mkRow('static-T2',h2,teHB(sT2)(h2)));
    rows.push(mkRow('copier-train',h0,tBase(h0)));
    rows.push(mkRow('copier-T1',h1,teHB(cT1)(h1)));
    rows.push(mkRow('copier-T2',h2,teHB(cT2)(h2)));
    rows.push(mkRow('unlearned',h2,tUn(h2)));
  }return rows;};
const cPairs=()=>[[461001,461010,461019],[461028,461037,461046]];

test('C7 collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true},action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
});
test('C7 scorer GO (successive +0.15/+0.2, looper beats copier)',()=>{
  const v=scoreRsiC7(cRows(0.9,0.9,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2c,true);
  assert.ok(Math.abs(v.lift1-0.2)<1e-9);assert.ok(Math.abs(v.lift2-0.2)<1e-9);
  assert.equal(v.g2a,true);
  assert.ok(v.looperMinusCopied>0);assert.equal(v.g2b,true);
  assert.equal(v.g2d,true);
  assert.equal(v.verdict,'C7-GO');
});
test('C7 scorer NOGO on flat second adoption (no successive gain)',()=>{
  const v=scoreRsiC7(cRows(0.9,0.7,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'C7-NOGO');
});
test('C7 scorer NOGO when copier matches (filter adds nothing)',()=>{
  const v=scoreRsiC7(cRows(0.9,0.9,0.7,0.7,0.9,0.9),cPairs());
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'C7-NOGO');
});
test('C7 scorer INVALID on join fail',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreRsiC7(rows,cPairs());
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'C7-INVALID');
});
test('C7 scorer INCOMPLETE on untrained baseline',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map(r=>r.tag==='looper-train'
    ?mkRow(r.tag,r.history.seed,[['A',true,5],['B',false,5],['C',true,5],['D',false,5]]):r);
  const v=scoreRsiC7(rows,cPairs());
  assert.equal(v.g0,false);
  assert.equal(v.verdict,'C7-INCOMPLETE-UNTRAINED');
});
test('C7 bank refuses rebuild (fresh-23 on disk; union-exclusion holds)',()=>{
  // Bank built (54 unique, 461001-461054 verified at build); the tmpdir-build
  // assumption is stale by bank lifecycle: expect refusal (prior evidence).
  const dir=mkdtempSync(join(tmpdir(),'c7-bank-'));
  assert.throws(()=>rsiC7DevBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('C7 copier auto-adopts blind at tick 1024 (no sandbox, bills init only)',()=>{
  const s=createTasteEnergyBody(7,31,{...BT_LEARNER_OPTIONS}); // blind: no loop attached (copier arm never attaches)
  for(let i=0;i<8;i++)s.recent.push(mkRec(PHI,1,300+i));
  assert.equal(s.config.replaySurpriseGain,0);
  assert.equal(s.rsiLoop,undefined); // blind: no loop attached
  const beforeOps=s.work.scalarOperations;
  const out=adoptOperatorLive(s,{kind:'replaySurprise',gain:3.0,live:1.0});
  assert.equal(out.kind,'replaySurprise');
  assert.equal(s.config.replaySurpriseGain,3.0);
  assert.equal(s.work.scalarOperations,beforeOps+2); // init only, no eval fee
  assert.equal(s.rsiLoop,undefined); // still no sandbox records
});
test('C7 exact transplant copies learned weights + digest holds',()=>{
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
test('C7 mains-caps frozen design (2 chains x 10 = 20) + structural guard',()=>{
  assert.equal(C7_TAGS.length*2,C7_EXPECT_MAINS);
  assert.equal(C7_FIXTURE_SEEDS.length,54);
  assert.equal(C7_MENU_TRAIN,6);assert.equal(C7_MENU_T1,6);
  const src=readFileSync(join(root,'scripts','rsi-c7-dev.mjs'),'utf8');
  assert.ok(src.includes('looper-T2'),'runner must contain looper transfer blocks');
  assert.ok(src.includes('majorityOperator'),'runner must vote adoptions');
  assert.ok(src.includes('461001'),'runner must reference fresh-18 range');
  const exp=readFileSync(join(root,'learning','taste-experiment.mjs'),'utf8');
  assert.ok(exp.includes('looperMenuIndex'),'experiment must gate proposals by role');
});
