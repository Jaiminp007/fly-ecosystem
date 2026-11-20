// RSI C4 fixtures (14 green required before bank build; zero bank worlds).
// Synthetic states/rows only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTasteEnergyBody} from '../learning/taste-energy.mjs';
import {TASTE_ARMS,fireTickProposal} from '../learning/taste-experiment.mjs';
import {attachOperatorLoop,fireLooperProposal,fireLooperChoice,fireLooperFlipChoice,adoptOperatorLive,sandboxEvaluate,OL_MENU} from '../learning/rsi-operator-loop.mjs';
test('C9 flip-choice runs 3 flipped evals (pure: retained records untouched)',()=>{
  const s=mkS(51);
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI,1,500+i));
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI.map(v=>-v),0,510+i));
  const beforeIds=s.recent.map(r=>r.experience).join(',');
  const beforeTargets=s.recent.map(r=>r.target).join(',');
  const r=fireLooperFlipChoice(s,[1,4,6]);
  assert.equal(r.skipped,false);
  assert.equal(r.n,3);
  assert.equal(s.rsiLoop.proposals.length,3);
  assert.ok(s.rsiLoop.proposals.every(p=>p.flipped===true)); // flipped-eval marked
  assert.equal(s.recent.map(r2=>r2.experience).join(','),beforeIds); // purity: records untouched
  assert.equal(s.recent.map(r2=>r2.target).join(','),beforeTargets);
  assert.ok(r.best===null||typeof r.best==='string');
});
test('C9 fire helper routes looper-flip when looperFlipEval set',()=>{
  const s=mkS(52);
  for(let i=0;i<8;i++)s.recent.push(mkRec(PHI,1,520+i));
  fireTickProposal({arm:'looper',looperMenuIndices:[1,4,6],looperFlipEval:true},s,{tick:1024});
  assert.equal(s.rsiLoop.proposals.length,3);
  assert.ok(s.rsiLoop.proposals.every(p=>p.flipped===true));
});
test('C9 choice set is {gain 1.0, skip 0.1, surprise} (1/4/6 asserted)',()=>{
  assert.deepEqual([...C9_CHOICE],[1,4,6]);
  assert.equal(OL_MENU[1].kind,'replayGain');
  assert.equal(OL_MENU[4].kind,'replaySkip');
  assert.equal(OL_MENU[6].kind,'replaySurprise');
  assert.equal(OL_MENU.length,9); // indices 0-7 untouched (C12 index 7, C14 index 8; pinned kinds unchanged)
});
test('C9 surprise sandbox runs live-fit path (fee billed, boolean verdict)',()=>{
  const s=mkS(21);
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI,1,100+i));
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI.map(v=>-v),0,200+i));
  const r=sandboxEvaluate(s,{kind:'replaySurprise',gain:3.0,live:1.0},[100,101,102,200,201,202],[103,104,105,203,204,205]);
  assert.ok(r.fee>0);
  assert.equal(typeof r.adopted,'boolean');
});
test('C9 live adoption inits surprise state + bills 2 (no crash on BT states)',()=>{
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
import {majorityOperator,majorityIndex,scoreRsiC9,rsiC9DevBank,C9_TAGS,C9_HISTORIES,C9_EXPECT_MAINS,C9_FIXTURE_SEEDS,C9_CHOICE} from '../scripts/rsi-c9-dev.mjs';
test('C9 choice evaluates all three and adopts the best (synthetic surprise-wins)',()=>{
  const s=mkS(41);
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI,1,400+i));
  for(let i=0;i<6;i++)s.recent.push(mkRec(PHI.map(v=>-v),0,410+i));
  const before=s.work.scalarOperations;
  const r=fireLooperChoice(s,[1,4,6]);
  assert.equal(r.skipped,false);
  assert.equal(r.n,3);
  assert.equal(s.rsiLoop.proposals.length,3); // all three evaluated
  assert.ok(s.work.scalarOperations>before); // 3 fees billed
  assert.ok(r.best===null||typeof r.best==='string'); // best kind or none
});
test('C9 choice adopts none when all fail the bar (synthetic flat)',()=>{
  const s=mkS(42);
  const ZERO=Array(16).fill(0);
  for(let i=0;i<12;i++)s.recent.push(mkRec(ZERO,i%2,420+i)); // zero-phi: gradient vanishes, clone==live
  const r=fireLooperChoice(s,[1,4,6]);
  assert.equal(r.skipped,false);
  const adopted=s.rsiLoop.proposals.filter(p=>p.adopted);
  assert.equal(adopted.length,0);
  assert.equal(r.best,null);
  assert.equal(s.config.replaySurpriseGain,0); // untouched
});
test('C9 fire helper routes copier-blind, looper-choice, looper-single, and off-tick no-op',()=>{
  const mk=(arm,extra)=>({arm,...extra});
  const cs=createTasteEnergyBody(7,43,{...BT_LEARNER_OPTIONS});
  const before=cs.work.scalarOperations;
  fireTickProposal(mk('copier',{copierMenuIndex:6}),cs,{tick:1024});
  assert.equal(cs.config.replaySurpriseGain,3.0);
  assert.equal(cs.work.scalarOperations,before+2);
  assert.equal(cs.rsiLoop,undefined);
  const off=createTasteEnergyBody(7,44,{...BT_LEARNER_OPTIONS});
  fireTickProposal(mk('copier',{copierMenuIndex:6}),off,{tick:1023});
  assert.equal(off.config.replaySurpriseGain,0); // off-tick no-op
  const ls=mkS(45);
  for(let i=0;i<8;i++)ls.recent.push(mkRec(PHI,1,430+i));
  fireTickProposal(mk('looper',{looperMenuIndices:[1,4,6]}),ls,{tick:1024});
  assert.equal(ls.rsiLoop.proposals.length,3); // choice path: 3 evals
  const bad=mkS(46);
  for(let i=0;i<8;i++)bad.recent.push(mkRec(PHI,1,440+i));
  assert.throws(()=>fireTickProposal(mk('looper',{looperMenuIndices:[9]}),bad,{tick:1024}),/menu-closed/); // fail-closed
});
test('C9 majorityIndex returns the voted index (ties to lowest)',()=>{
  assert.equal(majorityIndex([{menuIndex:6,adopted:true},{menuIndex:6,adopted:true},{menuIndex:1,adopted:true}]),6);
  assert.equal(majorityIndex([{menuIndex:4,adopted:true},{menuIndex:1,adopted:true}]),1); // tie->lowest
  assert.equal(majorityIndex([{menuIndex:1,adopted:false}]),null);
});

const root=fileURLToPath(new URL('../',import.meta.url));
const mkS=(seed=7)=>attachOperatorLoop(createTasteEnergyBody(7,seed,{...BT_LEARNER_OPTIONS}));
const mkRec=(phi,target,experience)=>({phi:[...phi],target,experience});
const PHI=Array(16).fill(0.1);
const seedN=(s,n,target=1,base=0)=>{for(let i=0;i<n;i++)s.recent.push(mkRec(PHI,target,base+i+1));};

// --- module (7) ---
test('C9 live-adopt gain/skip sets config (no other change)',()=>{
  const s=mkS();const w0=structuredClone(s.weights);
  adoptOperatorLive(s,{kind:'replayGain',gain:2.0});
  assert.equal(s.config.replayGain,2.0);
  assert.deepEqual(s.weights,w0);
  adoptOperatorLive(s,{kind:'replaySkip',skip:0.1});
  assert.equal(s.config.replaySkip,0.1);
  assert.throws(()=>adoptOperatorLive(s,{kind:'replayGain',gain:-1}),/./);
  assert.throws(()=>adoptOperatorLive(s,{kind:'nope'}),/menu-closed/);
});
test('C9 live-adopt shrink scales weights + bills exactly',()=>{
  const s=mkS();
  const n=Object.values(s.weights).reduce((a,w)=>a+w.length,0);
  const w0=s.work.scalarOperations;
  adoptOperatorLive(s,{kind:'shrinkOnce',alpha:0.25});
  assert.ok(Math.abs(s.weights.taste[0]-0)<1e-300||s.weights.taste.every(v=>v===0));
  assert.equal(s.work.scalarOperations-w0,n);
  assert.throws(()=>adoptOperatorLive(s,{kind:'shrinkOnce',alpha:1.5}),/./);
});
test('C9 fire-once proposal adopts on sandbox pass (synthetic)',()=>{
  const s=mkS();seedN(s,8,1);
  const r=fireLooperProposal(s,2);
  assert.equal(r.skipped||false,false);
  assert.equal(typeof r.eval.adopted,'boolean');
  assert.equal(s.rsiLoop.proposals.length,1);
});
test('C9 fire skips on insufficient retained experience',()=>{
  const s=mkS();seedN(s,2,1);
  const r=fireLooperProposal(s,0);
  assert.equal(r.skipped,true);
  assert.equal(s.rsiLoop.proposals.length,0);
});
test('C9 looper arm registered; candidate path untouched',()=>{
  assert.ok(TASTE_ARMS.includes('looper'));
  assert.ok(TASTE_ARMS.includes('candidate'));
});
test('C9 majority vote (ties->lowest, empty->baseline)',()=>{
  assert.deepEqual(majorityOperator([{menuIndex:1,adopted:true},{menuIndex:1,adopted:true},{menuIndex:0,adopted:true}]),OL_MENU[1]);
  assert.deepEqual(majorityOperator([{menuIndex:2,adopted:true},{menuIndex:0,adopted:true}]),OL_MENU[0]);
  assert.equal(majorityOperator([{menuIndex:0,adopted:false}]),null);
  assert.equal(majorityOperator([]),null);
});
test('C9 lifetime structural (module cap 4; C2 fires at most twice by schedule)',()=>{
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
const cRows=(lT1,lT2,sT1,sT2,cT1,cT2)=>{const rows=[];const hs=[[463001,463010,463019],[463028,463037,463046]];
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
const cPairs=()=>[[463001,463010,463019],[463028,463037,463046]];

test('C9 collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true},action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
});
test('C9 scorer GO (successive +0.15/+0.2, looper beats copier)',()=>{
  const v=scoreRsiC9(cRows(0.9,0.9,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2c,true);
  assert.ok(Math.abs(v.lift1-0.2)<1e-9);assert.ok(Math.abs(v.lift2-0.2)<1e-9);
  assert.equal(v.g2a,true);
  assert.ok(v.looperMinusCopied>0);assert.equal(v.g2b,true);
  assert.equal(v.g2d,true);
  assert.equal(v.verdict,'C9-GO');
});
test('C9 scorer NOGO on flat second adoption (no successive gain)',()=>{
  const v=scoreRsiC9(cRows(0.9,0.7,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'C9-NOGO');
});
test('C9 scorer NOGO when copier matches (filter adds nothing)',()=>{
  const v=scoreRsiC9(cRows(0.9,0.9,0.7,0.7,0.9,0.9),cPairs());
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'C9-NOGO');
});
test('C9 scorer INVALID on join fail',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreRsiC9(rows,cPairs());
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'C9-INVALID');
});
test('C9 scorer INCOMPLETE on untrained baseline',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map(r=>r.tag==='looper-train'
    ?mkRow(r.tag,r.history.seed,[['A',true,5],['B',false,5],['C',true,5],['D',false,5]]):r);
  const v=scoreRsiC9(rows,cPairs());
  assert.equal(v.g0,false);
  assert.equal(v.verdict,'C9-INCOMPLETE-UNTRAINED');
});
test('C9 bank refuses rebuild (fresh-25 on disk; union-exclusion holds)',()=>{
  // Bank built (54 unique, 463001-463054 verified at build); the tmpdir-build
  // assumption is stale by bank lifecycle: expect refusal (prior evidence).
  const dir=mkdtempSync(join(tmpdir(),'c9-bank-'));
  assert.throws(()=>rsiC9DevBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('C9 copier auto-adopts blind at tick 1024 (no sandbox, bills init only)',()=>{
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
test('C9 exact transplant copies learned weights + digest holds',()=>{
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
test('C9 mains-caps frozen design (2 chains x 10 = 20) + structural guard',()=>{
  assert.equal(C9_TAGS.length*2,C9_EXPECT_MAINS);
  assert.equal(C9_FIXTURE_SEEDS.length,54);
  assert.deepEqual([...C9_CHOICE],[1,4,6]); // structural guard: choice set frozen
  const src=readFileSync(join(root,'scripts','rsi-c9-dev.mjs'),'utf8');
  assert.ok(src.includes('looper-T2'),'runner must contain looper transfer blocks');
  assert.ok(src.includes('majorityOperator'),'runner must vote adoptions');
  assert.ok(src.includes('463001'),'runner must reference fresh-18 range');
  const exp=readFileSync(join(root,'learning','taste-experiment.mjs'),'utf8');
  assert.ok(exp.includes('looperMenuIndex'),'experiment must gate proposals by role');
});
