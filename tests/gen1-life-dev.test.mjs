// GEN1-LIFE V1 fixtures (FROZEN docs/GEN1_LIFE_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, summarizeGen1Lifespan
// helper, scorer GO/NOGO/NOBIRTHS branches (incl. reverse direction),
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {glBank,scoreGen1LifeRows,summarizeGen1Lifespan,GL_FIXTURE_SEEDS,GL_TRIAGE_SEEDS,GL_ARMS,GL_MARGIN,GL_TICKS,GL_BAR} from '../scripts/gen1-life-dev.mjs';

const row=(seed,arm,gen1n,gen1life,births=6)=>({history:{seed},arm,stage:'main',ticks:GL_TICKS[arm],transmission:'none',
  births,gen1n,gen1life,endpoint:{tick:GL_TICKS[arm],budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('gen1-life-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1life-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=glBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-life-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GL_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GL_FIXTURE_SEEDS[0],474253);
    assert.deepEqual([...GL_TRIAGE_SEEDS],[490055,490056,490057,490058,490059,490060,490061,490062,490063]);
    assert.ok(!GL_FIXTURE_SEEDS.some(s=>GL_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GL_ARMS],['deep','shallow']);
    assert.deepEqual(GL_TICKS,{deep:1792,shallow:512});
    assert.equal(GL_BAR,30);
    rmSync(dir,{recursive:true,force:true});
  });
  it('summarizeGen1Lifespan averages ticks alive (dead + alive, clamp >=1)',()=>{
    const lin=[{id:5,generation:1,born:100,died:200},{id:6,generation:1,born:100,died:null},{id:9,generation:2,born:0,died:10}];
    const v=summarizeGen1Lifespan(lin,1000);
    assert.equal(v.n,2);
    assert.equal(v.mean,(100+900)/2);
    assert.equal(summarizeGen1Lifespan(lin.filter(e=>e.generation!==1),1000),null);
    const edge=summarizeGen1Lifespan([{id:1,generation:1,born:1000,died:null}],1000);
    assert.equal(edge.mean,1);
  });
  it('scorer GO branch (shallow lives longer — world matters)',()=>{
    const rows=[row(474253,'deep',4,100),row(474253,'shallow',4,200),row(474262,'deep',4,100),row(474262,'shallow',4,200)];
    const v=scoreGen1LifeRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-LIFE-GO-V1');
  });
  it('scorer GO branch (reverse: deep lives longer)',()=>{
    const rows=[row(474253,'deep',4,200),row(474253,'shallow',4,100),row(474262,'deep',4,200),row(474262,'shallow',4,100)];
    const v=scoreGen1LifeRows(rows);
    assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-LIFE-GO-V1');
  });
  it('scorer NOGO branch (lifespans match)',()=>{
    const rows=[row(474253,'deep',4,100),row(474253,'shallow',4,105),row(474262,'deep',4,100),row(474262,'shallow',4,105)];
    const v=scoreGen1LifeRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-LIFE-NOGO-V1');
  });
  it('scorer NOBIRTHS void (Gen1==0 anywhere)',()=>{
    const rows=[row(474253,'deep',0,null,0),row(474253,'shallow',4,105),row(474262,'deep',4,100),row(474262,'shallow',4,105)];
    const v=scoreGen1LifeRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INCOMPLETE-NOBIRTHS');
    assert.ok(GL_MARGIN===1.1);
  });
});
