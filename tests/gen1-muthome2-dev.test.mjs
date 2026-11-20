// GEN1-MUTHOME2 V1 fixtures (FROZEN docs/GEN1_MUTHOME_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8s on fakes, split/cause reuse, scorer
// GO/NOGO/NOGAP/INCOMPLETE/INVALID branches, constants (incl. noise).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmhBank,scoreGen1MuthomeRows,causeSplit,muthomeSplitLosers,muthomeRate,muthomeToxin,muthomeOffspringIds,muthomeOffspringSurvival,muthomeOffspringRate,probeIntake8s,meanToxin,
  GMH2_FIXTURE_SEEDS,GMH2_TRIAGE_SEEDS,GMH2_ARMS,GMH2_TRAIN_TICKS,
  GMH2_PROBE_TICKS,GMH2_SKILL_TICKS,GMH2_APROBE_TICKS,GMH2_BCR_TICKS,GMH2_EDGE,GMH2_PLACE_ENERGY,GMH2_MIN_OFFSPRING,GMH2_MUT_NOISE} from '../scripts/gen1-muthome2-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='colonyNaive'?'none':'maternal',tn:arm==='colonyMut'?0.05:null,trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkstage=(seed,arm,ticks,rate,n=6)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,ticks);
  const toxin={};for(const id of ids)toxin[id]=0.005*ticks;
  return {history:{seed},arm,stage:arm.startsWith('post')||arm.startsWith('pre')?'aprobe':'bcrtrain',frozen:true,survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-muthome2-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1muthome-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmhBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-muthome2-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GMH2_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GMH2_FIXTURE_SEEDS[0],475009);
    assert.deepEqual([...GMH2_TRIAGE_SEEDS],[490415,490416,490417,490418,490419,490420,490421,490422,490423]);
    assert.ok(!GMH2_FIXTURE_SEEDS.some(s=>GMH2_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GMH2_ARMS],['trainAB','skillT','skillN','colonyCopy','colonyMut','colonyNaive','preCopy','preMut','preNaive','bcrCopy','bcrMut','bcrNaive','postCopy','postMut','postNaive']);
    assert.equal(GMH2_TRAIN_TICKS,512);assert.equal(GMH2_PROBE_TICKS,1792);
    assert.equal(GMH2_SKILL_TICKS,256);assert.equal(GMH2_APROBE_TICKS,256);
    assert.equal(GMH2_BCR_TICKS,1280);assert.equal(GMH2_EDGE,0.002);
    assert.equal(GMH2_PLACE_ENERGY,48);assert.equal(GMH2_MIN_OFFSPRING,6);
    assert.equal(GMH2_MUT_NOISE,0.05);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake8s on fakes',()=>{
    const r=mkcol(475009,'colonyMut',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(muthomeOffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(muthomeOffspringSurvival(r),4/6);
    assert.ok(Math.abs(muthomeOffspringRate(r)-0.03)<1e-9);
    assert.equal(muthomeOffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8s(mkstage(475009,'postMut',256,0.006))-0.006)<1e-9);
    assert.equal(probeIntake8s(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(muthomeSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (mutated edge survives gauntlet + return)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(preC,preM,preN,postC,postM,postN)=>[trow(475009,'a','b','c'),mkskill(475009,'skillT',0.9,0.03),mkskill(475009,'skillN',0.7,0.02),
      mkcol(475009,'colonyCopy',0.5,off,[10,11],0.03),mkcol(475009,'colonyMut',0.5,off,[10,11],0.03),mkcol(475009,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(475009,'preCopy',256,preC),mkstage(475009,'preMut',256,preM),mkstage(475009,'preNaive',256,preN),
      mkstage(475009,'bcrCopy',1280,0.004),mkstage(475009,'bcrMut',1280,0.004),mkstage(475009,'bcrNaive',1280,0.001),
      mkstage(475009,'postCopy',256,postC),mkstage(475009,'postMut',256,postM),mkstage(475009,'postNaive',256,postN),
      trow(475018,'a','b','c'),mkskill(475018,'skillT',0.9,0.03),mkskill(475018,'skillN',0.7,0.02),
      mkcol(475018,'colonyCopy',0.5,off,[10,11],0.03),mkcol(475018,'colonyMut',0.5,off,[10,11],0.03),mkcol(475018,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(475018,'preCopy',256,preC),mkstage(475018,'preMut',256,preM),mkstage(475018,'preNaive',256,preN),
      mkstage(475018,'bcrCopy',1280,0.004),mkstage(475018,'bcrMut',1280,0.004),mkstage(475018,'bcrNaive',1280,0.001),
      mkstage(475018,'postCopy',256,postC),mkstage(475018,'postMut',256,postM),mkstage(475018,'postNaive',256,postN)];
    const v=scoreGen1MuthomeRows(mk(0.010,0.009,0.002,0.008,0.007,0.001));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-MUTHOME2-GO-V1');
    assert.ok(Math.abs(v.mutRetention.frac-0.86)<1e-9);
  });
  it('scorer NOGO/NOGAP/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(preC,preM,preN,postC,postM,postN,skillT,skillN,colOff)=>[trow(475009,'a','b','c'),mkskill(475009,'skillT',0.9,skillT),mkskill(475009,'skillN',0.7,skillN),
      mkcol(475009,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(475009,'colonyMut',0.5,colOff,[10,11],0.03),mkcol(475009,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkstage(475009,'preCopy',256,preC),mkstage(475009,'preMut',256,preM),mkstage(475009,'preNaive',256,preN),
      mkstage(475009,'bcrCopy',1280,0.004),mkstage(475009,'bcrMut',1280,0.004),mkstage(475009,'bcrNaive',1280,0.001),
      mkstage(475009,'postCopy',256,postC),mkstage(475009,'postMut',256,postM),mkstage(475009,'postNaive',256,postN),
      trow(475018,'a','b','c'),mkskill(475018,'skillT',0.9,skillT),mkskill(475018,'skillN',0.7,skillN),
      mkcol(475018,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(475018,'colonyMut',0.5,colOff,[10,11],0.03),mkcol(475018,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkstage(475018,'preCopy',256,preC),mkstage(475018,'preMut',256,preM),mkstage(475018,'preNaive',256,preN),
      mkstage(475018,'bcrCopy',1280,0.004),mkstage(475018,'bcrMut',1280,0.004),mkstage(475018,'bcrNaive',1280,0.001),
      mkstage(475018,'postCopy',256,postC),mkstage(475018,'postMut',256,postM),mkstage(475018,'postNaive',256,postN)];
    assert.equal(scoreGen1MuthomeRows(mk(0.010,0.009,0.002,0.008,0.003,0.001,0.03,0.02,off)).verdict,'GEN1-MUTHOME2-NOGO-V1');
    assert.equal(scoreGen1MuthomeRows(mk(0.010,0.002,0.003,0.008,0.007,0.001,0.03,0.02,off)).verdict,'GEN1-MUTHOME2-INCOMPLETE-NOGAP');
    assert.equal(scoreGen1MuthomeRows(mk(0.010,0.009,0.002,0.008,0.007,0.001,0.02,0.02,off)).verdict,'GEN1-MUTHOME2-INCOMPLETE-NOSKILL');
    assert.equal(scoreGen1MuthomeRows(mk(0.010,0.009,0.002,0.008,0.007,0.001,0.03,0.02,[10,11])).verdict,'GEN1-MUTHOME2-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(475009,'a','a','c'),mkskill(475009,'skillT',0.9,0.03),mkskill(475009,'skillN',0.7,0.02),
      mkcol(475009,'colonyCopy',0.5,off,[10,11],0.03),mkcol(475009,'colonyMut',0.5,off,[10,11],0.03),mkcol(475009,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(475009,'preCopy',256,0.010),mkstage(475009,'preMut',256,0.009),mkstage(475009,'preNaive',256,0.002),
      mkstage(475009,'bcrCopy',1280,0.004),mkstage(475009,'bcrMut',1280,0.004),mkstage(475009,'bcrNaive',1280,0.001),
      mkstage(475009,'postCopy',256,0.008),mkstage(475009,'postMut',256,0.007),mkstage(475009,'postNaive',256,0.001),
      trow(475018,'a','a','c'),mkskill(475018,'skillT',0.9,0.03),mkskill(475018,'skillN',0.7,0.02),
      mkcol(475018,'colonyCopy',0.5,off,[10,11],0.03),mkcol(475018,'colonyMut',0.5,off,[10,11],0.03),mkcol(475018,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(475018,'preCopy',256,0.010),mkstage(475018,'preMut',256,0.009),mkstage(475018,'preNaive',256,0.002),
      mkstage(475018,'bcrCopy',1280,0.004),mkstage(475018,'bcrMut',1280,0.004),mkstage(475018,'bcrNaive',1280,0.001),
      mkstage(475018,'postCopy',256,0.008),mkstage(475018,'postMut',256,0.007),mkstage(475018,'postNaive',256,0.001)];
    assert.equal(scoreGen1MuthomeRows(rowsN).verdict,'GEN1-MUTHOME2-INVALID-NOLEARN');
    const bad=[trow(475009,'a','b','c')];
    assert.equal(scoreGen1MuthomeRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GMH2_TRAIN_TICKS===512&&GMH2_PROBE_TICKS===1792&&GMH2_MIN_OFFSPRING===6);
    assert.ok(GMH2_SKILL_TICKS===256&&GMH2_APROBE_TICKS===256&&GMH2_EDGE===0.002);
    assert.ok(GMH2_BCR_TICKS===1280&&GMH2_MUT_NOISE===0.05);
  });
});
