// RSI-LESION V1 fixtures (FROZEN docs/RSI_LESION_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, ablateTasteHalf
// half-zeroing, proposeLesion skip/valid-decision branches, scorer
// GO/NOGO/NOADOPT branches, transplant digest round-trip.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from '../scripts/turn-gated-dev-v1m.mjs';
import {rlBank,scoreRsiLesionRows,ablateTasteHalf,proposeLesion,LESION_HALVES,RL_FIXTURE_SEEDS,RL_TRAIN_ARMS,RL_DEFAULT_RATE} from '../scripts/rsi-lesion-dev.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const txRow=(arm,seed,value,rate=1.0)=>({history:{seed},arm,stage:'transfer',probeRate:rate,
  transfer:{transferred:24,total:24,sourceDigest:'cc',appliedDigest:'cc'},
  endpoint:{budgetAdjustedEnergyPerFounder:value,survivors:3}});
const trRow=(arm,seed,proposals)=>({history:{seed},arm,stage:'train',proposals,
  phaseRows:[0,1,2,3].map(i=>({phase:i})),endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('rsi-lesion-dev fixtures',()=>{
  it('bank builds deterministic 4-history/36-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'lesion-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=rlBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'rsi-lesion-dev');
    assert.equal(p.histories.length,4);
    assert.deepEqual(p.histories.map(h=>h.role),['train','transfer','train','transfer']);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,36);
    assert.deepEqual([...RL_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(RL_FIXTURE_SEEDS[0],474109);
    rmSync(dir,{recursive:true,force:true});
  });
  it('ablateTasteHalf zeroes exactly one half (any D>=2)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const st=run.learners[run.founderIds[0]];
    const D=st.config.tasteDimensions;
    assert.ok(D>=2);
    const h=Math.floor(D/2);
    st.weights.taste.fill(1.5);
    assert.equal(ablateTasteHalf(st,0),0);
    assert.ok(st.weights.taste.slice(0,h).every(v=>v===0));
    assert.ok(st.weights.taste.slice(h).every(v=>v===1.5));
    assert.equal(ablateTasteHalf(st,1),1);
    assert.ok(st.weights.taste.every(v=>v===0));
    assert.throws(()=>ablateTasteHalf(st,2));
  });
  it('proposeLesion skips when empty; else returns a valid adopt/keep rec',()=>{
    const mkLearner=(n)=>{
      const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
      const st=run.learners[run.founderIds[0]];
      const D=st.config.tasteDimensions;
      for(let i=0;i<n;i++)st.recent.push({phi:Array(D).fill(0.1),target:0.0});
      return st;
    };
    const r0=proposeLesion(mkLearner(0),512);
    assert.equal(r0.decision,'skip');assert.equal(r0.fitN,0);
    const r1=proposeLesion(mkLearner(40),512);
    assert.ok(r1.decision==='adopt'||r1.decision==='keep');
    assert.ok(r1.fitN>0&&r1.testN===8);
    assert.ok(Number.isFinite(r1.errInc));
    assert.ok(r1.errCand===null||Number.isFinite(r1.errCand));
    if(r1.decision==='adopt')assert.ok(LESION_HALVES.includes(r1.lesion));
    else assert.equal(r1.lesion,null);
  });
  it('probe wiring uses default rate (no config carry)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    assert.equal(run.arm,'candidate');
    assert.equal(RL_DEFAULT_RATE,1.0);
    assert.ok(RL_TRAIN_ARMS.includes('selfmod'));
  });
  it('scorer GO/NOGO/NOADOPT branches on synthetic rows',()=>{
    const adopt=(seed,h)=>({agentId:0,tick:512,lesion:h,fitN:16,testN:8,errInc:0.5,errCand:0.3,decision:'adopt'});
    const mk=(sm,fx,un,props)=>[
      trRow('selfmod',474109,props),trRow('fixed',474109,[]),trRow('unlearned',474109,[]),
      trRow('selfmod',474118,props),trRow('fixed',474118,[]),trRow('unlearned',474118,[]),
      txRow('selfmod',474118,sm),txRow('fixed',474118,fx),txRow('unlearned',474118,un),
      txRow('selfmod',474127,sm),txRow('fixed',474127,fx),txRow('unlearned',474127,un)];
    const go=scoreRsiLesionRows(mk(-59.0,-60.5,-61.0,[adopt(474109,0)]));
    assert.equal(go.g1,true);assert.equal(go.g2,true);
    assert.equal(go.go,true);assert.equal(go.verdict,'RSI-LESION-GO-V1');
    const no=scoreRsiLesionRows(mk(-61.0,-59.0,-60.0,[adopt(474109,1)]));
    assert.equal(no.go,false);assert.equal(no.verdict,'RSI-LESION-NOGO-V1');
    const zf=scoreRsiLesionRows(mk(-59.0,-60.5,-61.0,[]));
    assert.equal(zf.go,false);assert.equal(zf.verdict,'INCOMPLETE-NOADOPT');
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
