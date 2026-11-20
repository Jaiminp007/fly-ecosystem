// GEN1-CLEAN V1 fixtures (FROZEN docs/GEN1_CLEAN_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// helper (all +1, structure intact), scorer GO/NOGO/INVALID-manipulation
// branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import {gc2Bank,scoreGen1CleanRows,cleanCodebook,meanToxin,GC2_FIXTURE_SEEDS,GC2_TRIAGE_SEEDS,GC2_ARMS,GC2_MARGIN,GC2_DEPLETE_TICKS,GC2_MEASURE_TICKS,GC2_PLACE_ENERGY} from '../scripts/gen1-clean-dev.mjs';

const row=(seed,arm,tox,surv)=>({history:{seed},arm,stage:'main',transferred:24,placedEnergyDelta:0,survival:surv,
  meteredTicks:1792,toxin:tox,food:{},energyCurve:[],depleteTicks:arm==='deep'?1024:0,measureTicks:1792,
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:Math.round(surv*24)}});
const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));

describe('gen1-clean-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1clean-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gc2Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-clean-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GC2_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GC2_FIXTURE_SEEDS[0],474343);
    assert.deepEqual([...GC2_TRIAGE_SEEDS],[490082,490083,490084,490085,490086,490087,490088,490089,490090]);
    assert.ok(!GC2_FIXTURE_SEEDS.some(s=>GC2_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GC2_ARMS],['deep','fresh']);
    assert.equal(GC2_DEPLETE_TICKS,1024);assert.equal(GC2_MEASURE_TICKS,1792);assert.equal(GC2_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook forces all +1 valence, preserves structure',()=>{
    const orig=makeCueCodebook(474343);
    const clean=cleanCodebook({cueSeed:474343});
    assert.deepEqual(Object.keys(clean).sort(),['A','B','C']);
    for(const fam of ['A','B','C']){
      assert.equal(clean[fam].length,4);
      assert.ok(clean[fam].every(c=>c.valence===1));
      assert.deepEqual(clean[fam].map(c=>c.id),orig[fam].map(c=>c.id));
      assert.deepEqual(clean[fam].map(c=>c.bits),orig[fam].map(c=>c.bits));
    }
    assert.ok(orig.A.some(c=>c.valence===-1)||orig.B.some(c=>c.valence===-1)||orig.C.some(c=>c.valence===-1));
  });
  it('meanToxin helper and manipulation threshold',()=>{
    assert.equal(meanToxin({toxin:tx(1,2,3)}),2);
    assert.equal(meanToxin({toxin:tx(0,0)}),0);
    assert.equal(meanToxin({}),null);
    assert.equal(meanToxin(null),null);
  });
  it('scorer GO branch (clean rescues to deep level)',()=>{
    const rows=[row(474343,'deep',tx(13,13),0.95),row(474343,'fresh',tx(0,0),0.92),
      row(474352,'deep',tx(13,13),0.95),row(474352,'fresh',tx(0,0),0.92)];
    const v=scoreGen1CleanRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-CLEAN-GO-V1');
  });
  it('scorer NOGO branch (clean still dies)',()=>{
    const rows=[row(474343,'deep',tx(13,13),0.95),row(474343,'fresh',tx(0,0),0.0),
      row(474352,'deep',tx(13,13),0.95),row(474352,'fresh',tx(0,0),0.0)];
    const v=scoreGen1CleanRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-CLEAN-NOGO-V1');
    assert.ok(GC2_MARGIN===1.1);
  });
  it('scorer INVALID when clean loads toxin (swap failed)',()=>{
    const rows=[row(474343,'deep',tx(13,13),0.95),row(474343,'fresh',tx(5,5),0.9),
      row(474352,'deep',tx(13,13),0.95),row(474352,'fresh',tx(5,5),0.9)];
    const v=scoreGen1CleanRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INVALID');
  });
});
