// THREAT-SIM fixtures (13 green required before bank build; zero bank worlds).
// Synthetic states/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTasteEnergyBody} from '../learning/taste-energy.mjs';
import {beginStationaryTasteAction,finishStationaryTasteAction,createStationaryTasteCredit} from '../learning/stationary-taste-credit.mjs';
import {collectTurnChoice} from '../scripts/turn-gated-dev.mjs';
import {scoreThreatSim,threatSimDevBank,TS_TAGS,TS_PAIRS,TS_EXPECT_MAINS,TS_FIXTURE_SEEDS,TS_THREAT_GAIN} from '../scripts/threat-sim-dev.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));

// --- module (5): gate validation, null-identity, counter, sources-guard, outcomeSign plumbing ---
test('threat gate validates (gain 1.0 accepted; negative/NaN rejected)',()=>{
  const ok=createTasteEnergyBody(1,42,{replayThreatGain:1.0});
  assert.equal(ok.config.replayThreatGain,1.0);
  for(const bad of [-1,NaN,'x'])assert.throws(()=>createTasteEnergyBody(1,42,{replayThreatGain:bad}),/./);
});
test('threat gate null-identity (default 0; explicit 0 identical to unset)',()=>{
  const a=createTasteEnergyBody(1,42);
  const b=createTasteEnergyBody(1,42,{replayThreatGain:0});
  assert.equal(a.config.replayThreatGain,0);
  assert.deepEqual(b.config,a.config);
});
test('threat work counter starts at zero (DAMAGE-GATE pattern)',()=>{
  const s=createTasteEnergyBody(1,42,{replayThreatGain:1.0});
  assert.equal(s.work.replayThreatBoosts,0);
});
test('threat gate sources-guard (structural: gate blocks present)',()=>{
  const src=readFileSync(join(root,'learning','taste-energy.mjs'),'utf8');
  assert.ok(src.includes('replayThreatGain'),'taste-energy must contain threat gate');
  assert.ok(src.includes('record.outcomeSign===-1'),'threat gate must key on harmful intake');
});
test('threat gate input plumbing (records carry outcomeSign ±1)',()=>{
  const credit=createStationaryTasteCredit(9,{maskedCue:false});
  beginStationaryTasteAction(credit,{agentId:9,tick:1,action:2,cue:[1,1,-1,-1],contactPresent:true});
  const pos=finishStationaryTasteAction(credit,{agentId:9,tick:1,lastFood:0.4,terminal:false});
  assert.equal(pos.outcomeSign,1);
  beginStationaryTasteAction(credit,{agentId:9,tick:2,action:2,cue:[1,1,-1,-1],contactPresent:true});
  const neg=finishStationaryTasteAction(credit,{agentId:9,tick:2,lastFood:-0.4,terminal:false});
  assert.equal(neg.outcomeSign,-1);
});

// --- instrument (8) ---
const mkRow=(tag,seed,specs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
const tBase=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const tUnlearn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const teBase=s=>[['A',true,9],['B',true,7],['C',false,1],['D',false,1]];
const teThreat=(bhTurn,hbTurn)=>s=>[['A',true,9],['B',true,bhTurn],['C',false,hbTurn],['D',false,1]];
const tRows=(bhTurn=9,hbTurn=1)=>{const rows=[];for(let h=0;h<3;h++){const s=454001+h;
  rows.push(mkRow('train',s,tBase(s)));
  rows.push(mkRow('threat-train',s,tBase(s)));
  rows.push(mkRow('transferred',s,teBase(s)));
  rows.push(mkRow('threat-transferred',s,teThreat(bhTurn,hbTurn)(s)));
  rows.push(mkRow('unlearned',s,tUnlearn(s)));}return rows;};
const tPairs=()=>[0,1,2].map(h=>[454001+h,454001+h]);

test('threat-sim collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true},action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
  assert.equal(s.cues['1,1,-1,-1'].label,'harmful');
});
test('threat-sim scorer GO (BH +0.2, HB parity)',()=>{
  const v=scoreThreatSim(tRows(),tPairs());
  assert.equal(v.g1,true);assert.equal(v.g0,true);assert.equal(v.g2c,true);
  assert.ok(Math.abs(v.baseBH-0.7)<1e-9);assert.ok(Math.abs(v.threatBH-0.9)<1e-9);
  assert.equal(v.g2a,true);
  assert.ok(Math.abs(v.hbDelta)<1e-9);assert.equal(v.g2b,true);
  assert.equal(v.g2d,true);
  assert.equal(v.verdict,'TS-GO');
});
test('threat-sim scorer NOGO on tradeoff (BH lifts, HB drops)',()=>{
  const v=scoreThreatSim(tRows(9,5),tPairs());
  assert.equal(v.g2a,true);
  assert.ok(v.hbDelta<-0.1);
  assert.equal(v.g2b,false);
  assert.equal(v.verdict,'TS-NOGO');
});
test('threat-sim scorer NOGO on flat BH (no lift)',()=>{
  const v=scoreThreatSim(tRows(7,1),tPairs());
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'TS-NOGO');
});
test('threat-sim scorer INVALID on join fail',()=>{
  const rows=tRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const v=scoreThreatSim(rows,tPairs());
  assert.equal(v.g1,false);
  assert.equal(v.verdict,'TS-INVALID');
});
test('threat-sim scorer INCOMPLETE on untrained baseline',()=>{
  const rows=tRows().map(r=>r.tag==='train'
    ?mkRow(r.tag,r.history.seed,[['A',true,5],['B',false,5],['C',true,5],['D',false,5]]):r);
  const v=scoreThreatSim(rows,tPairs());
  assert.equal(v.g0,false);
  assert.equal(v.verdict,'TS-INCOMPLETE-UNTRAINED');
});
test('threat-sim bank refuses rebuild post-spend (454xxx in prior evidence)',()=>{
  // TS-NOGO committed the bank; the tmpdir-build assumption is stale by bank
  // lifecycle (V1k/V1l/V1m/V1n/T1/K1 precedent): expect refusal.
  const dir=mkdtempSync(join(tmpdir(),'ts-bank-'));
  assert.throws(()=>threatSimDevBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('threat-sim mains-caps frozen design (3 pairs x 5 runs = 15)',()=>{
  assert.equal(TS_TAGS.length*TS_PAIRS.length,TS_EXPECT_MAINS);
  assert.equal(TS_FIXTURE_SEEDS.length,54);
  assert.equal(TS_THREAT_GAIN,1.0);
  const src=readFileSync(join(root,'scripts','threat-sim-dev.mjs'),'utf8');
  assert.ok(src.includes('threat-transferred'),'runner must contain threat transfer block');
  assert.ok(src.includes('454001'),'runner must reference fresh-16 range');
});
