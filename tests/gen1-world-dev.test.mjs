// GEN1-WORLD V1 fixtures (FROZEN docs/GEN1_WORLD_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, summarizeGen1Rate
// helper, scorer GO/NOGO/NOBIRTHS branches (incl. reverse direction),
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gwBank,scoreGen1WorldRows,summarizeGen1Rate,GW_FIXTURE_SEEDS,GW_TRIAGE_SEEDS,GW_ARMS,GW_MARGIN,GW_TICKS,GW_BAR} from '../scripts/gen1-world-dev.mjs';

const row=(seed,arm,gen1n,gen1rate,births=6)=>({history:{seed},arm,stage:'main',ticks:GW_TICKS[arm],transmission:'none',
  births,gen1n,gen1rate,endpoint:{tick:GW_TICKS[arm],budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('gen1-world-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1world-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gwBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-world-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GW_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GW_FIXTURE_SEEDS[0],474235);
    assert.deepEqual([...GW_TRIAGE_SEEDS],[490046,490047,490048,490049,490050,490051,490052,490053,490054]);
    assert.ok(!GW_FIXTURE_SEEDS.some(s=>GW_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GW_ARMS],['deep','shallow']);
    assert.deepEqual(GW_TICKS,{deep:1792,shallow:512});
    assert.equal(GW_BAR,30);
    rmSync(dir,{recursive:true,force:true});
  });
  it('summarizeGen1Rate averages food per tick alive (dead + alive)',()=>{
    const food={5:200,6:240,9:50};
    const lin=[{id:5,generation:1,born:100,died:200},{id:6,generation:1,born:100,died:null},{id:9,generation:2,born:0,died:10}];
    const v=summarizeGen1Rate(food,lin,1000);
    assert.equal(v.n,2);
    assert.ok(Math.abs(v.mean-(200/100+240/900)/2)<1e-9);
    assert.equal(summarizeGen1Rate(food,lin.filter(e=>e.generation!==1),1000),null);
  });
  it('scorer GO branch (shallow better — world matters)',()=>{
    const rows=[row(474235,'deep',4,1.0),row(474235,'shallow',4,2.0),row(474244,'deep',4,1.0),row(474244,'shallow',4,2.0)];
    const v=scoreGen1WorldRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-WORLD-GO-V1');
  });
  it('scorer GO branch (reverse: deep better — still world matters)',()=>{
    const rows=[row(474235,'deep',4,2.0),row(474235,'shallow',4,1.0),row(474244,'deep',4,2.0),row(474244,'shallow',4,1.0)];
    const v=scoreGen1WorldRows(rows);
    assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-WORLD-GO-V1');
  });
  it('scorer NOGO branch (world does not matter)',()=>{
    const rows=[row(474235,'deep',4,1.0),row(474235,'shallow',4,1.05),row(474244,'deep',4,1.0),row(474244,'shallow',4,1.05)];
    const v=scoreGen1WorldRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-WORLD-NOGO-V1');
  });
  it('scorer NOBIRTHS void (Gen1==0 anywhere)',()=>{
    const rows=[row(474235,'deep',0,null,0),row(474235,'shallow',4,1.0),row(474244,'deep',4,2.0),row(474244,'shallow',4,1.0)];
    const v=scoreGen1WorldRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INCOMPLETE-NOBIRTHS');
    assert.ok(GW_MARGIN===1.1);
  });
});
