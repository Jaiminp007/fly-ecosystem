// GEN1-HEIR V1 fixtures (FROZEN docs/GEN1_HEIR_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers (non-founder split/survival/rate on fakes), split/cause
// reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/INCOMPLETE-LOWBIRTHS/
// INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1HeirRows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  GH_FIXTURE_SEEDS,GH_TRIAGE_SEEDS,GH_ARMS,GH_TRAIN_TICKS,
  GH_PROBE_TICKS,GH_PLACE_ENERGY,GH_MIN_OFFSPRING} from '../scripts/gen1-heir-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,1792);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*1792;
  return {history:{seed},arm,stage:'colony',frozen:true,survival:surv,meteredTicks:1792,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3,...offIds],offDied),
  founders:[0,1,2,3],vt:arm==='copy'?'maternal':'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-heir-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1heir-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-heir-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GH_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GH_FIXTURE_SEEDS[0],474631);
    assert.deepEqual([...GH_TRIAGE_SEEDS],[490226,490227,490228,490229,490230,490231,490232,490233,490234]);
    assert.ok(!GH_FIXTURE_SEEDS.some(s=>GH_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GH_ARMS],['trainAB','skillT','skillN','copy','naivekid']);
    assert.equal(GH_TRAIN_TICKS,512);assert.equal(GH_PROBE_TICKS,1792);assert.equal(GH_PLACE_ENERGY,48);
    assert.equal(GH_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(474631,'copy',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(offspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(offspringSurvival(r),4/6);
    assert.ok(Math.abs(offspringRate(r)-0.03)<1e-9);
    assert.equal(offspringIds(null),null);
    assert.equal(offspringSurvival({agents:agents([0,1],[]),founders:[0,1]}),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(heirSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (copied skill saves offspring)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rows=[trow(474631,'a','b','c'),mkskill(474631,'skillT',0.9,0.03),mkskill(474631,'skillN',0.7,0.02),
      mkcol(474631,'copy',0.5,off,[10,11],0.03),mkcol(474631,'naivekid',0.4,off,[10,11,12,13,14,15],0.02),
      trow(474640,'a','b','c'),mkskill(474640,'skillT',0.9,0.03),mkskill(474640,'skillN',0.7,0.02),
      mkcol(474640,'copy',0.5,off,[10,11],0.03),mkcol(474640,'naivekid',0.4,off,[10,11,12,13,14,15],0.02)];
    const v=scoreGen1HeirRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-HEIR-GO-V1');
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(cDied,nDied)=>[trow(474631,'a','b','c'),mkskill(474631,'skillT',0.9,0.03),mkskill(474631,'skillN',0.7,0.02),
      mkcol(474631,'copy',0.5,off,cDied,0.025),mkcol(474631,'naivekid',0.5,off,nDied,0.025),
      trow(474640,'a','b','c'),mkskill(474640,'skillT',0.9,0.03),mkskill(474640,'skillN',0.7,0.02),
      mkcol(474640,'copy',0.5,off,cDied,0.025),mkcol(474640,'naivekid',0.5,off,nDied,0.025)];
    assert.equal(scoreGen1HeirRows(mk([10,11],[10,11])).verdict,'GEN1-HEIR-NOGO-V1');
    const mkN=[trow(474631,'a','b','c'),mkskill(474631,'skillT',0.7,0.02),mkskill(474631,'skillN',0.7,0.02),
      mkcol(474631,'copy',0.5,off,[10,11],0.03),mkcol(474631,'naivekid',0.4,off,[10,11,12,13,14,15],0.02),
      trow(474640,'a','b','c'),mkskill(474640,'skillT',0.7,0.02),mkskill(474640,'skillN',0.7,0.02),
      mkcol(474640,'copy',0.5,off,[10,11],0.03),mkcol(474640,'naivekid',0.4,off,[10,11,12,13,14,15],0.02)];
    assert.equal(scoreGen1HeirRows(mkN).verdict,'GEN1-HEIR-INCOMPLETE-NOSKILL');
    const mkB=[trow(474631,'a','b','c'),mkskill(474631,'skillT',0.9,0.03),mkskill(474631,'skillN',0.7,0.02),
      mkcol(474631,'copy',0.5,[10,11],[10],0.03),mkcol(474631,'naivekid',0.4,[10,11],[10],0.02),
      trow(474640,'a','b','c'),mkskill(474640,'skillT',0.9,0.03),mkskill(474640,'skillN',0.7,0.02),
      mkcol(474640,'copy',0.5,[10,11],[10],0.03),mkcol(474640,'naivekid',0.4,[10,11],[10],0.02)];
    assert.equal(scoreGen1HeirRows(mkB).verdict,'GEN1-HEIR-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474631,'a','a','c'),mkskill(474631,'skillT',0.9,0.03),mkskill(474631,'skillN',0.7,0.02),
      mkcol(474631,'copy',0.5,[10,11],[10],0.03),mkcol(474631,'naivekid',0.4,[10,11],[10],0.02),
      trow(474640,'a','a','c'),mkskill(474640,'skillT',0.9,0.03),mkskill(474640,'skillN',0.7,0.02),
      mkcol(474640,'copy',0.5,[10,11],[10],0.03),mkcol(474640,'naivekid',0.4,[10,11],[10],0.02)];
    assert.equal(scoreGen1HeirRows(rowsN).verdict,'GEN1-HEIR-INVALID-NOLEARN');
    const bad=[trow(474631,'a','b','c')];
    assert.equal(scoreGen1HeirRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GH_TRAIN_TICKS===512&&GH_PROBE_TICKS===1792&&GH_MIN_OFFSPRING===6);
  });
});
