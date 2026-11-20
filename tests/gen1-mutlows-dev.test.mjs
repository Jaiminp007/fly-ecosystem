// GEN1-MUTLOWS V1 fixtures (FROZEN docs/GEN1_HEIR_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers (non-founder split/survival/rate on fakes), split/cause
// reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/INCOMPLETE-LOWBIRTHS/
// INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1MutlowsRows,survivalFraction,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  GMW_FIXTURE_SEEDS,GMW_TRIAGE_SEEDS,GMW_ARMS,GMW_TRAIN_TICKS,
  GMW_PROBE_TICKS,GMW_PLACE_ENERGY,GMW_MIN_OFFSPRING,GMW_MUT_NOISE} from '../scripts/gen1-mutlows-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='naivekid'?'none':'maternal',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-mutlows-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1heir-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-mutlows-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GMW_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GMW_FIXTURE_SEEDS[0],475189);
    assert.deepEqual([...GMW_TRIAGE_SEEDS],[490505,490506,490507,490508,490509,490510,490511,490512,490513]);
    assert.ok(!GMW_FIXTURE_SEEDS.some(s=>GMW_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GMW_ARMS],['trainAB','skillT','skillN','copy','mut01','naivekid']);
    assert.equal(GMW_TRAIN_TICKS,512);assert.equal(GMW_PROBE_TICKS,900);assert.equal(GMW_PLACE_ENERGY,48);
    assert.equal(GMW_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(475189,'copy',0.5,[10,11,12,13,14,15],[10,11],0.03);
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
  it('scorer GO branch (mut wins both pairs on survival + intake)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rows=[trow(475189,'a','b','c'),mkskill(475189,'skillT',0.9,0.03),mkskill(475189,'skillN',0.7,0.02),
      mkcol(475189,'copy',0.5,off,[10],0.010),mkcol(475189,'mut01',0.5,off,[10,11],0.009),mkcol(475189,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475198,'a','b','c'),mkskill(475198,'skillT',0.9,0.03),mkskill(475198,'skillN',0.7,0.02),
      mkcol(475198,'copy',0.5,off,[10],0.010),mkcol(475198,'mut01',0.5,off,[10,11],0.009),mkcol(475198,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    const v=scoreGen1MutlowsRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-MUTLOWS-GO-V1');
    assert.deepEqual(v.mutGap.survPairs,[0.5,0.5]);
    assert.ok(v.mutGap.intakePairs.every(g=>Math.abs(g-0.0071)<1e-4));
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(mDied,nDied,cDied)=>[trow(475189,'a','b','c'),mkskill(475189,'skillT',0.9,0.03),mkskill(475189,'skillN',0.7,0.02),
      mkcol(475189,'copy',0.5,off,cDied,0.010),mkcol(475189,'mut01',0.5,off,mDied,0.009),mkcol(475189,'naivekid',0.5,off,nDied,0.002),
      trow(475198,'a','b','c'),mkskill(475198,'skillT',0.9,0.03),mkskill(475198,'skillN',0.7,0.02),
      mkcol(475198,'copy',0.5,off,cDied,0.010),mkcol(475198,'mut01',0.5,off,mDied,0.009),mkcol(475198,'naivekid',0.5,off,nDied,0.002)];
    assert.equal(scoreGen1MutlowsRows(mk([10,11],[10,11],[10])).verdict,'GEN1-MUTLOWS-NOGO-V1');
    assert.equal(scoreGen1MutlowsRows(mk([10,11],[10,11],[10,11,12,13,14,15,16,17])).verdict,'GEN1-MUTLOWS-FLOOR-V1');
    const mkN=[trow(475189,'a','b','c'),mkskill(475189,'skillT',0.7,0.02),mkskill(475189,'skillN',0.7,0.02),
      mkcol(475189,'copy',0.5,off,[10],0.010),mkcol(475189,'mut01',0.5,off,[10,11],0.009),mkcol(475189,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475198,'a','b','c'),mkskill(475198,'skillT',0.7,0.02),mkskill(475198,'skillN',0.7,0.02),
      mkcol(475198,'copy',0.5,off,[10],0.010),mkcol(475198,'mut01',0.5,off,[10,11],0.009),mkcol(475198,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    assert.equal(scoreGen1MutlowsRows(mkN).verdict,'GEN1-MUTLOWS-INCOMPLETE-NOSKILL');
    const mkB=[trow(475189,'a','b','c'),mkskill(475189,'skillT',0.9,0.03),mkskill(475189,'skillN',0.7,0.02),
      mkcol(475189,'copy',0.5,[10],[10],0.010),mkcol(475189,'mut01',0.5,[10],[10],0.009),mkcol(475189,'naivekid',0.4,[10],[10],0.002),
      trow(475198,'a','b','c'),mkskill(475198,'skillT',0.9,0.03),mkskill(475198,'skillN',0.7,0.02),
      mkcol(475198,'copy',0.5,[10],[10],0.010),mkcol(475198,'mut01',0.5,[10],[10],0.009),mkcol(475198,'naivekid',0.4,[10],[10],0.002)];
    assert.equal(scoreGen1MutlowsRows(mkB).verdict,'GEN1-MUTLOWS-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(475189,'a','a','c'),mkskill(475189,'skillT',0.9,0.03),mkskill(475189,'skillN',0.7,0.02),
      mkcol(475189,'copy',0.5,[10,11],[10],0.010),mkcol(475189,'mut01',0.5,[10,11],[10],0.009),mkcol(475189,'naivekid',0.4,[10,11],[10],0.002),
      trow(475198,'a','a','c'),mkskill(475198,'skillT',0.9,0.03),mkskill(475198,'skillN',0.7,0.02),
      mkcol(475198,'copy',0.5,[10,11],[10],0.010),mkcol(475198,'mut01',0.5,[10,11],[10],0.009),mkcol(475198,'naivekid',0.4,[10,11],[10],0.002)];
    assert.equal(scoreGen1MutlowsRows(rowsN).verdict,'GEN1-MUTLOWS-INVALID-NOLEARN');
    const bad=[trow(475189,'a','b','c')];
    assert.equal(scoreGen1MutlowsRows(bad).verdict,'INVALID');
  });
  it('survivalFraction counts founders only (newborn-aware)',()=>{
    const fake={founderIds:[0,1,2,3],world:{flies:[{id:0},{id:2},{id:9},{id:10}]}};
    assert.equal(survivalFraction(fake),0.5);
    assert.equal(survivalFraction({founderIds:[0,1],world:{flies:[{id:0},{id:1}]}}),1);
  });
  it('constants guard the design',()=>{
    assert.ok(GMW_TRAIN_TICKS===512&&GMW_PROBE_TICKS===900&&GMW_MIN_OFFSPRING===4);
    assert.ok(GMW_MUT_NOISE===0.01&&GMW_ARMS.includes('mut01'));
  });
});
