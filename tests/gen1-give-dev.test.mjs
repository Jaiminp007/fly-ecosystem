// GEN1-GIVE V1 fixtures (FROZEN docs/GEN1_GIVE_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, giveTransfer (down-gradient/nearest-3/zero-sum/keeps-when-
// neediest), split/margin reuse, scorer GO/NOGO/INVALID-NOTRANSFER/
// INVALID-freeze branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gvBank,scoreGen1GiveRows,causeSplit,giveSplitLosers,giveBalanceMargin,giveTransfer,meanToxin,
  GV_FIXTURE_SEEDS,GV_TRIAGE_SEEDS,GV_ARMS,GV_DEPLETE_TICKS,
  GV_MEASURE_TICKS,GV_PLACE_ENERGY,GV_GIVE_FRAC,GV_GIVE_K} from '../scripts/gen1-give-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={},given={},received={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;given[i]=0;received[i]=0;}return {food,cost,given,received};};
const row=(seed,arm,surv,diedIds,transfer,initD='aaa',finalD='aaa')=>{const {food,cost,given,received}=foodcost(24,0.03,1792);
  return {history:{seed},arm,stage:'main',frozen:true,survival:surv,transfer,
  meteredTicks:1792,toxin:tx(0,0),food,cost,given,received,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,diedIds),
  initDigest:initD,finalDigest:finalD,
  deathCauses:{energy:diedIds.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-give-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1give-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gvBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-give-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GV_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GV_FIXTURE_SEEDS[0],474469);
    assert.deepEqual([...GV_TRIAGE_SEEDS],[490145,490146,490147,490148,490149,490150,490151,490152,490153]);
    assert.ok(!GV_FIXTURE_SEEDS.some(s=>GV_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GV_ARMS],['give','asocial','deep']);
    assert.equal(GV_DEPLETE_TICKS,1024);assert.equal(GV_MEASURE_TICKS,1792);assert.equal(GV_PLACE_ENERGY,48);
    assert.equal(GV_GIVE_FRAC,0.5);assert.equal(GV_GIVE_K,3);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1',()=>{
    const clean=cleanCodebook({cueSeed:474469});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('giveTransfer down-gradient/nearest-3/zero-sum/keeps-when-neediest',()=>{
    const mk=(id,x,energy,lastFood)=>({id,x,y:0,energy,lastFood});
    const run={world:{flies:[mk(0,0,50,0.4),mk(1,10,20,0),mk(2,20,30,0),mk(3,30,40,0),mk(4,100,10,0)]}};
    const g=giveTransfer(run,0.5,3);
    assert.equal(g.count,1);
    assert.deepEqual([run.world.flies[0].energy,run.world.flies[1].energy],[49.8,20.2]);
    assert.equal(g.moved,0.2);
    assert.equal(g.details.length,1);
    assert.deepEqual([g.details[0].donor,g.details[0].recipient],[0,1]);
    const run2={world:{flies:[mk(0,0,10,0.4),mk(1,10,20,0),mk(2,20,30,0)]}};
    const g2=giveTransfer(run2,0.5,3);
    assert.equal(g2.count,0);assert.equal(g2.moved,0);
    assert.equal(run2.world.flies[0].energy,10);
  });
  it('giveSplitLosers/giveBalanceMargin reuse',()=>{
    const ag=agents(20,[18,19]);
    const {food,cost}=foodcost(20,0.03,1792);
    food[18]=0.5;cost[18]=30;food[19]=20;cost[19]=40;
    const sp=giveSplitLosers({agents:ag,food,cost,meteredTicks:1792});
    assert.equal(sp.losers,2);assert.equal(sp.never+sp.under+sp.over,2);
    assert.ok(Number.isFinite(giveBalanceMargin({agents:ag,food,cost})));
    assert.equal(giveSplitLosers(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('causeSplit counts',()=>{
    assert.deepEqual(causeSplit({agents:agents(5,[1,3])}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
  });
  it('scorer GO branch (give lifts tail, engaged, freeze held)',()=>{
    const mk=(arm,surv,died)=>row(474469,arm,surv,died,arm==='give'?{count:100,moved:25.5}:null);
    const rows=[mk('give',0.9,[1]),mk('asocial',0.7,[1,2,3]),mk('deep',0.958,[]),
      row(474478,'give',0.9,[1],{count:100,moved:25.5}),row(474478,'asocial',0.7,[1,2,3],null),row(474478,'deep',0.958,[],null)];
    const v=scoreGen1GiveRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-GIVE-GO-V1');
  });
  it('scorer NOGO/INVALID branches',()=>{
    const mk=(arm,surv,tr)=>row(474469,arm,surv,[1],tr);
    const rowsN=[mk('give',0.7,{count:100,moved:25.5}),mk('asocial',0.7,null),mk('deep',0.958,null),
      row(474478,'give',0.7,[1],{count:100,moved:25.5}),row(474478,'asocial',0.7,[1],null),row(474478,'deep',0.958,[],null)];
    assert.equal(scoreGen1GiveRows(rowsN).verdict,'GEN1-GIVE-NOGO-V1');
    const rowsI=[mk('give',0.9,{count:0,moved:0}),mk('asocial',0.7,null),mk('deep',0.958,null),
      row(474478,'give',0.9,[1],{count:0,moved:0}),row(474478,'asocial',0.7,[1],null),row(474478,'deep',0.958,[],null)];
    assert.equal(scoreGen1GiveRows(rowsI).verdict,'GEN1-GIVE-INVALID-NOTRANSFER');
    const bad=[row(474469,'give',0.9,[1],{count:100,moved:25.5},'aaa','bbb'),row(474469,'asocial',0.7,[1,2],null),row(474469,'deep',0.958,[],null),
      row(474478,'give',0.9,[1],{count:100,moved:25.5}),row(474478,'asocial',0.7,[1,2],null),row(474478,'deep',0.958,[],null)];
    assert.equal(scoreGen1GiveRows(bad).verdict,'INVALID');
  });
});
