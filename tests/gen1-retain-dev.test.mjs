// GEN1-RETAIN V1 fixtures (FROZEN docs/GEN1_RETAIN_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, retainRate/
// retainToxin, split/cause reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/
// INVALID-NOLEARN/INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {grtBank,scoreGen1RetainRows,causeSplit,retainSplitLosers,retainRate,retainToxin,meanToxin,
  GRT_FIXTURE_SEEDS,GRT_TRIAGE_SEEDS,GRT_ARMS,GRT_TRAIN_TICKS,
  GRT_PROBE_TICKS,GRT_PLACE_ENERGY} from '../scripts/gen1-retain-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const prow=(seed,arm,surv,rate,tox)=>{const {food,cost}=foodcost(24,rate,256);
  const toxin={};for(let i=0;i<24;i++)toxin[i]=tox*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,
  cost,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,[]),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-retain-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1retain-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=grtBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-retain-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GRT_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GRT_FIXTURE_SEEDS[0],474541);
    assert.deepEqual([...GRT_TRIAGE_SEEDS],[490181,490182,490183,490184,490185,490186,490187,490188,490189]);
    assert.ok(!GRT_FIXTURE_SEEDS.some(s=>GRT_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GRT_ARMS],['trainAB','aprobeT','aprobeN','bprobeT','bprobeN']);
    assert.equal(GRT_TRAIN_TICKS,512);assert.equal(GRT_PROBE_TICKS,256);assert.equal(GRT_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('retainRate/Toxin per-agent-tick',()=>{
    assert.equal(retainRate({food:tx(2,4),agents:agents(2,[]),meteredTicks:100}),0.03);
    assert.equal(retainToxin({toxin:tx(1,3),agents:agents(2,[]),meteredTicks:100}),0.02);
    assert.equal(retainRate({}),null);assert.equal(retainToxin(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents(5,[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(retainSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (A skill + post-B retains)',()=>{
    const rows=[trow(474541,'a','b','c'),prow(474541,'aprobeT',0.9,0.03,0.005),prow(474541,'aprobeN',0.7,0.02,0.005),
      prow(474541,'bprobeT',0.85,0.03,0.005),prow(474541,'bprobeN',0.7,0.02,0.005),
      trow(474550,'a','b','c'),prow(474550,'aprobeT',0.9,0.03,0.005),prow(474550,'aprobeN',0.7,0.02,0.005),
      prow(474550,'bprobeT',0.85,0.03,0.005),prow(474550,'bprobeN',0.7,0.02,0.005)];
    const v=scoreGen1RetainRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-RETAIN-GO-V1');
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const mk=(aR,bR)=>[trow(474541,'a','b','c'),prow(474541,'aprobeT',0.9,aR,0.005),prow(474541,'aprobeN',0.7,0.02,0.005),
      prow(474541,'bprobeT',0.5,bR,0.005),prow(474541,'bprobeN',0.7,0.02,0.005),
      trow(474550,'a','b','c'),prow(474550,'aprobeT',0.9,aR,0.005),prow(474550,'aprobeN',0.7,0.02,0.005),
      prow(474550,'bprobeT',0.5,bR,0.005),prow(474550,'bprobeN',0.7,0.02,0.005)];
    assert.equal(scoreGen1RetainRows(mk(0.03,0.02)).verdict,'GEN1-RETAIN-NOGO-V1');
    assert.equal(scoreGen1RetainRows(mk(0.02,0.02)).verdict,'GEN1-RETAIN-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474541,'a','a','c'),prow(474541,'aprobeT',0.9,0.03,0.005),prow(474541,'aprobeN',0.7,0.02,0.005),
      prow(474541,'bprobeT',0.85,0.03,0.005),prow(474541,'bprobeN',0.7,0.02,0.005),
      trow(474550,'a','a','c'),prow(474550,'aprobeT',0.9,0.03,0.005),prow(474550,'aprobeN',0.7,0.02,0.005),
      prow(474550,'bprobeT',0.85,0.03,0.005),prow(474550,'bprobeN',0.7,0.02,0.005)];
    assert.equal(scoreGen1RetainRows(rowsN).verdict,'GEN1-RETAIN-INVALID-NOLEARN');
    const bad=[trow(474541,'a','b','c')];
    assert.equal(scoreGen1RetainRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GRT_TRAIN_TICKS===512&&GRT_PROBE_TICKS===256);
  });
});
