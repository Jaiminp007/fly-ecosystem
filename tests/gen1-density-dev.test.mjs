// GEN1-DENSITY V1 fixtures (FROZEN docs/GEN1_DENSITY_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, scaleFood on fakes, inferCause rule, causeSplit, scorer
// GO-FOOD/GO-DENSITY/NOGO/INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import {gdyBank,scoreGen1DensityRows,causeSplit,scaleFood,inferCause,meanToxin,
  GDY_FIXTURE_SEEDS,GDY_TRIAGE_SEEDS,GDY_ARMS,GDY_MARGIN,GDY_DEPLETE_TICKS,
  GDY_MEASURE_TICKS,GDY_PLACE_ENERGY,GDY_LOW_FOUNDERS,GDY_FULL_FOUNDERS,GDY_FOOD_SCALE} from '../scripts/gen1-density-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedCauses)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedCauses[i]?1:null,cause:diedCauses[i]??null,lastEnergy:40}));
const row=(seed,arm,tox,surv,diedCauses)=>({history:{seed},arm,stage:'main',founders:arm==='deep'?24:8,survival:surv,
  meteredTicks:1792,toxin:tox,food:{},energyCurve:[],agents:agents(arm==='deep'?24:8,diedCauses),
  deathCauses:{energy:Object.values(diedCauses).length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}});

describe('gen1-density-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1density-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gdyBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-density-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GDY_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GDY_FIXTURE_SEEDS[0],474361);
    assert.deepEqual([...GDY_TRIAGE_SEEDS],[490091,490092,490093,490094,490095,490096,490097,490098,490099]);
    assert.ok(!GDY_FIXTURE_SEEDS.some(s=>GDY_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GDY_ARMS],['low','lowm','deep']);
    assert.equal(GDY_DEPLETE_TICKS,1024);assert.equal(GDY_MEASURE_TICKS,1792);assert.equal(GDY_PLACE_ENERGY,48);
    assert.equal(GDY_LOW_FOUNDERS,8);assert.equal(GDY_FULL_FOUNDERS,24);assert.equal(GDY_FOOD_SCALE,1/3);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1 (structure intact)',()=>{
    const clean=cleanCodebook({cueSeed:474361});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('scaleFood multiplies amount/capacity/regrowth only',()=>{
    const food=[{x:1,y:2,amount:9,capacity:12,regrowth:3,cueId:5,valence:1},{x:3,y:4,amount:6,capacity:8,regrowth:2,cueId:6,valence:1}];
    const run={world:{food,initialEnergy:100,energy(){return 100+this.food.reduce((x,p)=>x+p.amount,0);}}};
    assert.equal(scaleFood(run,1/3),2);
    assert.equal(run.world.initialEnergy,100+(5-15));
    assert.deepEqual(run.world.food[0],{x:1,y:2,amount:3,capacity:4,regrowth:1,cueId:5,valence:1});
    assert.deepEqual(run.world.food[1],{x:3,y:4,amount:2,capacity:8/3,regrowth:2/3,cueId:6,valence:1});
  });
  it('inferCause rule (age only at cap, both when drained at cap)',()=>{
    assert.equal(inferCause(0.5,100,1000),'energy');
    assert.equal(inferCause(40,1000,1000),'age');
    assert.equal(inferCause(0.5,1000,1000),'both');
    assert.equal(inferCause(0.2,500,undefined),'energy');
  });
  it('causeSplit counts energy/age/both/alive',()=>{
    const r={agents:[{died:null},{died:5,cause:'energy'},{died:9,cause:'age'},{died:12,cause:'both'},{died:3,cause:'energy'}]};
    assert.deepEqual(causeSplit(r),{energy:2,age:1,both:1,alive:1});
    assert.equal(causeSplit(null),null);
  });
  it('scorer GO-FOOD branch (low rescues, lowm does not)',()=>{
    const dc8={},dc24={};
    const rows=[row(474361,'deep',tx(13,13),0.95,dc24),row(474361,'low',tx(0,0),0.92,dc8),
      row(474361,'lowm',tx(0,0),0.55,dc8),row(474370,'deep',tx(13,13),0.95,dc24),
      row(474370,'low',tx(0,0),0.92,dc8),row(474370,'lowm',tx(0,0),0.55,dc8)];
    const v=scoreGen1DensityRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.food,true);
    assert.equal(v.verdict,'GEN1-DENSITY-GO-FOOD-V1');
    assert.ok(GDY_MARGIN===1.1);
  });
  it('scorer GO-DENSITY/NOGO/INVALID branches',()=>{
    const dc={};
    const mk=(ls,lms)=>[row(474361,'deep',tx(13,13),0.95,dc),row(474361,'low',tx(0,0),ls,dc),
      row(474361,'lowm',tx(0,0),lms,dc),row(474370,'deep',tx(13,13),0.95,dc),
      row(474370,'low',tx(0,0),ls,dc),row(474370,'lowm',tx(0,0),lms,dc)];
    const vd=scoreGen1DensityRows(mk(0.93,0.91));
    assert.equal(vd.verdict,'GEN1-DENSITY-GO-DENSITY-V1');assert.equal(vd.go,true);assert.equal(vd.food,false);
    const vn=scoreGen1DensityRows(mk(0.60,0.55));
    assert.equal(vn.verdict,'GEN1-DENSITY-NOGO-V1');assert.equal(vn.go,false);
    const bad=[row(474361,'deep',tx(13,13),0.95,dc),row(474361,'low',tx(5,5),0.9,dc),
      row(474361,'lowm',tx(0,0),0.9,dc),row(474370,'deep',tx(13,13),0.95,dc),
      row(474370,'low',tx(5,5),0.9,dc),row(474370,'lowm',tx(0,0),0.9,dc)];
    assert.equal(scoreGen1DensityRows(bad).verdict,'INVALID');
  });
});
