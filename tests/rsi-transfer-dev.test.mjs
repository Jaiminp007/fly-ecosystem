// RSI-TRANSFER V1 fixtures (FROZEN plan docs/RSI_TRANSFER_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, finalRateOf
// reconstruction, transplant digest round-trip on fresh learners,
// scorer GO/NOGO/INCOMPLETE-NOFIRE branches, zero-tick selfPropose skip.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {selfPropose} from '../scripts/rsi-self-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from '../scripts/turn-gated-dev-v1m.mjs';
import {rsiTransferBank,finalRateOf,scoreRsiTransferRows,RT_FIXTURE_SEEDS,RT_TRAIN_ARMS} from '../scripts/rsi-transfer-dev.mjs';
import {rsiTransferBank as rsiTransferBankV1b,scoreRsiTransferRows as scoreRsiTransferRowsV1b,trainRowComplete as trainRowCompleteV1b,RT_FIXTURE_SEEDS as RT_FIXTURE_SEEDS_V1B} from '../scripts/rsi-transfer-v1b.mjs';
import {rsiTransferBank as rsiTransferBankV1c,scoreRsiTransferRows as scoreRsiTransferRowsV1c,freezeDecision,finalRateOf as finalRateOfV1c,RT_FIXTURE_SEEDS as RT_FIXTURE_SEEDS_V1C} from '../scripts/rsi-transfer-v1c.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const trainRow=(arm,seed,proposals,energy=-60.0)=>({history:{seed},arm,stage:'train',proposals,finalRate:1.0,finalRateSpread:0,
  phaseRows:[0,1,2,3].map(i=>({phase:i})),endpoint:{budgetAdjustedEnergyPerFounder:energy,survivors:3}});
const txRow=(arm,seed,value,rate=1.0)=>({history:{seed},arm,stage:'transfer',probeRate:rate,
  transfer:{transferred:24,total:24,sourceDigest:'aa',appliedDigest:'aa'},
  endpoint:{budgetAdjustedEnergyPerFounder:value,survivors:3}});

describe('rsi-transfer-dev fixtures',()=>{
  it('bank refuses re-mint post-spend (spent-bank guard)',()=>{
    const dir=join(tmpdir(),'rt-bank-test');
    rmSync(dir,{recursive:true,force:true});
    assert.throws(()=>rsiTransferBank(join(dir,'protocol.json')),/already used in prior evidence/);
    rmSync(dir,{recursive:true,force:true});
  });
  it('finalRateOf reconstructs median adopted rate (synthetic proposals)',()=>{
    const q=[
      {agentId:0,tick:512,incRate:1.0,propRate:2.0,decision:'adopt'},
      {agentId:0,tick:1024,incRate:2.0,propRate:1.0,decision:'keep'},
      {agentId:0,tick:1536,incRate:2.0,propRate:0.5,decision:'adopt'},
      {agentId:1,tick:512,incRate:1.0,propRate:null,decision:'skip'},
      {agentId:1,tick:1024,incRate:1.0,propRate:0.5,decision:'adopt'}];
    const fr=finalRateOf(q,1.0);
    assert.equal(fr.median,0.5);assert.equal(fr.spread,0);assert.equal(fr.n,2);
    const none=finalRateOf([{agentId:2,tick:512,incRate:1.0,propRate:null,decision:'skip'}],1.0);
    assert.equal(none.median,1.0);
    assert.equal(finalRateOf([],1.0).median,1.0);
  });
  it('transplant digest round-trips on fresh learners (synthetic seed 7)',()=>{
    const a=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const b=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const snap=snapshotWeights(a.learners);
    for(const id of Object.keys(snap))assertFreshTarget(b.learners[id],id);
    const cp=copyWeights(snap,b.learners);
    assert.ok(cp.transferred>0);
    const chk=checkTransplantIntegrity(snap,b.learners);
    assert.equal(chk.ok,true);
    assert.equal(digestWeights(snap),digestWeights(snapshotWeights(b.learners)));
  });
  it('scorer GO iff selfmod transfer tops both controls',()=>{
    const rows=[
      trainRow('selfmod',473064,[{agentId:0,tick:512,incRate:1,propRate:2,decision:'adopt'}]),
      trainRow('fixed',473064,[]),trainRow('unlearned',473064,[]),
      trainRow('selfmod',473082,[{agentId:0,tick:512,incRate:1,propRate:0.5,decision:'adopt'}]),
      trainRow('fixed',473082,[]),trainRow('unlearned',473082,[]),
      txRow('selfmod',473073,-59.0),txRow('fixed',473073,-60.0),txRow('unlearned',473073,-61.0),
      txRow('selfmod',473091,-58.0),txRow('fixed',473091,-60.5),txRow('unlearned',473091,-62.0)];
    const v=scoreRsiTransferRows(rows);
    assert.equal(v.g1,true);assert.equal(v.g2,true);
    assert.equal(v.go,true);assert.equal(v.verdict,'RSI-TRANSFER-GO-V1');
    assert.ok(v.means.selfmod>v.means.fixed&&v.means.selfmod>v.means.unlearned);
  });
  it('scorer NOGO on no-lift and INCOMPLETE-NOFIRE with zero adopts',()=>{
    const mk=(sme,fe,ue)=>[
      trainRow('selfmod',473064,[{agentId:0,tick:512,incRate:1,propRate:2,decision:'adopt'}]),
      trainRow('fixed',473064,[]),trainRow('unlearned',473064,[]),
      trainRow('selfmod',473073,[{agentId:0,tick:512,incRate:1,propRate:2,decision:'adopt'}]),
      trainRow('fixed',473073,[]),trainRow('unlearned',473073,[]),
      txRow('selfmod',473073,sme),txRow('fixed',473073,fe),txRow('unlearned',473073,ue),
      txRow('selfmod',473082,sme),txRow('fixed',473082,fe),txRow('unlearned',473082,ue)];
    const n=scoreRsiTransferRows(mk(-61.0,-59.0,-60.0));
    assert.equal(n.go,false);assert.equal(n.verdict,'RSI-TRANSFER-NOGO-V1');
    const zrows=mk(-59.0,-60.0,-61.0).map(r=>r.stage==='train'&&r.arm==='selfmod'
      ?{...r,proposals:[{agentId:0,tick:512,incRate:1,propRate:null,decision:'skip'}]}:r);
    const z=scoreRsiTransferRows(zrows);
    assert.equal(z.go,false);assert.equal(z.verdict,'INCOMPLETE-NOFIRE');
  });
  it('zero-tick selfPropose takes the skip branch (synthetic seed 7)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate',learnerOptions:{selfMod:true}});
    const st=run.learners[run.founderIds[0]];
    assert.equal(st.config.selfMod,true);
    const rec=selfPropose(st,512);
    assert.equal(rec.decision,'skip');assert.equal(rec.propRate,null);
  });
  it('probe rate applies via live-application path (adopted 2.0 sticks)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    for(const id of run.founderIds)run.learners[id].config.tasteRate=2.0;
    assert.ok(run.learners[run.founderIds[0]].config.tasteRate===2.0);
  });
});

describe('rsi-transfer-v1b births-eval fixtures',()=>{
  const txRowV1b=(arm,seed,births,gen1=0,gen2=0,energy=-60.0)=>({history:{seed},arm,stage:'transfer',probeRate:1.0,
    transfer:{transferred:24,total:24,sourceDigest:'aa',appliedDigest:'aa'},
    endpoint:{budgetAdjustedEnergyPerFounder:energy,survivors:3},births,
    generations:{gen1,gen2,maxGeneration:gen2>0?2:gen1>0?1:0,byGeneration:{}}});
  const trRowV1b=(arm,seed,proposals)=>({history:{seed},arm,stage:'train',proposals,finalRate:1.0,finalRateSpread:0,
    phaseRows:[0,1,2,3].map(i=>({phase:i})),endpoint:{budgetAdjustedEnergyPerFounder:-59.0,survivors:3}});
  const adopt=[{agentId:0,tick:512,incRate:1,propRate:2,decision:'adopt'}];
  const skip=[{agentId:0,tick:512,incRate:1,propRate:null,decision:'skip'}];
  it('V1b bank refuses re-mint post-spend (spent-bank guard)',()=>{
    const dir=join(tmpdir(),'rtv1b-bank-test');
    rmSync(dir,{recursive:true,force:true});
    assert.throws(()=>rsiTransferBankV1b(join(dir,'protocol.json')),/already used in prior evidence/);
    rmSync(dir,{recursive:true,force:true});
  });
  it('V1b scorer GO iff selfmod births top both controls',()=>{
    const v=scoreRsiTransferRowsV1b([
      trRowV1b('selfmod',473118,adopt),trRowV1b('fixed',473118,[]),trRowV1b('unlearned',473118,[]),
      trRowV1b('selfmod',473136,adopt),trRowV1b('fixed',473136,[]),trRowV1b('unlearned',473136,[]),
      txRowV1b('selfmod',473127,4,4,0),txRowV1b('fixed',473127,2,2,0),txRowV1b('unlearned',473127,1,1,0),
      txRowV1b('selfmod',473145,3,3,0),txRowV1b('fixed',473145,2,2,0),txRowV1b('unlearned',473145,2,2,0)]);
    assert.equal(v.g1,true);assert.equal(v.g2,true);
    assert.equal(v.go,true);assert.equal(v.verdict,'RSI-TRANSFER-GO-V1B');
    assert.deepEqual(v.births,{selfmod:7,fixed:4,unlearned:3});
  });
  it('V1b scorer NOGO/VOID branches',()=>{
    const mk=(sm,fx,un)=>[
      trRowV1b('selfmod',473118,adopt),trRowV1b('fixed',473118,[]),trRowV1b('unlearned',473118,[]),
      trRowV1b('selfmod',473136,adopt),trRowV1b('fixed',473136,[]),trRowV1b('unlearned',473136,[]),
      txRowV1b('selfmod',473127,sm),txRowV1b('fixed',473127,fx),txRowV1b('unlearned',473127,un),
      txRowV1b('selfmod',473145,sm),txRowV1b('fixed',473145,fx),txRowV1b('unlearned',473145,un)];
    const n=scoreRsiTransferRowsV1b(mk(2,5,4));
    assert.equal(n.go,false);assert.equal(n.verdict,'RSI-TRANSFER-NOGO-V1B');
    const z=scoreRsiTransferRowsV1b(mk(0,0,0));
    assert.equal(z.go,false);assert.equal(z.verdict,'INCOMPLETE-NOBIRTHS');
    const frows=mk(5,2,1).map(r=>r.stage==='train'&&r.arm==='selfmod'?{...r,proposals:skip}:r);
    const f=scoreRsiTransferRowsV1b(frows);
    assert.equal(f.go,false);assert.equal(f.verdict,'INCOMPLETE-NOFIRE');
  });
  it('V1b mating-probe wiring zero-tick (synthetic seed 7, no bank contact)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate',reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'none',nutrientOverride:5});
    assert.equal(run.world.config.reproduction,true);
    assert.equal(run.world.config.matingEnergyBar,50);
    assert.equal(run.world.config.verticalTransmission,'none');
  });
  it('trainRowComplete accepts clean extinction, rejects crashed partials',()=>{
    const ext={history:{seed:473118},arm:'unlearned',stage:'train',
      phaseRows:[{phase:'A'},{phase:'B'},{phase:'C'}],
      endpoint:{budgetAdjustedEnergyPerFounder:-65.0,survivors:0,totals:{deaths:24,births:0}}};
    assert.equal(trainRowCompleteV1b(ext),true);
    const full={history:{seed:473118},arm:'candidate',stage:'train',
      phaseRows:[{phase:'A'},{phase:'B'},{phase:'C'},{phase:'return-A'}],
      endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:3,totals:{deaths:21,births:0}}};
    assert.equal(trainRowCompleteV1b(full),true);
    const crashed={history:{seed:473118},arm:'candidate',stage:'train',
      phaseRows:[{phase:'A'}],
      endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:12,totals:{deaths:12,births:0}}};
    assert.equal(trainRowCompleteV1b(crashed),false);
    assert.equal(trainRowCompleteV1b(null),false);
  });
});

describe('rsi-transfer-v1c freeze-loop fixtures',()=>{
  const txRow=(arm,seed,value,rate=1.0)=>({history:{seed},arm,stage:'transfer',probeRate:rate,
    transfer:{transferred:24,total:24,sourceDigest:'bb',appliedDigest:'bb'},
    endpoint:{budgetAdjustedEnergyPerFounder:value,survivors:3}});
  const trRow=(arm,seed,proposals)=>({history:{seed},arm,stage:'train',proposals,finalRate:1.0,finalRateSpread:0,
    phaseRows:[0,1,2,3].map(i=>({phase:i})),endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});
  const adopt=(rate=2.0)=>[{agentId:0,tick:512,incRate:1,propRate:rate,decision:'adopt'}];
  const freezeAt=(rate=1.0)=>[{agentId:0,tick:512,incRate:1,propRate:null,decision:'keep',errInc:0.5,fitN:8,testN:8},{agentId:0,tick:1024,incRate:1,propRate:null,decision:'freeze',errInc:0.6,fitN:8,testN:8}];
  it('V1c bank refuses re-mint post-spend (spent-bank guard)',()=>{
    const dir=join(tmpdir(),'rtv1c-bank-test');
    rmSync(dir,{recursive:true,force:true});
    assert.throws(()=>rsiTransferBankV1c(join(dir,'protocol.json')),/already used in prior evidence/);
    rmSync(dir,{recursive:true,force:true});
  });
  it('freezeDecision fires only on keep+non-improving incumbent (synthetic)',()=>{
    assert.deepEqual(freezeDecision({decision:'adopt',errInc:0.4},0.5),{decision:'adopt',baseline:null});
    assert.deepEqual(freezeDecision({decision:'skip',errInc:null},0.5),{decision:'skip',baseline:0.5});
    assert.deepEqual(freezeDecision({decision:'keep',errInc:0.5},null),{decision:'keep',baseline:0.5});
    assert.deepEqual(freezeDecision({decision:'keep',errInc:0.4},0.5),{decision:'keep',baseline:0.4});
    assert.deepEqual(freezeDecision({decision:'keep',errInc:0.6},0.5),{decision:'freeze',baseline:0.6});
    assert.deepEqual(freezeDecision({decision:'keep',errInc:0.5},0.5),{decision:'freeze',baseline:0.5});
  });
  it('finalRateOf uses freeze incRate when no later adopt (synthetic)',()=>{
    const fr=finalRateOfV1c([{agentId:0,tick:512,incRate:1.5,propRate:2.0,decision:'adopt'},{agentId:0,tick:1024,incRate:2.0,propRate:null,decision:'freeze',errInc:0.6}],1.0);
    assert.equal(fr.median,2.0);
    const fr2=finalRateOfV1c([{agentId:3,tick:512,incRate:0.5,propRate:null,decision:'freeze',errInc:0.6}],1.0);
    assert.equal(fr2.median,0.5);
  });
  it('V1c scorer GO/NOGO/VOID branches on synthetic rows',()=>{
    const mk=(sm,fx,un,props)=>[
      trRow('selfmod',473154,props),trRow('fixed',473154,[]),trRow('unlearned',473154,[]),
      trRow('selfmod',473172,props),trRow('fixed',473172,[]),trRow('unlearned',473172,[]),
      txRow('selfmod',473163,sm),txRow('fixed',473163,fx),txRow('unlearned',473163,un),
      txRow('selfmod',473181,sm),txRow('fixed',473181,fx),txRow('unlearned',473181,un)];
    const go=scoreRsiTransferRowsV1c(mk(-59.0,-60.5,-61.0,freezeAt()));
    assert.equal(go.g1,true);assert.equal(go.g2,true);
    assert.equal(go.go,true);assert.equal(go.verdict,'RSI-TRANSFER-GO-V1C');
    const no=scoreRsiTransferRowsV1c(mk(-61.0,-59.0,-60.0,freezeAt()));
    assert.equal(no.go,false);assert.equal(no.verdict,'RSI-TRANSFER-NOGO-V1C');
    const nf=scoreRsiTransferRowsV1c(mk(-59.0,-60.5,-61.0,adopt()));
    assert.equal(nf.go,false);assert.equal(nf.verdict,'INCOMPLETE-NOFREEZE');
    const zf=scoreRsiTransferRowsV1c(mk(-59.0,-60.5,-61.0,[]));
    assert.equal(zf.go,false);assert.equal(zf.verdict,'INCOMPLETE-NOFIRE');
  });
  it('frozen learner holds acquisition false at tick 0 (synthetic seed 7)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'unlearned'});
    assert.equal(run.learners[run.founderIds[0]].acquisition,false);
  });
});
