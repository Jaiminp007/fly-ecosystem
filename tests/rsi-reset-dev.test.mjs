// RSI-RESET V1 fixtures (FROZEN plan docs/RSI_RESET_PLAN_V1.md + AMENDMENT_A1).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, resetComponentWeights
// purity on real zero-tick learners, proposeReset adopt/keep/skip branches on
// synthetic-record learners, final-rate-free probe wiring, scorer
// GO/NOGO/NORESET branches, transplant digest round-trip.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from '../scripts/turn-gated-dev-v1m.mjs';
import {rsiResetBank,scoreRsiResetRows,resetComponentWeights,proposeReset,RT_FIXTURE_SEEDS,RT_TRAIN_ARMS,RT_DEFAULT_RATE} from '../scripts/rsi-reset-dev.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const txRow=(arm,seed,value,rate=1.0)=>({history:{seed},arm,stage:'transfer',probeRate:rate,
  transfer:{transferred:24,total:24,sourceDigest:'cc',appliedDigest:'cc'},
  endpoint:{budgetAdjustedEnergyPerFounder:value,survivors:3}});
const trRow=(arm,seed,proposals)=>({history:{seed},arm,stage:'train',proposals,
  phaseRows:[0,1,2,3].map(i=>({phase:i})),endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('rsi-reset-dev fixtures',()=>{
  it('bank builds deterministic 4-history/36-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'rtr-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=rsiResetBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'rsi-reset-dev');
    assert.equal(p.histories.length,4);
    assert.deepEqual(p.histories.map(h=>h.role),['train','transfer','train','transfer']);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,36);
    assert.deepEqual([...RT_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    rmSync(dir,{recursive:true,force:true});
  });
  it('resetComponentWeights zeroes only taste (real zero-tick learner)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const st=run.learners[run.founderIds[0]];
    st.weights.taste.fill(1.5);st.weights.actor.fill(2.5);st.weights.critic.fill(3.5);
    st.eligibility.actor.fill(4.5);st.eligibility.critic.fill(5.5);
    assert.equal(resetComponentWeights(st,'taste'),'taste');
    assert.ok(st.weights.taste.every(v=>v===0));
    assert.ok(st.weights.actor.every(v=>v===2.5));
    assert.ok(st.weights.critic.every(v=>v===3.5));
    assert.ok(st.eligibility.actor.every(v=>v===4.5));
    assert.throws(()=>resetComponentWeights(st,'actorX'),/only taste reset is licensed/);
  });
  it('proposeReset adopts on overfit taste, keeps on fit taste, skips when empty',()=>{
    const mkLearner=(wval)=>{
      const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
      const st=run.learners[run.founderIds[0]];
      const D=st.config.tasteDimensions;
      st.weights.taste.fill(wval);
      const rec={phi:Array(D).fill(0.1),target:0.0};
      for(let i=0;i<24;i++)st.recent.push({...rec,phi:rec.phi.slice()});
      return st;
    };
    const over=mkLearner(1.5);
    const r1=proposeReset(over,512);
    assert.equal(r1.decision,'adopt');assert.equal(r1.component,'taste');
    assert.ok(r1.fitN>0&&r1.testN===8);assert.ok(Number.isFinite(r1.errInc)&&Number.isFinite(r1.errCand));
    assert.ok(r1.errCand<r1.errInc);
    const fit=mkLearner(0);
    const r2=proposeReset(fit,512);
    assert.equal(r2.decision,'keep');assert.equal(r2.component,null);
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const r3=proposeReset(run.learners[run.founderIds[0]],512);
    assert.equal(r3.decision,'skip');assert.equal(r3.fitN,0);
  });
  it('probe wiring uses default rate (no dials)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    assert.equal(run.arm,'candidate');
    assert.equal(RT_DEFAULT_RATE,1.0);
    assert.ok(RT_TRAIN_ARMS.includes('selfmod'));
  });
  it('scorer GO/NOGO/NORESET branches on synthetic rows',()=>{
    const adopt=(seed)=>({agentId:0,tick:512,component:'taste',fitN:16,testN:8,errInc:0.5,errCand:0.3,decision:'adopt'});
    const mk=(sm,fx,un,props)=>[
      trRow('selfmod',473244,props),trRow('fixed',473244,[]),trRow('unlearned',473244,[]),
      trRow('selfmod',473253,props),trRow('fixed',473253,[]),trRow('unlearned',473253,[]),
      txRow('selfmod',473253,sm),txRow('fixed',473253,fx),txRow('unlearned',473253,un),
      txRow('selfmod',473262,sm),txRow('fixed',473262,fx),txRow('unlearned',473262,un)];
    const go=scoreRsiResetRows(mk(-59.0,-60.5,-61.0,[adopt(473244)]));
    assert.equal(go.g1,true);assert.equal(go.g2,true);
    assert.equal(go.go,true);assert.equal(go.verdict,'RSI-RESET-GO-V1');
    const no=scoreRsiResetRows(mk(-61.0,-59.0,-60.0,[adopt(473244)]));
    assert.equal(no.go,false);assert.equal(no.verdict,'RSI-RESET-NOGO-V1');
    const zf=scoreRsiResetRows(mk(-59.0,-60.5,-61.0,[]));
    assert.equal(zf.go,false);assert.equal(zf.verdict,'INCOMPLETE-NORESET');
  });
  it('transplant digest round-trips on synthetic learners',()=>{
    const a=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const b=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const snap=snapshotWeights(a.learners);
    for(const id of Object.keys(snap))assertFreshTarget(b.learners[id],id);
    const cp=copyWeights(snap,b.learners);
    assert.ok(cp.transferred>0);
    assert.equal(checkTransplantIntegrity(snap,b.learners).ok,true);
    assert.equal(digestWeights(snap),digestWeights(snapshotWeights(b.learners)));
  });
});
