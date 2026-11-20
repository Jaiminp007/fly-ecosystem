// RSI-SELF fixtures (G5 gate). Zero bank worlds: synthetic states/records,
// temp-dir bank, fixture-world stepping only. Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {proposeDirection,selfPropose,scoreRsiSelf,rsiSelfDevBank,
  S_FIXTURE_SEEDS,S_CHECKPOINTS,S_ADOPT_FRAC} from '../scripts/rsi-self-dev.mjs';

const D=3;
const mkRecs=(n,phi,target)=>Array.from({length:n},()=>({phi:[...phi],target,slot:0}));
const mkState=(rate,recs,prev)=>({
  config:{selfMod:true,tasteDimensions:D,tasteRate:rate,streams:1,phaseSlots:1,
    surpriseGain:0.5,surpriseWindow:16,marginWidth:0,marginBoost:0,replayRate:1,
    consolidationRate:0,slowAnchorStrength:0},
  weights:{taste:[0,0,0]},
  older:[],recent:recs,
  work:{scalarOperations:0,surpriseBoosts:0,tasteLiveUpdates:0,liveUpdates:0,replayUpdates:0},
  priorLogit:0,surpriseEma:0.5,surpriseTimer:0,
  selfMod:{prevTestErr:prev,proposals:[]},
});

test('proposal direction: rise doubles, fall halves, bounds clip, first defaults half',()=>{
  assert.equal(proposeDirection(2,1,1),2);
  assert.equal(proposeDirection(0.5,1,1),0.5);
  assert.equal(proposeDirection(1,1,1),0.5);
  assert.equal(proposeDirection(9,null,1),0.5);
  assert.equal(proposeDirection(9,1,1.5),2.0);
  assert.equal(proposeDirection(0,1,0.06),0.05);
  assert.equal(proposeDirection(0,1,0.04),0.05);
});

test('sandbox: win adopts, loss keeps, zero-phi ties keep, thin store skips',()=>{
  const a=mkState(1,mkRecs(20,[1,0,0],1),0);
  const ra=selfPropose(a,512);
  assert.equal(ra.decision,'adopt');
  assert.equal(ra.propRate,2);
  assert.equal(a.config.tasteRate,2);
  assert.ok(ra.errCand<ra.errInc*S_ADOPT_FRAC);
  const k=mkState(1,mkRecs(20,[1,0,0],1),10);
  const rk=selfPropose(k,512);
  assert.equal(rk.decision,'keep');
  assert.equal(rk.propRate,0.5);
  assert.equal(k.config.tasteRate,1);
  const t=mkState(1,mkRecs(20,[0,0,0],1),10);
  const rt=selfPropose(t,512);
  assert.equal(rt.decision,'keep');
  assert.equal(rt.errCand,rt.errInc);
  const s=mkState(1,mkRecs(5,[1,0,0],1),null);
  const rs=selfPropose(s,512);
  assert.equal(rs.decision,'skip');
  assert.equal(rs.propRate,null);
  assert.equal(s.config.tasteRate,1);
});

test('billing: live meter delta is exactly the flat fee',()=>{
  const recs=mkRecs(20,[1,0,0],1);
  const st=mkState(1,recs,10);
  const before=st.work.scalarOperations;
  const r=selfPropose(st,512);
  const after=st.work.scalarOperations;
  assert.equal(after-before,2*(r.fitN+r.testN)*(D+1));
  assert.equal(r.fitN,12);
  assert.equal(r.testN,8);
});

test('spent bank 396001-396036 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-spend maintenance (V1b): the V1a bank built cleanly pre-spend
  // (commit 38c7b0f) and is now spent; the builder must refuse to rebuild
  // it anywhere. This guards the never-duplicate-runs rule mechanically.
  const dir=mkdtempSync(join(tmpdir(),'rsi-self-bank-guard-'));
  assert.throws(()=>rsiSelfDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});

test('hook bit-identity: null-hook stepping equals plain advance on fixture world',()=>{
  const history={seed:399001,cueSeed:399002,resourceSeeds:[399003,399004,399005,399006]};
  const mk=()=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
  const a=mk();a.advance(600);const ea=a.endpoint();
  const b=mk();
  for(let t=0;t<600&&!b.finished;t++){
    if(S_CHECKPOINTS.includes(b.world.tick))
      for(const fly of b.world.flies)assert.equal(b.learners[fly.id].config.selfMod,false);
    if(!b.step())break;
  }
  const eb=b.endpoint();
  assert.equal(eb.budgetAdjustedEnergyPerFounder,ea.budgetAdjustedEnergyPerFounder);
  assert.equal(eb.scalarOperations,ea.scalarOperations);
  for(const id of a.founderIds)assert.deepEqual(b.learners[id].weights.taste,a.learners[id].weights.taste);
});

const mkRow=(arm,seed,levels,decisions)=>({history:{seed},arm,
  proposals:[512,1024,1536].flatMap((tick,i)=>decisions[i].map(decision=>({tick,incRate:1,propRate:decision==='skip'?null:2,
    fitN:decision==='skip'?0:12,testN:decision==='skip'?0:8,
    errInc:decision==='skip'?null:1,errCand:decision==='skip'?null:(decision==='adopt'?0.9:1),decision}))),
  endpoint:{budgetAdjustedEnergyPerFounder:levels}});

test('scorer: GO/NOGO/INVALID/INCOMPLETE branches',()=>{
  const seeds=[396001,396010,396019,396028];
  const goRows=[...seeds.map(s=>mkRow('selfmod',s,1.0,[['adopt'],['keep'],['keep']])),...seeds.map(s=>mkRow('fixed',s,1.0,[[],[],[]]))];
  const go=scoreRsiSelf(goRows);
  assert.equal(go.go,true);
  assert.equal(go.verdict,'PHASE-A-GO');
  assert.equal(go.adoptCp,4);
  const nogoRows=goRows.map(r=>r.arm==='selfmod'?{...r,endpoint:{budgetAdjustedEnergyPerFounder:0.7}}:r);
  const nogo=scoreRsiSelf(nogoRows);
  assert.equal(nogo.go,false);
  assert.equal(nogo.verdict,'PHASE-A-NOGO');
  const badRows=goRows.map(r=>r.arm==='selfmod'&&r.history.seed===396001
    ?{...r,proposals:r.proposals.map(q=>({...q,decision:'adopt'}))}:r);
  const bad=scoreRsiSelf(badRows);
  assert.equal(bad.go,false);
  assert.equal(bad.verdict,'INVALID');
  const flatRows=[...seeds.map(s=>mkRow('selfmod',s,1.0,[['keep'],['keep'],['keep']])),...seeds.map(s=>mkRow('fixed',s,1.0,[[],[],[]]))];
  const flat=scoreRsiSelf(flatRows);
  assert.equal(flat.go,false);
  assert.equal(flat.verdict,'INCOMPLETE');
});
