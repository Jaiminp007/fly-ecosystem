// GEN1-CAUSE V1 fixtures (FROZEN docs/GEN1_CAUSE_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, agentTable +
// earlyMortality + medianDeathTick helpers, scorer GO/NOGO branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gxBank,scoreGen1CauseRows,agentTable,earlyMortality,medianDeathTick,GX_FIXTURE_SEEDS,GX_MARGIN,GX_ARMS,GX_EARLY_TICKS} from '../scripts/gen1-cause-dev.mjs';

const mkRun=(deadTicks)=>({world:{tick:1792,flies:[],lineage:deadTicks.map((d,i)=>({id:i,generation:0,born:0,died:d}))}});
const row=(seed,arm,agents,early,survival,med)=>({history:{seed},arm,stage:'main',transferred:24,placedEnergyDelta:0,
  survival,agents,earlyMortality:early,medianDeathTick:med,deaths:{energy:0,age:0},
  depleteTicks:arm==='deep'?1024:0,measureTicks:1792,
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:Math.round(survival*24)}});

describe('gen1-cause-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1cause-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gxBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-cause-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GX_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GX_FIXTURE_SEEDS[0],474307);
    assert.deepEqual([...GX_ARMS],['deep','fresh']);
    assert.equal(GX_EARLY_TICKS,256);
    rmSync(dir,{recursive:true,force:true});
  });
  it('agentTable + earlyMortality + medianDeathTick read lineage correctly',()=>{
    const run=mkRun([100,null,300,1792]);
    const t=agentTable(run);
    assert.equal(t.length,4);
    assert.equal(earlyMortality(t),0.25);
    assert.equal(medianDeathTick(t,1792),(300+1792)/2);
    assert.equal(earlyMortality([]),null);
    assert.equal(medianDeathTick([],1792),null);
  });
  it('early deaths at the boundary count (died <= 256)',()=>{
    const run=mkRun([256,257]);
    const t=agentTable(run);
    assert.equal(earlyMortality(t),0.5);
  });
  it('scorer GO branch (acute deaths concentrate fresh)',()=>{
    const A=[{id:1,generation:0,born:0,died:100},{id:2,generation:0,born:0,died:null}];
    const B=[{id:1,generation:0,born:0,died:null},{id:2,generation:0,born:0,died:null}];
    const mkR=(seed,arm,agents,early)=>row(seed,arm,agents,early,0.5,100);
    const rows=[mkR(474307,'deep',B,0.0),mkR(474307,'fresh',A,1.0),mkR(474316,'deep',B,0.0),mkR(474316,'fresh',A,1.0)];
    const v=scoreGen1CauseRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-CAUSE-GO-V1');
  });
  it('scorer NOGO branch (no acute fresh excess)',()=>{
    const rows=[row(474307,'deep',[],0.5,0.5,900),row(474307,'fresh',[],0.5,0.5,900),
      row(474316,'deep',[],0.5,0.5,900),row(474316,'fresh',[],0.5,0.5,900)];
    const v=scoreGen1CauseRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-CAUSE-NOGO-V1');
    assert.ok(GX_MARGIN===1.1);
  });
  it('scorer INVALID on missing tables',()=>{
    const rows=[row(474307,'deep',null,0.5,0.5,900)];
    const v=scoreGen1CauseRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INVALID');
  });
});
