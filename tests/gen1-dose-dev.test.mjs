// GEN1-DOSE V1 fixtures (FROZEN docs/GEN1_DOSE_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, doseTransfer (down-gradient/nearest-3/zero-sum), split/margin
// reuse, scorer GO/NOGO-flat/NOGO-reverse/INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gdoBank,scoreGen1DoseRows,causeSplit,doseSplitLosers,doseBalanceMargin,doseTransfer,underCount,meanToxin,
  GDO_FIXTURE_SEEDS,GDO_TRIAGE_SEEDS,GDO_ARMS,GDO_FRACS,GDO_GIVE_K,GDO_SURV_TOL,
  GDO_DEPLETE_TICKS,GDO_MEASURE_TICKS,GDO_PLACE_ENERGY} from '../scripts/gen1-dose-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={},given={},received={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;given[i]=0;received[i]=0;}return {food,cost,given,received};};
const mkrow=(seed,arm,surv,diedIds,transfer)=>{const {food,cost,given,received}=foodcost(24,0.03,1792);
  diedIds.forEach((d)=>{food[d]=20;cost[d]=40;});
  const ag=agents(24,diedIds);
  return {history:{seed},arm,stage:'main',frozen:true,survival:surv,transfer,
  meteredTicks:1792,toxin:tx(0,0),food,cost,given,received,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:ag,
  initDigest:'aaa',finalDigest:'aaa',
  deathCauses:{energy:diedIds.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-dose-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1dose-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gdoBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-dose-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GDO_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GDO_FIXTURE_SEEDS[0],474487);
    assert.deepEqual([...GDO_TRIAGE_SEEDS],[490154,490155,490156,490157,490158,490159,490160,490161,490162]);
    assert.ok(!GDO_FIXTURE_SEEDS.some(s=>GDO_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GDO_ARMS],['asocial','half','threeq','deep']);
    assert.deepEqual({...GDO_FRACS},{asocial:0,half:0.5,threeq:0.75,deep:0});
    assert.equal(GDO_GIVE_K,3);assert.equal(GDO_SURV_TOL,0.05);
    assert.equal(GDO_DEPLETE_TICKS,1024);assert.equal(GDO_MEASURE_TICKS,1792);assert.equal(GDO_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1',()=>{
    const clean=cleanCodebook({cueSeed:474487});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('doseTransfer down-gradient/nearest-3/zero-sum',()=>{
    const mk=(id,x,energy,lastFood)=>({id,x,y:0,energy,lastFood});
    const run={world:{flies:[mk(0,0,50,0.4),mk(1,10,20,0),mk(2,20,30,0),mk(3,30,40,0)]}};
    const g=doseTransfer(run,0.75,3);
    assert.equal(g.count,1);
    assert.ok(Math.abs(run.world.flies[0].energy-49.7)<1e-9&&Math.abs(run.world.flies[1].energy-20.3)<1e-9);
    assert.ok(Math.abs(g.moved-0.3)<1e-9);
    const run2={world:{flies:[mk(0,0,10,0.4),mk(1,10,20,0)]}};
    assert.equal(doseTransfer(run2,0.75,3).count,0);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/margin/underCount reuse',()=>{
    const ag=agents(20,[18,19]);
    const {food,cost}=foodcost(20,0.03,1792);
    food[18]=0.5;cost[18]=30;food[19]=20;cost[19]=40;
    assert.equal(doseSplitLosers({agents:ag,food,cost,meteredTicks:1792}).losers,2);
    assert.ok(Number.isFinite(doseBalanceMargin({agents:ag,food,cost})));
    assert.equal(underCount({agents:ag,food,cost,meteredTicks:1792}),1);
    assert.equal(underCount(null),0);
    assert.equal(doseSplitLosers(null),null);
  });
  it('causeSplit counts',()=>{
    assert.deepEqual(causeSplit({agents:agents(5,[1,3])}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
  });
  it('scorer GO branch (threeq UNDER < half UNDER, no reversal)',()=>{
    const underIds=n=>Array.from({length:n},(_,i)=>i);
    const rows=[mkrow(474487,'asocial',0.625,underIds(9),null),mkrow(474487,'half',0.854,underIds(7),{count:100,moved:25}),
      mkrow(474487,'threeq',0.875,underIds(4),{count:100,moved:35}),mkrow(474487,'deep',0.958,[],null),
      mkrow(474496,'asocial',0.625,underIds(9),null),mkrow(474496,'half',0.854,underIds(7),{count:100,moved:25}),
      mkrow(474496,'threeq',0.875,underIds(4),{count:100,moved:35}),mkrow(474496,'deep',0.958,[],null)];
    const v=scoreGen1DoseRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-DOSE-GO-V1');
  });
  it('scorer NOGO/INVALID branches',()=>{
    const underIds=n=>Array.from({length:n},(_,i)=>i);
    const mk=(tqU,tqS)=>[mkrow(474487,'asocial',0.625,underIds(9),null),mkrow(474487,'half',0.854,underIds(7),{count:100,moved:25}),
      mkrow(474487,'threeq',tqS,underIds(tqU),{count:100,moved:35}),mkrow(474487,'deep',0.958,[],null),
      mkrow(474496,'asocial',0.625,underIds(9),null),mkrow(474496,'half',0.854,underIds(7),{count:100,moved:25}),
      mkrow(474496,'threeq',tqS,underIds(tqU),{count:100,moved:35}),mkrow(474496,'deep',0.958,[],null)];
    assert.equal(scoreGen1DoseRows(mk(7,0.875)).verdict,'GEN1-DOSE-NOGO-V1');
    assert.equal(scoreGen1DoseRows(mk(9,0.80)).verdict,'GEN1-DOSE-NOGO-V1');
    const bad=[mkrow(474487,'asocial',0.625,underIds(9),null),mkrow(474487,'half',0.854,underIds(7),{count:0,moved:0}),
      mkrow(474487,'threeq',0.875,underIds(4),{count:100,moved:35}),mkrow(474487,'deep',0.958,[],null),
      mkrow(474496,'asocial',0.625,underIds(9),null),mkrow(474496,'half',0.854,underIds(7),{count:0,moved:0}),
      mkrow(474496,'threeq',0.875,underIds(4),{count:100,moved:35}),mkrow(474496,'deep',0.958,[],null)];
    assert.equal(scoreGen1DoseRows(bad).verdict,'GEN1-DOSE-INVALID-NOTRANSFER');
  });
});
