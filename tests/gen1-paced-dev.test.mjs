// GEN1-PACED V1 fixtures (FROZEN docs/GEN1_PACED_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, hideFood/restoreFood on fakes (no create/destroy), grossRate,
// causeSplit, scorer GO/NOGO/INVALID-manipulation branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gpdBank,scoreGen1PacedRows,causeSplit,capFood,restoreFood,grossRate,meanToxin,GPD_MEAL_CAP,
  GPD_FIXTURE_SEEDS,GPD_TRIAGE_SEEDS,GPD_ARMS,GPD_DEPLETE_TICKS,
  GPD_MEASURE_TICKS,GPD_PLACE_ENERGY,GPD_DUTY_VISIBLE,GPD_DUTY_PERIOD,GPD_PACE_MAX_FRAC} from '../scripts/gen1-paced-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const ser=()=>[{tick:32,intake:20,energyMean:47,alive:24}];
const agents=(n,died)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:died.includes(i)?1700:null,cause:died.includes(i)?'energy':null,lastEnergy:40}));
const row=(seed,arm,tox,food,surv,died)=>({history:{seed},arm,stage:'main',survival:surv,
  meteredTicks:1792,toxin:tox,food,energyCurve:[],series:ser(),agents:agents(24,died),
  deathCauses:{energy:died.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}});

describe('gen1-paced-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1paced-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gpdBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-paced-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GPD_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GPD_FIXTURE_SEEDS[0],474397);
    assert.deepEqual([...GPD_TRIAGE_SEEDS],[490109,490110,490111,490112,490113,490114,490115,490116,490117]);
    assert.ok(!GPD_FIXTURE_SEEDS.some(s=>GPD_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GPD_ARMS],['capped','uncapped','deep']);
    assert.equal(GPD_DEPLETE_TICKS,1024);assert.equal(GPD_MEASURE_TICKS,1792);assert.equal(GPD_PLACE_ENERGY,48);
    assert.equal(GPD_DUTY_VISIBLE,2);assert.equal(GPD_DUTY_PERIOD,3);assert.equal(GPD_PACE_MAX_FRAC,0.8);
    assert.equal(GPD_MEAL_CAP,0.03);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1',()=>{
    const clean=cleanCodebook({cueSeed:474397});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('capFood/restoreFood clamps meals, preserves stock exactly',()=>{
    const run={world:{food:[{amount:9},{amount:0.005},{amount:0.02}]}};
    const excess=capFood(run,0.01);
    assert.deepEqual(excess,[8.99,0,0.01]);
    assert.deepEqual(run.world.food.map(p=>p.amount),[0.01,0.005,0.01]);
    run.world.food[0].amount=0.004;
    restoreFood(run,excess);
    assert.deepEqual(run.world.food.map(p=>p.amount),[8.994,0.005,0.02]);
    assert.throws(()=>capFood(run,0));
    assert.throws(()=>restoreFood({world:{food:[{amount:1}]}},[1,2]));
  });
  it('grossRate per-agent-tick (net+toxin)',()=>{
    assert.equal(grossRate({toxin:tx(1,2),food:tx(3,4),agents:agents(2,[]),meteredTicks:100}),0.05);
    assert.equal(grossRate({toxin:tx(0,0),food:tx(5,5),agents:agents(2,[]),meteredTicks:100}),0.05);
    assert.equal(grossRate({}),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('causeSplit counts',()=>{
    assert.deepEqual(causeSplit({agents:agents(5,[1,3])}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
  });
  it('scorer GO branch (capped rescues to deep level)',()=>{
    const mk=(cs,us,ds)=>[row(474397,'capped',tx(0,0),tx(30,30),cs,[4]),row(474397,'uncapped',tx(0,0),tx(44,44),us,[1,2]),
      row(474397,'deep',tx(13,13),tx(-1,-1),ds,[]),row(474406,'capped',tx(0,0),tx(30,30),cs,[4]),
      row(474406,'uncapped',tx(0,0),tx(44,44),us,[1,2]),row(474406,'deep',tx(13,13),tx(-1,-1),ds,[])];
    const v=scoreGen1PacedRows(mk(0.958,0.75,0.958));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-PACED-GO-V1');
  });
  it('scorer NOGO/INVALID-manipulation branches',()=>{
    const mk=(cs)=>[row(474397,'capped',tx(0,0),tx(30,30),cs,[4]),row(474397,'uncapped',tx(0,0),tx(44,44),0.75,[1,2]),
      row(474397,'deep',tx(13,13),tx(-1,-1),0.958,[]),row(474406,'capped',tx(0,0),tx(30,30),cs,[4]),
      row(474406,'uncapped',tx(0,0),tx(44,44),0.75,[1,2]),row(474406,'deep',tx(13,13),tx(-1,-1),0.958,[])];
    const vn=scoreGen1PacedRows(mk(0.7));
    assert.equal(vn.verdict,'GEN1-PACED-NOGO-V1');assert.equal(vn.go,false);
    const bad=[row(474397,'capped',tx(0,0),tx(44,44),0.9,[1]),row(474397,'uncapped',tx(0,0),tx(44,44),0.75,[1,2]),
      row(474397,'deep',tx(13,13),tx(-1,-1),0.958,[]),row(474406,'capped',tx(0,0),tx(44,44),0.9,[1]),
      row(474406,'uncapped',tx(0,0),tx(44,44),0.75,[1,2]),row(474406,'deep',tx(13,13),tx(-1,-1),0.958,[])];
    assert.equal(scoreGen1PacedRows(bad).verdict,'INVALID');
  });
});
