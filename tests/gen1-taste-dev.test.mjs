// GEN1-TASTE V1 fixtures (FROZEN docs/GEN1_TASTE_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, summarizeGen1Food
// helper, scorer GO/NOGO/NOBIRTHS branches, transmission constants,
// triage-seed exclusion.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gtBank,scoreGen1TasteRows,summarizeGen1Food,GT_FIXTURE_SEEDS,GT_TRIAGE_SEEDS,GT_ARMS,GT_TX,GT_MARGIN} from '../scripts/gen1-taste-dev.mjs';

const row=(seed,arm,gen1n,gen1food,births=6)=>({history:{seed},arm,stage:'main',transmission:GT_TX[arm],
  births,gen1n,gen1food,endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('gen1-taste-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1taste-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gtBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-taste-dev');
    assert.equal(p.histories.length,2);
    assert.deepEqual(p.histories.map(h=>h.role),['main','main']);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GT_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GT_FIXTURE_SEEDS[0],474145);
    assert.deepEqual([...GT_TRIAGE_SEEDS],[490028,490029,490030,490031,490032,490033,490034,490035,490036]);
    assert.ok(!GT_FIXTURE_SEEDS.some(s=>GT_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual(GT_TX,{copybest:'copybest',unlearned:'none'});
    rmSync(dir,{recursive:true,force:true});
  });
  it('summarizeGen1Food averages generation-1 lifetime food only',()=>{
    const food={0:100,1:120,5:200,6:240,9:50};
    const lin=[{id:0,generation:0},{id:1,generation:0},{id:5,generation:1},{id:6,generation:1},{id:9,generation:2}];
    assert.deepEqual(summarizeGen1Food(food,lin),{n:2,mean:220});
    assert.equal(summarizeGen1Food(food,lin.filter(e=>e.generation!==1)),null);
    assert.equal(summarizeGen1Food({},lin).mean,0);
  });
  it('scorer GO branch (copybest Gen1 out-forages naive x1.1)',()=>{
    const rows=[row(474145,'copybest',4,2.2),row(474145,'unlearned',4,1.0),row(474154,'copybest',4,2.2),row(474154,'unlearned',4,1.0)];
    const v=scoreGen1TasteRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-TASTE-GO-V1');
  });
  it('scorer NOGO branch (copybest neutral)',()=>{
    const rows=[row(474145,'copybest',4,1.0),row(474145,'unlearned',4,1.0),row(474154,'copybest',4,1.05),row(474154,'unlearned',4,1.0)];
    const v=scoreGen1TasteRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-TASTE-NOGO-V1');
  });
  it('scorer NOBIRTHS void (Gen1==0 anywhere)',()=>{
    const rows=[row(474145,'copybest',0,null,0),row(474145,'unlearned',4,1.0),row(474154,'copybest',4,2.2),row(474154,'unlearned',4,1.0)];
    const v=scoreGen1TasteRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INCOMPLETE-NOBIRTHS');
    assert.ok(GT_MARGIN===1.1);
  });
  it('scorer INVALID on missing gen1 food (collector failure)',()=>{
    const rows=[row(474145,'copybest',4,null),row(474145,'unlearned',4,1.0),row(474154,'copybest',4,2.2),row(474154,'unlearned',4,1.0)];
    const v=scoreGen1TasteRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INVALID');
  });
});
