// GEN1-BEST V1 fixtures (FROZEN docs/GEN1_BEST_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers on fakes, scorer GO/NOGO/FLOOR/INCOMPLETE/INVALID branches
// (best gaps per-pair both legs, matmix descriptive, bestSrc
// provenance), constants guard.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1BestRows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  GBE_FIXTURE_SEEDS,GBE_TRIAGE_SEEDS,GBE_ARMS,GBE_TRAIN_TICKS,
  GBE_PROBE_TICKS,GBE_PLACE_ENERGY,GBE_MIN_OFFSPRING} from '../scripts/gen1-best-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,900);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*900;
  return {history:{seed},arm,stage:'colony',frozen:true,survival:surv,meteredTicks:900,toxin,food,cost,
  energyCurve:[],series:[],agents:agents([0,1,2,3,...offIds],offDied),
  founders:[0,1,2,3],vt:arm==='best'?'copybest':(arm==='matmix'?'maternal':'none'),bestSrc:arm==='best'?{id:'1',trained:true}:null,trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:900,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-best-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1best-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-best-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GBE_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GBE_FIXTURE_SEEDS[0],475441);
    assert.deepEqual([...GBE_TRIAGE_SEEDS],[490631,490632,490633,490634,490635,490636,490637,490638,490639]);
    assert.ok(!GBE_FIXTURE_SEEDS.some(s=>GBE_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GBE_ARMS],['trainAB','skillT','skillN','best','matmix','naivekid']);
    assert.equal(GBE_TRAIN_TICKS,512);assert.equal(GBE_PROBE_TICKS,900);assert.equal(GBE_PLACE_ENERGY,48);
    assert.equal(GBE_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers split founders from offspring + fecundity source field',()=>{
    const r=mkcol(475441,'best',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(offspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(offspringSurvival(r),4/6);
    assert.ok(Math.abs(offspringRate(r)-0.03)<1e-9);
    assert.equal(r.vt,'copybest');
    assert.deepEqual(r.bestSrc,{id:'1',trained:true});
    assert.equal(offspringIds(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(heirSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:900}).losers,2);
  });
  it('scorer GO branch (copybest holds de-censored both pairs)',()=>{
    const off=[10,11,12,13,14,15];
    const mk=(bDied,nDied,bR,nR)=>[trow(475441,'a','b','c'),mkskill(475441,'skillT',0.9,0.03),mkskill(475441,'skillN',0.7,0.02),
      mkcol(475441,'best',0.5,off,bDied,bR),mkcol(475441,'matmix',0.5,off,[10],0.010),mkcol(475441,'naivekid',0.4,off,nDied,nR),
      trow(475450,'a','b','c'),mkskill(475450,'skillT',0.9,0.03),mkskill(475450,'skillN',0.7,0.02),
      mkcol(475450,'best',0.5,off,bDied,bR),mkcol(475450,'matmix',0.5,off,[10],0.010),mkcol(475450,'naivekid',0.4,off,nDied,nR)];
    const v=scoreGen1BestRows(mk([10],[10,11,12,13],0.009,0.002));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BEST-GO-V1');
    assert.deepEqual(v.bestGap.survPairs,[0.5,0.5]);
    assert.ok(v.bestGap.intakePairs.every(g=>Math.abs(g-0.006)<1e-3));
    assert.equal(v.offspringN.best,12);
    assert.ok(Array.isArray(v.bestSrc)&&v.bestSrc.length===2);
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15];
    const mk=(bDied,nDied,mDied)=>[trow(475441,'a','b','c'),mkskill(475441,'skillT',0.9,0.03),mkskill(475441,'skillN',0.7,0.02),
      mkcol(475441,'best',0.5,off,bDied,0.009),mkcol(475441,'matmix',0.5,off,mDied,0.010),mkcol(475441,'naivekid',0.4,off,nDied,0.002),
      trow(475450,'a','b','c'),mkskill(475450,'skillT',0.9,0.03),mkskill(475450,'skillN',0.7,0.02),
      mkcol(475450,'best',0.5,off,bDied,0.009),mkcol(475450,'matmix',0.5,off,mDied,0.010),mkcol(475450,'naivekid',0.4,off,nDied,0.002)];
    assert.equal(scoreGen1BestRows(mk([10,11],[10,11],[10])).verdict,'GEN1-BEST-NOGO-V1');
    assert.equal(scoreGen1BestRows(mk([10,11],[10,11],[10,11,12,13,14,15,16,17])).verdict,'GEN1-BEST-FLOOR-V1');
    const mkN=[trow(475441,'a','b','c'),mkskill(475441,'skillT',0.7,0.02),mkskill(475441,'skillN',0.7,0.02),
      mkcol(475441,'best',0.5,off,[10,11],0.009),mkcol(475441,'matmix',0.5,off,[10],0.010),mkcol(475441,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475450,'a','b','c'),mkskill(475450,'skillT',0.7,0.02),mkskill(475450,'skillN',0.7,0.02),
      mkcol(475450,'best',0.5,off,[10,11],0.009),mkcol(475450,'matmix',0.5,off,[10],0.010),mkcol(475450,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    assert.equal(scoreGen1BestRows(mkN).verdict,'GEN1-BEST-INCOMPLETE-NOSKILL');
    const mkB=[trow(475441,'a','b','c'),mkskill(475441,'skillT',0.9,0.03),mkskill(475441,'skillN',0.7,0.02),
      mkcol(475441,'best',0.5,[10],[10],0.009),mkcol(475441,'matmix',0.5,[10],[10],0.010),mkcol(475441,'naivekid',0.4,[10],[10],0.002),
      trow(475450,'a','b','c'),mkskill(475450,'skillT',0.9,0.03),mkskill(475450,'skillN',0.7,0.02),
      mkcol(475450,'best',0.5,[10],[10],0.009),mkcol(475450,'matmix',0.5,[10],[10],0.010),mkcol(475450,'naivekid',0.4,[10],[10],0.002)];
    assert.equal(scoreGen1BestRows(mkB).verdict,'GEN1-BEST-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15];
    const rowsN=[trow(475441,'a','a','c'),mkskill(475441,'skillT',0.9,0.03),mkskill(475441,'skillN',0.7,0.02),
      mkcol(475441,'best',0.5,off,[10,11],0.009),mkcol(475441,'matmix',0.5,off,[10],0.010),mkcol(475441,'naivekid',0.4,off,[10,11],0.002),
      trow(475450,'a','a','c'),mkskill(475450,'skillT',0.9,0.03),mkskill(475450,'skillN',0.7,0.02),
      mkcol(475450,'best',0.5,off,[10,11],0.009),mkcol(475450,'matmix',0.5,off,[10],0.010),mkcol(475450,'naivekid',0.4,off,[10,11],0.002)];
    assert.equal(scoreGen1BestRows(rowsN).verdict,'GEN1-BEST-INVALID-NOLEARN');
    const bad=[trow(475441,'a','b','c')];
    assert.equal(scoreGen1BestRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GBE_TRAIN_TICKS===512&&GBE_PROBE_TICKS===900&&GBE_MIN_OFFSPRING===4);
  });
});
