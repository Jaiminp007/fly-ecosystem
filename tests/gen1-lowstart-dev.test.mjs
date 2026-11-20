// GEN1-LOWSTART V1 fixtures (FROZEN docs/GEN1_HEIR_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers (non-founder split/survival/rate on fakes), split/cause
// reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/INCOMPLETE-LOWBIRTHS/
// INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1LowstartRows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  GLS_FIXTURE_SEEDS,GLS_TRIAGE_SEEDS,GLS_ARMS,GLS_TRAIN_TICKS,
  GLS_PROBE_TICKS,GLS_PLACE_ENERGY,GLS_COLONY_ENERGY,GLS_MIN_OFFSPRING,GLS_MUT_NOISE} from '../scripts/gen1-lowstart-dev.mjs';

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

describe('gen1-lowstart-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1heir-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-lowstart-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GLS_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GLS_FIXTURE_SEEDS[0],475171);
    assert.deepEqual([...GLS_TRIAGE_SEEDS],[490496,490497,490498,490499,490500,490501,490502,490503,490504]);
    assert.ok(!GLS_FIXTURE_SEEDS.some(s=>GLS_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GLS_ARMS],['trainAB','skillT','skillN','copy','mut','naivekid']);
    assert.equal(GLS_TRAIN_TICKS,512);assert.equal(GLS_PROBE_TICKS,900);assert.equal(GLS_PLACE_ENERGY,48);
    assert.equal(GLS_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(475171,'copy',0.5,[10,11,12,13,14,15],[10,11],0.03);
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
  it('scorer GO branch (copy wins window both pairs)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rows=[trow(475171,'a','b','c'),mkskill(475171,'skillT',0.9,0.03),mkskill(475171,'skillN',0.7,0.02),
      mkcol(475171,'copy',0.5,off,[10],0.010),mkcol(475171,'mut',0.5,off,[10,11],0.009),mkcol(475171,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475180,'a','b','c'),mkskill(475180,'skillT',0.9,0.03),mkskill(475180,'skillN',0.7,0.02),
      mkcol(475180,'copy',0.5,off,[10],0.010),mkcol(475180,'mut',0.5,off,[10,11],0.009),mkcol(475180,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    const v=scoreGen1LowstartRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-LOWSTART-GO-V1');
    assert.deepEqual(v.copyGap.survPairs,[0.625,0.625]);
    assert.deepEqual(v.mutGap.survPairs,[0.5,0.5]);
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(mDied,nDied,cDied)=>[trow(475171,'a','b','c'),mkskill(475171,'skillT',0.9,0.03),mkskill(475171,'skillN',0.7,0.02),
      mkcol(475171,'copy',0.5,off,cDied,0.010),mkcol(475171,'mut',0.5,off,mDied,0.009),mkcol(475171,'naivekid',0.5,off,nDied,0.002),
      trow(475180,'a','b','c'),mkskill(475180,'skillT',0.9,0.03),mkskill(475180,'skillN',0.7,0.02),
      mkcol(475180,'copy',0.5,off,cDied,0.010),mkcol(475180,'mut',0.5,off,mDied,0.009),mkcol(475180,'naivekid',0.5,off,nDied,0.002)];
    assert.equal(scoreGen1LowstartRows(mk([10,11],[10,11],[10,11])).verdict,'GEN1-LOWSTART-NOGO-V1');
    assert.equal(scoreGen1LowstartRows(mk([10,11],[10,11],[10,11,12,13,14,15,16,17])).verdict,'GEN1-LOWSTART-FLOOR-V1');
    const mkN=[trow(475171,'a','b','c'),mkskill(475171,'skillT',0.7,0.02),mkskill(475171,'skillN',0.7,0.02),
      mkcol(475171,'copy',0.5,off,[10],0.010),mkcol(475171,'mut',0.5,off,[10,11],0.009),mkcol(475171,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475180,'a','b','c'),mkskill(475180,'skillT',0.7,0.02),mkskill(475180,'skillN',0.7,0.02),
      mkcol(475180,'copy',0.5,off,[10],0.010),mkcol(475180,'mut',0.5,off,[10,11],0.009),mkcol(475180,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    assert.equal(scoreGen1LowstartRows(mkN).verdict,'GEN1-LOWSTART-INCOMPLETE-NOSKILL');
    const mkB=[trow(475171,'a','b','c'),mkskill(475171,'skillT',0.9,0.03),mkskill(475171,'skillN',0.7,0.02),
      mkcol(475171,'copy',0.5,[10],[10],0.010),mkcol(475171,'mut',0.5,[10],[10],0.009),mkcol(475171,'naivekid',0.4,[10],[10],0.002),
      trow(475180,'a','b','c'),mkskill(475180,'skillT',0.9,0.03),mkskill(475180,'skillN',0.7,0.02),
      mkcol(475180,'copy',0.5,[10],[10],0.010),mkcol(475180,'mut',0.5,[10],[10],0.009),mkcol(475180,'naivekid',0.4,[10],[10],0.002)];
    assert.equal(scoreGen1LowstartRows(mkB).verdict,'GEN1-LOWSTART-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(475171,'a','a','c'),mkskill(475171,'skillT',0.9,0.03),mkskill(475171,'skillN',0.7,0.02),
      mkcol(475171,'copy',0.5,[10],[10],0.010),mkcol(475171,'mut',0.5,[10],[10],0.009),mkcol(475171,'naivekid',0.4,[10],[10],0.002),
      trow(475180,'a','a','c'),mkskill(475180,'skillT',0.9,0.03),mkskill(475180,'skillN',0.7,0.02),
      mkcol(475180,'copy',0.5,[10],[10],0.010),mkcol(475180,'mut',0.5,[10],[10],0.009),mkcol(475180,'naivekid',0.4,[10],[10],0.002)];
    assert.equal(scoreGen1LowstartRows(rowsN).verdict,'GEN1-LOWSTART-INVALID-NOLEARN');
    const bad=[trow(475171,'a','b','c')];
    assert.equal(scoreGen1LowstartRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GLS_TRAIN_TICKS===512&&GLS_PROBE_TICKS===900&&GLS_MIN_OFFSPRING===4);
    assert.ok(GLS_PLACE_ENERGY===48&&GLS_COLONY_ENERGY===10);
    assert.ok(GLS_MUT_NOISE===0.05&&GLS_ARMS.includes('mut'));
  });
});
