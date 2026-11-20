// GEN1-BIHOME V1 fixtures (FROZEN docs/GEN1_BIHOME_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, mixed-founder
// placement order, scorer GO/NOGO/NOGAP/INCOMPLETE/INVALID branches
// (bi gaps per-pair, copy descriptive), constants (incl. edge).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmhBank,scoreGen1BihomeRows,causeSplit,muthomeSplitLosers,muthomeRate,muthomeToxin,muthomeOffspringIds,muthomeOffspringSurvival,muthomeOffspringRate,probeIntake8s,meanToxin,
  BIH_FIXTURE_SEEDS,BIH_TRIAGE_SEEDS,BIH_ARMS,BIH_TRAIN_TICKS,
  BIH_PROBE_TICKS,BIH_SKILL_TICKS,BIH_APROBE_TICKS,BIH_BCR_TICKS,BIH_EDGE,BIH_PLACE_ENERGY,BIH_MIN_OFFSPRING} from '../scripts/gen1-bihome-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='colonyBi'?'biparental':(arm==='colonyCopy'?'maternal':'none'),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkstage=(seed,arm,ticks,rate,n=6)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,ticks);
  const toxin={};for(const id of ids)toxin[id]=0.005*ticks;
  return {history:{seed},arm,stage:arm.startsWith('post')||arm.startsWith('pre')?'aprobe':'bcrtrain',frozen:true,survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-bihome-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1bihome-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmhBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-bihome-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...BIH_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(BIH_FIXTURE_SEEDS[0],475369);
    assert.deepEqual([...BIH_TRIAGE_SEEDS],[490595,490596,490597,490598,490599,490600,490601,490602,490603]);
    assert.ok(!BIH_FIXTURE_SEEDS.some(s=>BIH_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...BIH_ARMS],['trainAB','skillT','skillN','colonyCopy','colonyBi','colonyNaive','preCopy','preBi','preNaive','bcrCopy','bcrBi','bcrNaive','postCopy','postBi','postNaive']);
    assert.equal(BIH_TRAIN_TICKS,512);assert.equal(BIH_PROBE_TICKS,1792);
    assert.equal(BIH_SKILL_TICKS,256);assert.equal(BIH_APROBE_TICKS,256);
    assert.equal(BIH_BCR_TICKS,1280);assert.equal(BIH_EDGE,0.002);
    assert.equal(BIH_PLACE_ENERGY,48);assert.equal(BIH_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('mothers are odd ids (sex 0) — placement order for the bi colony',()=>{
    assert.deepEqual([0,1,2,3,4,5].filter(i=>(i%2)===0).map(i=>i+1),[1,3,5]);
  });
  it('offspring helpers + side stats on fakes',()=>{
    const r=mkcol(475369,'colonyBi',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(muthomeOffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(muthomeOffspringSurvival(r),4/6);
    assert.ok(Math.abs(muthomeOffspringRate(r)-0.03)<1e-9);
    assert.equal(r.vt,'biparental');
    assert.ok(Math.abs(probeIntake8s(mkstage(475369,'postBi',256,0.006))-0.006)<1e-9);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('scorer GO branch (recombined edge survives gauntlet + return)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,preC,preB,preN,postC,postB,postN)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyCopy',0.5,off,[10,11],0.03),mkcol(sd,'colonyBi',0.5,off,[10,11],0.03),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(sd,'preCopy',256,preC),mkstage(sd,'preBi',256,preB),mkstage(sd,'preNaive',256,preN),
      mkstage(sd,'bcrCopy',1280,0.004),mkstage(sd,'bcrBi',1280,0.004),mkstage(sd,'bcrNaive',1280,0.001),
      mkstage(sd,'postCopy',256,postC),mkstage(sd,'postBi',256,postB),mkstage(sd,'postNaive',256,postN)];
    const v=scoreGen1BihomeRows([...mkF(475369,0.010,0.009,0.002,0.008,0.007,0.001),...mkF(475378,0.010,0.009,0.002,0.008,0.007,0.001)]);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BIHOME-GO-V1');
    assert.ok(Math.abs(v.biRetention.frac-0.86)<1e-9);
  });
  it('scorer NOGO/NOGAP branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,preC,preB,preN,postC,postB,postN)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyCopy',0.5,off,[10,11],0.03),mkcol(sd,'colonyBi',0.5,off,[10,11],0.03),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(sd,'preCopy',256,preC),mkstage(sd,'preBi',256,preB),mkstage(sd,'preNaive',256,preN),
      mkstage(sd,'bcrCopy',1280,0.004),mkstage(sd,'bcrBi',1280,0.004),mkstage(sd,'bcrNaive',1280,0.001),
      mkstage(sd,'postCopy',256,postC),mkstage(sd,'postBi',256,postB),mkstage(sd,'postNaive',256,postN)];
    const base=[...mkF(475369,0.010,0.009,0.002,0.008,0.007,0.001),...mkF(475378,0.010,0.009,0.002,0.008,0.007,0.001)];
    assert.equal(scoreGen1BihomeRows(base).verdict,'GEN1-BIHOME-GO-V1');
    const fixRows=(rows,preB,postB)=>rows.map(r=>r.arm==='preBi'?{...r,food:Object.fromEntries(Object.keys(r.food).map(id=>[id,preB*256]))}:r.arm==='postBi'?{...r,food:Object.fromEntries(Object.keys(r.food).map(id=>[id,postB*256]))}:r);
    assert.equal(scoreGen1BihomeRows(fixRows(base,0.009,0.003)).verdict,'GEN1-BIHOME-NOGO-V1');
    assert.equal(scoreGen1BihomeRows(fixRows(base,0.002,0.007)).verdict,'GEN1-BIHOME-INCOMPLETE-NOGAP');
  });
  it('scorer INCOMPLETE/INVALID branches (skill, births, no-learn)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,sT,sN)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,sT),mkskill(sd,'skillN',0.7,sN),
      mkcol(sd,'colonyCopy',0.5,off,[10,11],0.03),mkcol(sd,'colonyBi',0.5,off,[10,11],0.03),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(sd,'preCopy',256,0.010),mkstage(sd,'preBi',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcrCopy',1280,0.004),mkstage(sd,'bcrBi',1280,0.004),mkstage(sd,'bcrNaive',1280,0.001),
      mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postBi',256,0.007),mkstage(sd,'postNaive',256,0.001)];
    const rowsN0=[...mkF(475369,0.03,0.02),...mkF(475378,0.03,0.02)];
    const rowsN=rowsN0.map(r=>r.arm==='skillT'?{...r,food:Object.fromEntries(Object.keys(r.food).map(id=>[id,0.02*256]))}:r);
    assert.equal(scoreGen1BihomeRows(rowsN).verdict,'GEN1-BIHOME-INCOMPLETE-NOSKILL');
    const rowsB=[trow(475369,'a','b','c'),mkskill(475369,'skillT',0.9,0.03),mkskill(475369,'skillN',0.7,0.02),
      mkcol(475369,'colonyCopy',0.5,[10],[10],0.03),mkcol(475369,'colonyBi',0.5,[10],[10],0.03),mkcol(475369,'colonyNaive',0.4,[10],[10],0.02),
      mkstage(475369,'preCopy',256,0.010),mkstage(475369,'preBi',256,0.009),mkstage(475369,'preNaive',256,0.002),
      mkstage(475369,'bcrCopy',1280,0.004),mkstage(475369,'bcrBi',1280,0.004),mkstage(475369,'bcrNaive',1280,0.001),
      mkstage(475369,'postCopy',256,0.008),mkstage(475369,'postBi',256,0.007),mkstage(475369,'postNaive',256,0.001),
      trow(475378,'a','b','c'),mkskill(475378,'skillT',0.9,0.03),mkskill(475378,'skillN',0.7,0.02),
      mkcol(475378,'colonyCopy',0.5,[10],[10],0.03),mkcol(475378,'colonyBi',0.5,[10],[10],0.03),mkcol(475378,'colonyNaive',0.4,[10],[10],0.02),
      mkstage(475378,'preCopy',256,0.010),mkstage(475378,'preBi',256,0.009),mkstage(475378,'preNaive',256,0.002),
      mkstage(475378,'bcrCopy',1280,0.004),mkstage(475378,'bcrBi',1280,0.004),mkstage(475378,'bcrNaive',1280,0.001),
      mkstage(475378,'postCopy',256,0.008),mkstage(475378,'postBi',256,0.007),mkstage(475378,'postNaive',256,0.001)];
    assert.equal(scoreGen1BihomeRows(rowsB).verdict,'GEN1-BIHOME-INCOMPLETE-LOWBIRTHS');
    const rowsI=[trow(475369,'a','a','c'),mkskill(475369,'skillT',0.9,0.03),mkskill(475369,'skillN',0.7,0.02),
      mkcol(475369,'colonyCopy',0.5,off,[10,11],0.03),mkcol(475369,'colonyBi',0.5,off,[10,11],0.03),mkcol(475369,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(475369,'preCopy',256,0.010),mkstage(475369,'preBi',256,0.009),mkstage(475369,'preNaive',256,0.002),
      mkstage(475369,'bcrCopy',1280,0.004),mkstage(475369,'bcrBi',1280,0.004),mkstage(475369,'bcrNaive',1280,0.001),
      mkstage(475369,'postCopy',256,0.008),mkstage(475369,'postBi',256,0.007),mkstage(475369,'postNaive',256,0.001),
      trow(475378,'a','a','c'),mkskill(475378,'skillT',0.9,0.03),mkskill(475378,'skillN',0.7,0.02),
      mkcol(475378,'colonyCopy',0.5,off,[10,11],0.03),mkcol(475378,'colonyBi',0.5,off,[10,11],0.03),mkcol(475378,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(475378,'preCopy',256,0.010),mkstage(475378,'preBi',256,0.009),mkstage(475378,'preNaive',256,0.002),
      mkstage(475378,'bcrCopy',1280,0.004),mkstage(475378,'bcrBi',1280,0.004),mkstage(475378,'bcrNaive',1280,0.001),
      mkstage(475378,'postCopy',256,0.008),mkstage(475378,'postBi',256,0.007),mkstage(475378,'postNaive',256,0.001)];
    assert.equal(scoreGen1BihomeRows(rowsI).verdict,'GEN1-BIHOME-INVALID-NOLEARN');
    assert.equal(scoreGen1BihomeRows([trow(475369,'a','b','c')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(BIH_TRAIN_TICKS===512&&BIH_PROBE_TICKS===1792&&BIH_MIN_OFFSPRING===6);
    assert.ok(BIH_SKILL_TICKS===256&&BIH_APROBE_TICKS===256&&BIH_EDGE===0.002);
    assert.ok(BIH_BCR_TICKS===1280);
  });
});
