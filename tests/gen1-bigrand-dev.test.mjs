// GEN1-BIGRAND V1 fixtures (FROZEN docs/GEN1_GRAND_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers on fakes, split/cause reuse, scorer GO/NOGO/FLOOR/
// INCOMPLETE/INVALID branches (F2 gaps per-pair), constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1BigrandRows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  BGR_FIXTURE_SEEDS,BGR_TRIAGE_SEEDS,BGR_ARMS,BGR_TRAIN_TICKS,
  BGR_PROBE_TICKS,BGR_PLACE_ENERGY,BGR_MIN_OFFSPRING} from '../scripts/gen1-bigrand-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,1792);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*1792;
  const vt=arm==='F1naive'||arm==='F2naive'?'none':'copyconditional';
  return {history:{seed},arm,stage:'colony',frozen:true,survival:surv,meteredTicks:1792,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3,...offIds],offDied),
  founders:[0,1,2,3],vt,trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-bigrand-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1grand-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-bigrand-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...BGR_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(BGR_FIXTURE_SEEDS[0],475549);
    assert.deepEqual([...BGR_TRIAGE_SEEDS],[490685,490686,490687,490688,490689,490690,490691,490692,490693]);
    assert.ok(!BGR_FIXTURE_SEEDS.some(s=>BGR_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...BGR_ARMS],['trainAB','skillT','skillN','F1bi','F1naive','F2bi','F2naive']);
    assert.equal(BGR_TRAIN_TICKS,512);assert.equal(BGR_PROBE_TICKS,1792);assert.equal(BGR_PLACE_ENERGY,48);
    assert.equal(BGR_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(475549,'F1bi',0.5,[10,11,12,13,14,15],[10,11],0.03);
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
  it('scorer GO branch (F2 persists both pairs)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,cDied,nDied,cR,nR)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'F1bi',0.5,off,[10,11],0.03),mkcol(sd,'F1naive',0.4,off,[10,11,12,13,14,15],0.02),
      mkcol(sd,'F2bi',0.5,off,cDied,cR),mkcol(sd,'F2naive',0.4,off,nDied,nR)];
    const rows=[...mkF(475549,[10,11],[10,11,12,13,14,15],0.009,0.002),...mkF(475558,[10,11],[10,11,12,13,14,15],0.009,0.002)];
    const v=scoreGen1BigrandRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BIGRAND-GO-V1');
    assert.deepEqual(v.f2Gap.survPairs,[0.5,0.5]);
    assert.equal(v.f1N.bi,16);assert.equal(v.f2N.bi,16);
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(c2Died,n2Died)=>[trow(475549,'a','b','c'),mkskill(475549,'skillT',0.9,0.03),mkskill(475549,'skillN',0.7,0.02),
      mkcol(475549,'F1bi',0.5,off,[10,11],0.03),mkcol(475549,'F1naive',0.4,off,[10,11,12,13,14,15],0.02),
      mkcol(475549,'F2bi',0.5,off,c2Died,0.009),mkcol(475549,'F2naive',0.4,off,n2Died,0.002),
      trow(475558,'a','b','c'),mkskill(475558,'skillT',0.9,0.03),mkskill(475558,'skillN',0.7,0.02),
      mkcol(475558,'F1bi',0.5,off,[10,11],0.03),mkcol(475558,'F1naive',0.4,off,[10,11,12,13,14,15],0.02),
      mkcol(475558,'F2bi',0.5,off,c2Died,0.009),mkcol(475558,'F2naive',0.4,off,n2Died,0.002)];
    assert.equal(scoreGen1BigrandRows(mk([10,11],[10,11])).verdict,'GEN1-BIGRAND-NOGO-V1');
    assert.equal(scoreGen1BigrandRows(mk([10,11,12,13,14,15,16,17],[10,11])).verdict,'GEN1-BIGRAND-FLOOR-V1');
    const mkN=[trow(475549,'a','b','c'),mkskill(475549,'skillT',0.7,0.02),mkskill(475549,'skillN',0.7,0.02),
      mkcol(475549,'F1bi',0.5,off,[10,11],0.03),mkcol(475549,'F1naive',0.4,off,[10,11,12,13,14,15],0.02),
      mkcol(475549,'F2bi',0.5,off,[10,11],0.009),mkcol(475549,'F2naive',0.4,off,[10,11],0.002),
      trow(475558,'a','b','c'),mkskill(475558,'skillT',0.7,0.02),mkskill(475558,'skillN',0.7,0.02),
      mkcol(475558,'F1bi',0.5,off,[10,11],0.03),mkcol(475558,'F1naive',0.4,off,[10,11,12,13,14,15],0.02),
      mkcol(475558,'F2bi',0.5,off,[10,11],0.009),mkcol(475558,'F2naive',0.4,off,[10,11],0.002)];
    assert.equal(scoreGen1BigrandRows(mkN).verdict,'GEN1-BIGRAND-INCOMPLETE-NOSKILL');
    const mkB=[trow(475549,'a','b','c'),mkskill(475549,'skillT',0.9,0.03),mkskill(475549,'skillN',0.7,0.02),
      mkcol(475549,'F1bi',0.5,[10],[10],0.03),mkcol(475549,'F1naive',0.4,[10],[10],0.02),
      mkcol(475549,'F2bi',0.5,off,[10,11],0.009),mkcol(475549,'F2naive',0.4,off,[10,11],0.002),
      trow(475558,'a','b','c'),mkskill(475558,'skillT',0.9,0.03),mkskill(475558,'skillN',0.7,0.02),
      mkcol(475558,'F1bi',0.5,[10],[10],0.03),mkcol(475558,'F1naive',0.4,[10],[10],0.02),
      mkcol(475558,'F2bi',0.5,off,[10,11],0.009),mkcol(475558,'F2naive',0.4,off,[10,11],0.002)];
    assert.equal(scoreGen1BigrandRows(mkB).verdict,'GEN1-BIGRAND-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(475549,'a','a','c'),mkskill(475549,'skillT',0.9,0.03),mkskill(475549,'skillN',0.7,0.02),
      mkcol(475549,'F1bi',0.5,off,[10,11],0.03),mkcol(475549,'F1naive',0.4,off,[10,11,12,13,14,15],0.02),
      mkcol(475549,'F2bi',0.5,off,[10,11],0.009),mkcol(475549,'F2naive',0.4,off,[10,11],0.002),
      trow(475558,'a','a','c'),mkskill(475558,'skillT',0.9,0.03),mkskill(475558,'skillN',0.7,0.02),
      mkcol(475558,'F1bi',0.5,off,[10,11],0.03),mkcol(475558,'F1naive',0.4,off,[10,11,12,13,14,15],0.02),
      mkcol(475558,'F2bi',0.5,off,[10,11],0.009),mkcol(475558,'F2naive',0.4,off,[10,11],0.002)];
    assert.equal(scoreGen1BigrandRows(rowsN).verdict,'GEN1-BIGRAND-INVALID-NOLEARN');
    const bad=[trow(475549,'a','b','c')];
    assert.equal(scoreGen1BigrandRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(BGR_TRAIN_TICKS===512&&BGR_PROBE_TICKS===1792&&BGR_MIN_OFFSPRING===4);
  });
});
