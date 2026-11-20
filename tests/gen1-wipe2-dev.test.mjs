// GEN1-WIPE2 V1 fixtures (FROZEN docs/GEN1_WIPE2_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, zeroWeights
// wipe (zeros taste/actor/critic, keeps store), wipe2Rate/Toxin,
// split/cause reuse, scorer GO/NOGO/INCOMPLETE/INVALID branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gw2Bank,scoreGen1Wipe2Rows,causeSplit,wipe2SplitLosers,wipe2Rate,wipe2Toxin,meanToxin,
  GW2_FIXTURE_SEEDS,GW2_TRIAGE_SEEDS,GW2_ARMS,GW2_TRAIN_TICKS,
  GW2_PROBE_TICKS,GW2_PLACE_ENERGY} from '../scripts/gen1-wipe2-dev.mjs';
import {zeroWeights} from '../scripts/memory-reset-dev.mjs';

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

describe('gen1-wipe2-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1wipe-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gw2Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-wipe2-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GW2_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GW2_FIXTURE_SEEDS[0],474577);
    assert.deepEqual([...GW2_TRIAGE_SEEDS],[490199,490200,490201,490202,490203,490204,490205,490206,490207]);
    assert.ok(!GW2_FIXTURE_SEEDS.some(s=>GW2_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GW2_ARMS],['trainAB','aprobeT','intact','cleared','naive']);
    assert.equal(GW2_TRAIN_TICKS,512);assert.equal(GW2_PROBE_TICKS,256);assert.equal(GW2_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('zeroWeights wipes taste/actor/critic, keeps store',()=>{
    const st={weights:{taste:[1,2],actor:[3],critic:[4],slowTaste:[9]},store:{x:1}};
    zeroWeights(st);
    assert.deepEqual(st.weights.taste,[0,0]);
    assert.deepEqual(st.weights.actor,[0]);
    assert.deepEqual(st.weights.critic,[0]);
    assert.deepEqual(st.weights.slowTaste,[9]);
    assert.deepEqual(st.store,{x:1});
    assert.throws(()=>zeroWeights(null));
  });
  it('wipe2Rate/Toxin per-agent-tick',()=>{
    assert.equal(wipe2Rate({food:tx(2,4),agents:agents(2,[]),meteredTicks:100}),0.03);
    assert.equal(wipe2Toxin({toxin:tx(1,3),agents:agents(2,[]),meteredTicks:100}),0.02);
    assert.equal(wipe2Rate({}),null);assert.equal(wipe2Toxin(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents(5,[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(wipe2SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (intact beats naive, cleared does not)',()=>{
    const rows=[trow(474577,'a','b','c'),prow(474577,'aprobeT',0.9,0.03,0.005),prow(474577,'intact',0.9,0.03,0.005),
      prow(474577,'cleared',0.7,0.02,0.005),prow(474577,'naive',0.7,0.02,0.005),
      trow(474586,'a','b','c'),prow(474586,'aprobeT',0.9,0.03,0.005),prow(474586,'intact',0.9,0.03,0.005),
      prow(474586,'cleared',0.7,0.02,0.005),prow(474586,'naive',0.7,0.02,0.005)];
    const v=scoreGen1Wipe2Rows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-WIPE2-GO-V1');
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const mk=(iR,cR)=>[trow(474577,'a','b','c'),prow(474577,'aprobeT',0.9,0.03,0.005),prow(474577,'intact',0.8,iR,0.005),
      prow(474577,'cleared',0.7,cR,0.005),prow(474577,'naive',0.7,0.02,0.005),
      trow(474586,'a','b','c'),prow(474586,'aprobeT',0.9,0.03,0.005),prow(474586,'intact',0.8,iR,0.005),
      prow(474586,'cleared',0.7,cR,0.005),prow(474586,'naive',0.7,0.02,0.005)];
    assert.equal(scoreGen1Wipe2Rows(mk(0.03,0.03)).verdict,'GEN1-WIPE2-NOGO-V1');
    assert.equal(scoreGen1Wipe2Rows(mk(0.02,0.015)).verdict,'GEN1-WIPE2-NOGO-V1');
    const mkN=[trow(474577,'a','b','c'),prow(474577,'aprobeT',0.7,0.02,0.005),prow(474577,'intact',0.7,0.02,0.005),
      prow(474577,'cleared',0.7,0.02,0.005),prow(474577,'naive',0.7,0.02,0.005),
      trow(474586,'a','b','c'),prow(474586,'aprobeT',0.7,0.02,0.005),prow(474586,'intact',0.7,0.02,0.005),
      prow(474586,'cleared',0.7,0.02,0.005),prow(474586,'naive',0.7,0.02,0.005)];
    assert.equal(scoreGen1Wipe2Rows(mkN).verdict,'GEN1-WIPE2-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474577,'a','a','c'),prow(474577,'aprobeT',0.9,0.03,0.005),prow(474577,'intact',0.9,0.03,0.005),
      prow(474577,'cleared',0.7,0.02,0.005),prow(474577,'naive',0.7,0.02,0.005),
      trow(474586,'a','a','c'),prow(474586,'aprobeT',0.9,0.03,0.005),prow(474586,'intact',0.9,0.03,0.005),
      prow(474586,'cleared',0.7,0.02,0.005),prow(474586,'naive',0.7,0.02,0.005)];
    assert.equal(scoreGen1Wipe2Rows(rowsN).verdict,'GEN1-WIPE2-INVALID-NOLEARN');
    const bad=[trow(474577,'a','b','c')];
    assert.equal(scoreGen1Wipe2Rows(bad).verdict,'INVALID');
  });
});
