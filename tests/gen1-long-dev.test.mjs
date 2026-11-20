// GEN1-LONG V1 fixtures (FROZEN docs/GEN1_LONG_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, zeroWeights
// wipe (zeros taste/actor/critic, keeps store), longRate/Toxin,
// split/cause reuse, scorer GO/NOGO/INCOMPLETE/INVALID branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {glhBank,scoreGen1LongRows,causeSplit,longSplitLosers,longRate,longToxin,meanToxin,
  GLH_FIXTURE_SEEDS,GLH_TRIAGE_SEEDS,GLH_ARMS,GLH_TRAIN_TICKS,
  GLH_PROBE_TICKS,GLH_PLACE_ENERGY} from '../scripts/gen1-long-dev.mjs';
import {zeroWeights} from '../scripts/memory-reset-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const prow=(seed,arm,surv,rate,tox,diedIds=[])=>{const {food,cost}=foodcost(24,rate,256);
  const toxin={};for(let i=0;i<24;i++)toxin[i]=tox*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,
  cost,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,diedIds),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-long-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1long-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=glhBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-long-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GLH_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GLH_FIXTURE_SEEDS[0],474595);
    assert.deepEqual([...GLH_TRIAGE_SEEDS],[490208,490209,490210,490211,490212,490213,490214,490215,490216]);
    assert.ok(!GLH_FIXTURE_SEEDS.some(s=>GLH_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GLH_ARMS],['trainAB','aprobeT','intact','cleared','naive']);
    assert.equal(GLH_TRAIN_TICKS,512);assert.equal(GLH_PROBE_TICKS,1792);assert.equal(GLH_PLACE_ENERGY,48);
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
  it('longRate/Toxin per-agent-tick',()=>{
    assert.equal(longRate({food:tx(2,4),agents:agents(2,[]),meteredTicks:100}),0.03);
    assert.equal(longToxin({toxin:tx(1,3),agents:agents(2,[]),meteredTicks:100}),0.02);
    assert.equal(longRate({}),null);assert.equal(longToxin(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents(5,[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(longSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (rate + survival wipe pattern)',()=>{
    const rows=[trow(474595,'a','b','c'),prow(474595,'aprobeT',0.9,0.03,0.005,[9]),prow(474595,'intact',0.9,0.03,0.005,[0]),
      prow(474595,'cleared',0.7,0.02,0.005,[4,5]),prow(474595,'naive',0.7,0.02,0.005,[1,2,3]),
      trow(474604,'a','b','c'),prow(474604,'aprobeT',0.9,0.03,0.005,[9]),prow(474604,'intact',0.9,0.03,0.005,[0]),
      prow(474604,'cleared',0.7,0.02,0.005,[4,5]),prow(474604,'naive',0.7,0.02,0.005,[1,2,3])];
    const v=scoreGen1LongRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-LONG-GO-V1');
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const mk=(iR,cR,iD,nD)=>[trow(474595,'a','b','c'),prow(474595,'aprobeT',0.9,0.03,0.005,[9]),prow(474595,'intact',0.8,iR,0.005,iD),
      prow(474595,'cleared',0.7,cR,0.005,[4,5]),prow(474595,'naive',0.7,0.02,0.005,nD),
      trow(474604,'a','b','c'),prow(474604,'aprobeT',0.9,0.03,0.005,[9]),prow(474604,'intact',0.8,iR,0.005,iD),
      prow(474604,'cleared',0.7,cR,0.005,[4,5]),prow(474604,'naive',0.7,0.02,0.005,nD)];
    assert.equal(scoreGen1LongRows(mk(0.03,0.03,[0],[1,2])).verdict,'GEN1-LONG-NOGO-V1');
    assert.equal(scoreGen1LongRows(mk(0.02,0.015,[0],[1,2])).verdict,'GEN1-LONG-NOGO-V1');
    assert.equal(scoreGen1LongRows(mk(0.03,0.02,[1,2],[0])).verdict,'GEN1-LONG-NOGO-V1');
    const mkN=[trow(474595,'a','b','c'),prow(474595,'aprobeT',0.7,0.02,0.005),prow(474595,'intact',0.7,0.02,0.005),
      prow(474595,'cleared',0.7,0.02,0.005),prow(474595,'naive',0.7,0.02,0.005),
      trow(474604,'a','b','c'),prow(474604,'aprobeT',0.7,0.02,0.005),prow(474604,'intact',0.7,0.02,0.005),
      prow(474604,'cleared',0.7,0.02,0.005),prow(474604,'naive',0.7,0.02,0.005)];
    assert.equal(scoreGen1LongRows(mkN).verdict,'GEN1-LONG-INCOMPLETE-NOSKILL');
    const mkE=[trow(474595,'a','b','c'),prow(474595,'aprobeT',0.9,0.03,0.005),prow(474595,'intact',0.9,0.03,0.005),
      prow(474595,'cleared',0.7,0.02,0.005),prow(474595,'naive',0.7,0.02,0.005),
      trow(474604,'a','b','c'),prow(474604,'aprobeT',0.9,0.03,0.005),prow(474604,'intact',0.9,0.03,0.005),
      prow(474604,'cleared',0.7,0.02,0.005),prow(474604,'naive',0.7,0.02,0.005)];
    assert.equal(scoreGen1LongRows(mkE).verdict,'GEN1-LONG-INCOMPLETE-NODEATHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474595,'a','a','c'),prow(474595,'aprobeT',0.9,0.03,0.005),prow(474595,'intact',0.9,0.03,0.005),
      prow(474595,'cleared',0.7,0.02,0.005),prow(474595,'naive',0.7,0.02,0.005),
      trow(474604,'a','a','c'),prow(474604,'aprobeT',0.9,0.03,0.005),prow(474604,'intact',0.9,0.03,0.005),
      prow(474604,'cleared',0.7,0.02,0.005),prow(474604,'naive',0.7,0.02,0.005)];
    assert.equal(scoreGen1LongRows(rowsN).verdict,'GEN1-LONG-INVALID-NOLEARN');
    const bad=[trow(474595,'a','b','c')];
    assert.equal(scoreGen1LongRows(bad).verdict,'INVALID');
  });
});
