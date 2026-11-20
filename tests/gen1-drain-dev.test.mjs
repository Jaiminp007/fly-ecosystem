// GEN1-DRAIN V1 fixtures (FROZEN docs/GEN1_DRAIN_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, meanToxin helper,
// scorer GO/NOGO branches, constants, triage-seed exclusion. Per-tick
// metering path covered by triage (live run), not fixtures.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gdBank,scoreGen1DrainRows,meanToxin,GD_FIXTURE_SEEDS,GD_TRIAGE_SEEDS,GD_ARMS,GD_MARGIN,GD_DEPLETE_TICKS,GD_MEASURE_TICKS,GD_BIN_TICKS} from '../scripts/gen1-drain-dev.mjs';

const row=(seed,arm,toxin,surv)=>({history:{seed},arm,stage:'main',transferred:24,placedEnergyDelta:0,survival:surv,
  meteredTicks:1792,toxin,food:{},energyCurve:[],depleteTicks:arm==='deep'?1024:0,measureTicks:1792,
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:Math.round(surv*24)}});
const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));

describe('gen1-drain-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1drain-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gdBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-drain-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GD_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GD_FIXTURE_SEEDS[0],474325);
    assert.deepEqual([...GD_TRIAGE_SEEDS],[490073,490074,490075,490076,490077,490078,490079,490080,490081]);
    assert.ok(!GD_FIXTURE_SEEDS.some(s=>GD_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GD_ARMS],['deep','fresh']);
    assert.equal(GD_DEPLETE_TICKS,1024);assert.equal(GD_MEASURE_TICKS,1792);assert.equal(GD_BIN_TICKS,64);
    rmSync(dir,{recursive:true,force:true});
  });
  it('meanToxin averages cumulative per-agent toxin (non-negative by construction)',()=>{
    assert.equal(meanToxin({toxin:tx(1.0,2.0,3.0)}),2.0);
    assert.equal(meanToxin({toxin:tx(0,0,0)}),0);
    assert.equal(meanToxin({toxin:{}}),null);
    assert.equal(meanToxin({}),null);
  });
  it('scorer GO branch (fresh loads more chronic toxin)',()=>{
    const rows=[row(474325,'deep',tx(1,1,1),0.9),row(474325,'fresh',tx(3,3,3),0.0),
      row(474334,'deep',tx(1,1,1),0.9),row(474334,'fresh',tx(3,3,3),0.0)];
    const v=scoreGen1DrainRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-DRAIN-GO-V1');
    assert.equal(v.toxin.fresh,3);assert.equal(v.toxin.deep,1);
  });
  it('scorer NOGO branch (no toxin gap)',()=>{
    const rows=[row(474325,'deep',tx(1,1,1),0.9),row(474325,'fresh',tx(1,1,1),0.0),
      row(474334,'deep',tx(1,1,1),0.9),row(474334,'fresh',tx(1,1,1),0.0)];
    const v=scoreGen1DrainRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-DRAIN-NOGO-V1');
  });
  it('scorer NOGO on all-zero toxin (floor, both arms)',()=>{
    const rows=[row(474325,'deep',tx(0,0),0.9),row(474325,'fresh',tx(0,0),0.0),
      row(474334,'deep',tx(0,0),0.9),row(474334,'fresh',tx(0,0),0.0)];
    const v=scoreGen1DrainRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-DRAIN-NOGO-V1');
  });
  it('scorer INVALID on missing toxin tables',()=>{
    const rows=[{history:{seed:474325},arm:'deep',stage:'main',survival:0.9,endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:20}}];
    const v=scoreGen1DrainRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INVALID');
    assert.ok(GD_MARGIN===1.1);
  });
});
