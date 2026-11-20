// GEN1-MIX V1 fixtures (FROZEN docs/GEN1_MIX_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, side-split
// helpers (naiveDeathFrac/skilledDeathFrac/subRate on fakes),
// split/cause reuse, scorer GO/NOGO/INCOMPLETE/INVALID branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmxBank,scoreGen1MixRows,causeSplit,mixSplitLosers,mixRate,mixToxin,naiveDeathFrac,skilledDeathFrac,subRate,meanToxin,
  GMX_FIXTURE_SEEDS,GMX_TRIAGE_SEEDS,GMX_ARMS,GMX_TRAIN_TICKS,
  GMX_PROBE_TICKS,GMX_PLACE_ENERGY,GMX_MIX_FRAC} from '../scripts/gen1-mix-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const prow=(seed,arm,surv,rate,tox,diedIds,side)=>{const {food,cost}=foodcost(24,rate,1792);
  const toxin={};for(let i=0;i<24;i++)toxin[i]=tox*1792;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:1792,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,diedIds),side:side??null,
  trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:diedIds.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const evenOdd24=()=>{const s={};for(let i=0;i<24;i++)s[i]=i%2===0?'skilled':'naive';return s;};

describe('gen1-mix-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1mix-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmxBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-mix-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GMX_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GMX_FIXTURE_SEEDS[0],474613);
    assert.deepEqual([...GMX_TRIAGE_SEEDS],[490217,490218,490219,490220,490221,490222,490223,490224,490225]);
    assert.ok(!GMX_FIXTURE_SEEDS.some(s=>GMX_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GMX_ARMS],['trainAB','mixed','skilled','naive']);
    assert.equal(GMX_TRAIN_TICKS,512);assert.equal(GMX_PROBE_TICKS,1792);assert.equal(GMX_PLACE_ENERGY,48);
    assert.equal(GMX_MIX_FRAC,0.15);
    rmSync(dir,{recursive:true,force:true});
  });
  it('side-split helpers on fakes (mixed vs pure)',()=>{
    const side=evenOdd24();
    const r={agents:agents(24,[1,3,5]),food:foodcost(24,0.03,1792).food,meteredTicks:1792,side};
    assert.equal(naiveDeathFrac(r),3/12);
    assert.equal(skilledDeathFrac(r),0);
    assert.ok(Math.abs(subRate(r,'naive')-0.03)<1e-9);
    assert.equal(naiveDeathFrac({agents:agents(24,[0,1])}),2/24);
    assert.equal(naiveDeathFrac(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents(5,[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(mixSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
    assert.ok(Number.isFinite(mixRate({food:tx(1,1),agents:agents(2,[]),meteredTicks:100})));
  });
  it('scorer GO branch (composition moves naive mortality)',()=>{
    const side=evenOdd24();
    const rows=[trow(474613,'a','b','c'),prow(474613,'mixed',0.5,0.02,0.005,[1,3],side),prow(474613,'skilled',0.9,0.03,0.005,[0]),
      prow(474613,'naive',0.5,0.02,0.005,[0,1,2,3,4,5,6,7]),
      trow(474622,'a','b','c'),prow(474622,'mixed',0.5,0.02,0.005,[1,3],side),prow(474622,'skilled',0.9,0.03,0.005,[0]),
      prow(474622,'naive',0.5,0.02,0.005,[0,1,2,3,4,5,6,7])];
    const v=scoreGen1MixRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-MIX-GO-V1');
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const side=evenOdd24();
    const mk=(nMdie,nAdie)=>[trow(474613,'a','b','c'),prow(474613,'mixed',0.7,0.02,0.005,nMdie,side),prow(474613,'skilled',0.9,0.03,0.005,[0]),
      prow(474613,'naive',0.7,0.02,0.005,nAdie),
      trow(474622,'a','b','c'),prow(474622,'mixed',0.7,0.02,0.005,nMdie,side),prow(474622,'skilled',0.9,0.03,0.005,[0]),
      prow(474622,'naive',0.7,0.02,0.005,nAdie)];
    assert.equal(scoreGen1MixRows(mk([1,3],[1,3,5])).verdict,'GEN1-MIX-NOGO-V1');
    const mkN=[trow(474613,'a','b','c'),prow(474613,'mixed',0.5,0.02,0.005,[1,3],side),prow(474613,'skilled',0.7,0.02,0.005,[0]),
      prow(474613,'naive',0.7,0.02,0.005,[1,3,5]),
      trow(474622,'a','b','c'),prow(474622,'mixed',0.5,0.02,0.005,[1,3],side),prow(474622,'skilled',0.7,0.02,0.005,[0]),
      prow(474622,'naive',0.7,0.02,0.005,[1,3,5])];
    assert.equal(scoreGen1MixRows(mkN).verdict,'GEN1-MIX-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474613,'a','a','c'),prow(474613,'mixed',0.5,0.02,0.005,[1],evenOdd24()),prow(474613,'skilled',0.9,0.03,0.005,[0]),
      prow(474613,'naive',0.5,0.02,0.005,[1]),
      trow(474622,'a','a','c'),prow(474622,'mixed',0.5,0.02,0.005,[1],evenOdd24()),prow(474622,'skilled',0.9,0.03,0.005,[0]),
      prow(474622,'naive',0.5,0.02,0.005,[1])];
    assert.equal(scoreGen1MixRows(rowsN).verdict,'GEN1-MIX-INVALID-NOLEARN');
    const bad=[trow(474613,'a','b','c')];
    assert.equal(scoreGen1MixRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GMX_TRAIN_TICKS===512&&GMX_PROBE_TICKS===1792&&GMX_MIX_FRAC===0.15);
  });
});
