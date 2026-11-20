// RETENTION-DURING V1 fixtures (FROZEN docs/RETENTION_DURING_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, foodRate helper,
// scorer GO/NOGO/NOLEARN branches on synthetic rows, transplant digest
// round-trip, manual freeze safety on a zero-tick learner.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {freezeTasteEnergyBody} from '../learning/taste-energy.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from '../scripts/turn-gated-dev-v1m.mjs';
import {rdBank,scoreRetentionDuringRows,foodRate,RD_FIXTURE_SEEDS,RD_SNAP_TICKS,RD_MARGIN} from '../scripts/retention-during-dev.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const trainRow=(seed)=>({history:{seed},arm:'candidate',stage:'train',
  phaseRows:[{phase:'A'},{phase:'B'}],endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});
const probeRow=(seed,arm,snapTick,rate)=>({history:{seed},arm,stage:'probe',snapTick,
  source:{train:seed-1},transfer:{transferred:24,total:24,sourceDigest:'cc',appliedDigest:'cc'},
  foodRate:rate,endpoint:{tick:256,totals:{foodEaten:rate*256},budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('retention-during-dev fixtures',()=>{
  it('bank builds deterministic 4-history/36-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'retdur-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=rdBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'retention-during-dev');
    assert.equal(p.histories.length,4);
    assert.deepEqual(p.histories.map(h=>h.role),['train','probe','train','probe']);
    assert.deepEqual(p.histories.map(h=>h.pair),[0,0,1,1]);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,36);
    assert.deepEqual([...RD_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(RD_FIXTURE_SEEDS[0],474037);
    assert.deepEqual([...RD_SNAP_TICKS],[512,640,768,896,1024]);
    rmSync(dir,{recursive:true,force:true});
  });
  it('foodRate helper reads colony food per tick',()=>{
    assert.equal(foodRate({tick:256,totals:{foodEaten:512}}),2.0);
    assert.throws(()=>foodRate({tick:0,totals:{foodEaten:5}}));
    assert.throws(()=>foodRate({tick:256,totals:{}}));
  });
  it('scorer GO branch on synthetic rows (retained above naive x1.1)',()=>{
    const rows=[trainRow(474037),trainRow(474055)];
    for(const t of RD_SNAP_TICKS){rows.push(probeRow(474046,'candidate',t,2.0));rows.push(probeRow(474064,'candidate',t,2.0));}
    rows.push(probeRow(474046,'unlearned','naive',1.0));rows.push(probeRow(474064,'unlearned','naive',1.0));
    const v=scoreRetentionDuringRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'RETENTION-DURING-GO-V1');
    assert.equal(v.pooled.baseline,2.0);assert.equal(v.pooled.un,1.0);
  });
  it('scorer NOGO branch (decays to naive during B)',()=>{
    const rows=[trainRow(474037),trainRow(474055)];
    const rates={512:2.0,640:1.5,768:1.2,896:1.0,1024:0.9};
    for(const t of RD_SNAP_TICKS){rows.push(probeRow(474046,'candidate',t,rates[t]));rows.push(probeRow(474064,'candidate',t,rates[t]));}
    rows.push(probeRow(474046,'unlearned','naive',1.0));rows.push(probeRow(474064,'unlearned','naive',1.0));
    const v=scoreRetentionDuringRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'RETENTION-DURING-NOGO-V1');
  });
  it('scorer NOLEARN void (no A-skill at baseline)',()=>{
    const rows=[trainRow(474037),trainRow(474055)];
    for(const t of RD_SNAP_TICKS){rows.push(probeRow(474046,'candidate',t,1.0));rows.push(probeRow(474064,'candidate',t,1.0));}
    rows.push(probeRow(474046,'unlearned','naive',1.0));rows.push(probeRow(474064,'unlearned','naive',1.0));
    const v=scoreRetentionDuringRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INCOMPLETE-NOLEARN');
    assert.ok(RD_MARGIN===1.1);
  });
  it('transplant digest round-trips and manual freeze is safe on a zero-tick learner',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const run2=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    for(const id of Object.keys(run2.learners))freezeTasteEnergyBody(run2.learners[id]);
    const snap=snapshotWeights(run.learners);
    for(const id of Object.keys(snap))assertFreshTarget(run2.learners[id],id);
    const cp=copyWeights(snap,run2.learners);
    assert.ok(cp.transferred>0);
    assert.equal(checkTransplantIntegrity(snap,run2.learners).ok,true);
    assert.equal(digestWeights(snap),digestWeights(snapshotWeights(run2.learners)));
  });
});
