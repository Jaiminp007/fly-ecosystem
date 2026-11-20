// RETURN-NOVEL V1 fixtures (FROZEN docs/RETURN_NOVEL_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, foodRate helper,
// scorer GO/NOGO/NOBENEFIT branches, transplant digest round-trip,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from '../scripts/turn-gated-dev-v1m.mjs';
import {rnBank,scoreReturnNovelRows,foodRate,RN_FIXTURE_SEEDS,RN_ARMS,RN_MARGIN,RN_SNAP_TICK,RN_PROBE_TICKS} from '../scripts/return-novel-dev.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const bwRow=(seed,arm,retA)=>({history:{seed},arm,stage:'backward',
  seg:{A:{rate:2.0,ticks:512},retA:{rate:retA,ticks:256}},phaseRows:[{phase:'A'},{phase:'return-A'}],
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});
const prRow=(seed,arm,rate)=>({history:{seed},arm,stage:'probe',snapTick:1536,foodRate:rate,
  source:{train:seed-9},transfer:{transferred:24,total:24,sourceDigest:'cc',appliedDigest:'cc'},
  endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('return-novel-dev fixtures',()=>{
  it('bank builds deterministic 4-history/36-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'retnovel-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=rnBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'return-novel-dev');
    assert.equal(p.histories.length,4);
    assert.deepEqual(p.histories.map(h=>h.role),['train','probe','train','probe']);
    assert.deepEqual(p.histories.map(h=>h.pair),[0,0,1,1]);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,36);
    assert.deepEqual([...RN_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(RN_FIXTURE_SEEDS[0],474199);
    assert.deepEqual([...RN_ARMS],['intact','unlearned']);
    assert.equal(RN_SNAP_TICK,1536);assert.equal(RN_PROBE_TICKS,256);
    rmSync(dir,{recursive:true,force:true});
  });
  it('foodRate helper reads colony food per tick',()=>{
    assert.equal(foodRate({tick:256,totals:{foodEaten:512}}),2.0);
    assert.throws(()=>foodRate({tick:0,totals:{foodEaten:5}}));
  });
  it('scorer GO branch (benefit persists on novel layout)',()=>{
    const rows=[bwRow(474199,'intact',2.0),bwRow(474199,'unlearned',1.0),bwRow(474208,'intact',2.0),bwRow(474208,'unlearned',1.0),
      prRow(474208,'intact',2.0),prRow(474208,'unlearned',1.0),prRow(474217,'intact',2.0),prRow(474217,'unlearned',1.0)];
    const v=scoreReturnNovelRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'RETURN-NOVEL-GO-V1');
  });
  it('scorer NOGO branch (benefit vanishes — familiarity)',()=>{
    const rows=[bwRow(474199,'intact',2.0),bwRow(474199,'unlearned',1.0),bwRow(474208,'intact',2.0),bwRow(474208,'unlearned',1.0),
      prRow(474208,'intact',1.0),prRow(474208,'unlearned',1.0),prRow(474217,'intact',1.0),prRow(474217,'unlearned',1.0)];
    const v=scoreReturnNovelRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'RETURN-NOVEL-NOGO-V1');
  });
  it('scorer NOBENEFIT void (in-world benefit absent)',()=>{
    const rows=[bwRow(474199,'intact',1.0),bwRow(474199,'unlearned',1.0),bwRow(474208,'intact',1.0),bwRow(474208,'unlearned',1.0),
      prRow(474208,'intact',1.0),prRow(474208,'unlearned',1.0),prRow(474217,'intact',1.0),prRow(474217,'unlearned',1.0)];
    const v=scoreReturnNovelRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INCOMPLETE-NOBENEFIT');
    assert.ok(RN_MARGIN===1.1);
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
