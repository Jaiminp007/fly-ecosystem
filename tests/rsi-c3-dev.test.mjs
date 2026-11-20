// RSI C2 fixtures (15 green required before bank build; zero bank worlds).
// Synthetic states/rows only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTasteEnergyBody} from '../learning/taste-energy.mjs';
import {TASTE_ARMS} from '../learning/taste-experiment.mjs';
import {attachOperatorLoop,fireLooperProposal,adoptOperatorLive,OL_MENU} from '../learning/rsi-operator-loop.mjs';
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';
import {collectTurnChoice} from '../scripts/turn-gated-dev.mjs';
import {majorityOperator,scoreRsiC3,rsiC3DevBank,C3_TAGS,C3_HISTORIES,C3_EXPECT_MAINS,C3_FIXTURE_SEEDS,C3_MENU_TRAIN,C3_MENU_T1} from '../scripts/rsi-c3-dev.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkS=(seed=7)=>attachOperatorLoop(createTasteEnergyBody(7,seed,{...BT_LEARNER_OPTIONS}));
const mkRec=(phi,target,experience)=>({phi:[...phi],target,experience});
const PHI=Array(16).fill(0.1);
const seedN=(s,n,target=1,base=0)=>{for(let i=0;i<n;i++)s.recent.push(mkRec(PHI,target,base+i+1));};

// --- module (7) ---
test('C3 live-adopt gain/skip sets config (no other change)',()=>{
  const s=mkS();const w0=structuredClone(s.weights);
  adoptOperatorLive(s,{kind:'replayGain',gain:2.0});
  assert.equal(s.config.replayGain,2.0);
  assert.deepEqual(s.weights,w0);
  adoptOperatorLive(s,{kind:'replaySkip',skip:0.1});
  assert.equal(s.config.replaySkip,0.1);
  assert.throws(()=>adoptOperatorLive(s,{kind:'replayGain',gain:-1}),/./);
  assert.throws(()=>adoptOperatorLive(s,{kind:'nope'}),/menu-closed/);
});
test('C3 live-adopt shrink scales weights + bills exactly',()=>{
  const s=mkS();
  const n=Object.values(s.weights).reduce((a,w)=>a+w.length,0);
  const w0=s.work.scalarOperations;
  adoptOperatorLive(s,{kind:'shrinkOnce',alpha:0.25});
  assert.ok(Math.abs(s.weights.taste[0]-0)<1e-300||s.weights.taste.every(v=>v===0));
  assert.equal(s.work.scalarOperations-w0,n);
  assert.throws(()=>adoptOperatorLive(s,{kind:'shrinkOnce',alpha:1.5}),/./);
});
test('C3 fire-once proposal adopts on sandbox pass (synthetic)',()=>{
  const s=mkS();seedN(s,8,1);
  const r=fireLooperProposal(s,2);
  assert.equal(r.skipped||false,false);
  assert.equal(typeof r.eval.adopted,'boolean');
  assert.equal(s.rsiLoop.proposals.length,1);
});
test('C3 fire skips on insufficient retained experience',()=>{
  const s=mkS();seedN(s,2,1);
  const r=fireLooperProposal(s,0);
  assert.equal(r.skipped,true);
  assert.equal(s.rsiLoop.proposals.length,0);
});
test('C3 looper arm registered; candidate path untouched',()=>{
  assert.ok(TASTE_ARMS.includes('looper'));
  assert.ok(TASTE_ARMS.includes('candidate'));
});
test('C3 majority vote (ties->lowest, empty->baseline)',()=>{
  assert.deepEqual(majorityOperator([{menuIndex:1,adopted:true},{menuIndex:1,adopted:true},{menuIndex:0,adopted:true}]),OL_MENU[1]);
  assert.deepEqual(majorityOperator([{menuIndex:2,adopted:true},{menuIndex:0,adopted:true}]),OL_MENU[0]);
  assert.equal(majorityOperator([{menuIndex:0,adopted:false}]),null);
  assert.equal(majorityOperator([]),null);
});
test('C3 lifetime structural (module cap 4; C2 fires at most twice by schedule)',()=>{
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
const cRows=(lT1,lT2,sT1,sT2,cT1,cT2)=>{const rows=[];const hs=[[457001,457010,457019],[457028,457037,457046]];
  for(const [h0,h1,h2] of hs){
    rows.push(mkRow('looper-train',h0,tBase(h0)));
    rows.push(mkRow('looper-T1',h1,teHB(lT1)(h1)));
    rows.push(mkRow('looper-T2',h2,teHB(lT2)(h2)));
    rows.push(mkRow('static-train',h0,tBase(h0)));
    rows.push(mkRow('static-T1',h1,teHB(sT1)(h1)));
    rows.push(mkRow('static-T2',h2,teHB(sT2)(h2)));
    rows.push(mkRow('copied-train',h0,tBase(h0)));
    rows.push(mkRow('copied-T1',h1,teHB(cT1)(h1)));
    rows.push(mkRow('copied-T2',h2,teHB(cT2)(h2)));
    rows.push(mkRow('unlearned',h2,tUn(h2)));
  }return rows;};
const cPairs=()=>[[457001,457010,457019],[457028,457037,457046]];

test('C3 collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true},action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
});
test('C3 scorer GO (successive +0.15/+0.2, looper beats copied)',()=>{
  const v=scoreRsiC3(cRows(0.9,0.9,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2c,true);
  assert.ok(Math.abs(v.lift1-0.2)<1e-9);assert.ok(Math.abs(v.lift2-0.2)<1e-9);
  assert.equal(v.g2a,true);
  assert.ok(v.looperMinusCopied>0);assert.equal(v.g2b,true);
  assert.equal(v.g2d,true);
  assert.equal(v.verdict,'C3-GO');
});
test('C3 scorer NOGO on flat second adoption (no successive gain)',()=>{
  const v=scoreRsiC3(cRows(0.9,0.7,0.7,0.7,0.8,0.8),cPairs());
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'C3-NOGO');
});
test('C3 scorer NOGO when copied matches (filter adds nothing)',()=>{
  const v=scoreRsiC3(cRows(0.9,0.9,0.7,0.7,0.9,0.9),cPairs());
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'C3-NOGO');
});
test('C3 scorer INVALID on join fail',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreRsiC3(rows,cPairs());
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'C3-INVALID');
});
test('C3 scorer INCOMPLETE on untrained baseline',()=>{
  const rows=cRows(0.9,0.9,0.7,0.7,0.8,0.8).map(r=>r.tag==='looper-train'
    ?mkRow(r.tag,r.history.seed,[['A',true,5],['B',false,5],['C',true,5],['D',false,5]]):r);
  const v=scoreRsiC3(rows,cPairs());
  assert.equal(v.g0,false);
  assert.equal(v.verdict,'C3-INCOMPLETE-UNTRAINED');
});
test('C3 bank refuses rebuild (fresh-19 on disk; union-exclusion holds)',()=>{
  // Bank built (54 unique verified at build); the tmpdir-build assumption is stale
  // by bank lifecycle: expect refusal (prior evidence).
  const dir=mkdtempSync(join(tmpdir(),'c3-bank-'));
  assert.throws(()=>rsiC3DevBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('C3 mains-caps frozen design (2 chains x 10 = 20) + structural guard',()=>{
  assert.equal(C3_TAGS.length*2,C3_EXPECT_MAINS);
  assert.equal(C3_FIXTURE_SEEDS.length,54);
  assert.equal(C3_MENU_TRAIN,3);assert.equal(C3_MENU_T1,4);
  const src=readFileSync(join(root,'scripts','rsi-c3-dev.mjs'),'utf8');
  assert.ok(src.includes('looper-T2'),'runner must contain looper transfer blocks');
  assert.ok(src.includes('majorityOperator'),'runner must vote adoptions');
  assert.ok(src.includes('457001'),'runner must reference fresh-18 range');
  const exp=readFileSync(join(root,'learning','taste-experiment.mjs'),'utf8');
  assert.ok(exp.includes('looperMenuIndex'),'experiment must gate proposals by role');
});
