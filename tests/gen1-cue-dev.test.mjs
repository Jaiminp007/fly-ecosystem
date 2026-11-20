// GEN1-CUE V1 fixtures (FROZEN docs/GEN1_CUE_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8w on fakes, split/cause reuse, scorer
// GO/NOGO/NOGAP/INCOMPLETE/INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gcuBank,scoreGen1CueRows,causeSplit,cueSplitLosers,cueRate,cueToxin,cueOffspringIds,cueOffspringSurvival,cueOffspringRate,probeIntake8w,meanToxin,
  GCU_FIXTURE_SEEDS,GCU_TRIAGE_SEEDS,GCU_ARMS,GCU_TRAIN_TICKS,
  GCU_PROBE_TICKS,GCU_SKILL_TICKS,GCU_APROBE_TICKS,GCU_BCR_TICKS,GCU_EDGE,GCU_PLACE_ENERGY,GCU_MIN_OFFSPRING} from '../scripts/gen1-cue-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='colonyNaive'?'none':'maternal',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkstage=(seed,arm,ticks,rate,n=6)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,ticks);
  const toxin={};for(const id of ids)toxin[id]=0.005*ticks;
  return {history:{seed},arm,stage:arm.endsWith('R')?'aprobeR':(arm.startsWith('pre')||arm.startsWith('post')?'aprobe':'bcrtrain'),frozen:true,survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-cue-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1cue-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gcuBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-cue-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GCU_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GCU_FIXTURE_SEEDS[0],474883);
    assert.deepEqual([...GCU_TRIAGE_SEEDS],[490352,490353,490354,490355,490356,490357,490358,490359,490360]);
    assert.ok(!GCU_FIXTURE_SEEDS.some(s=>GCU_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GCU_ARMS],['trainAB','skillT','skillN','colonyCopy','colonyNaive','preCopy','preNaive','bcrCopy','bcrNaive','postCopy','postNaive','postCopyR','postNaiveR']);
    assert.equal(GCU_TRAIN_TICKS,512);assert.equal(GCU_PROBE_TICKS,1792);
    assert.equal(GCU_SKILL_TICKS,256);assert.equal(GCU_APROBE_TICKS,256);
    assert.equal(GCU_BCR_TICKS,1280);assert.equal(GCU_EDGE,0.002);
    assert.equal(GCU_PLACE_ENERGY,48);assert.equal(GCU_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake8w on fakes',()=>{
    const r=mkcol(474883,'colonyCopy',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(cueOffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(cueOffspringSurvival(r),4/6);
    assert.ok(Math.abs(cueOffspringRate(r)-0.03)<1e-9);
    assert.equal(cueOffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8w(mkstage(474883,'postCopyR',256,0.008))-0.008)<1e-9);
    assert.equal(probeIntake8w(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(cueSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (transmitted edge is cue-robust)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(preC,preN,postC,postN,postCR,postNR)=>[trow(474883,'a','b','c'),mkskill(474883,'skillT',0.9,0.03),mkskill(474883,'skillN',0.7,0.02),
      mkcol(474883,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474883,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474883,'preCopy',256,preC),mkstage(474883,'preNaive',256,preN),
      mkstage(474883,'bcrCopy',1280,0.004),mkstage(474883,'bcrNaive',1280,0.001),
      mkstage(474883,'postCopy',256,postC),mkstage(474883,'postNaive',256,postN),
      mkstage(474883,'postCopyR',256,postCR),mkstage(474883,'postNaiveR',256,postNR),
      trow(474892,'a','b','c'),mkskill(474892,'skillT',0.9,0.03),mkskill(474892,'skillN',0.7,0.02),
      mkcol(474892,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474892,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474892,'preCopy',256,preC),mkstage(474892,'preNaive',256,preN),
      mkstage(474892,'bcrCopy',1280,0.004),mkstage(474892,'bcrNaive',1280,0.001),
      mkstage(474892,'postCopy',256,postC),mkstage(474892,'postNaive',256,postN),
      mkstage(474892,'postCopyR',256,postCR),mkstage(474892,'postNaiveR',256,postNR)];
    const v=scoreGen1CueRows(mk(0.010,0.002,0.008,0.001,0.007,0.001));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-CUE-GO-V1');
    assert.ok(Math.abs(v.probeRelabel.gap-0.006)<1e-9);
  });
  it('scorer NOGO/NOGAP/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(preC,preN,postC,postN,postCR,postNR,skillT,skillN,colOff)=>[trow(474883,'a','b','c'),mkskill(474883,'skillT',0.9,skillT),mkskill(474883,'skillN',0.7,skillN),
      mkcol(474883,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474883,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkstage(474883,'preCopy',256,preC),mkstage(474883,'preNaive',256,preN),
      mkstage(474883,'bcrCopy',1280,0.004),mkstage(474883,'bcrNaive',1280,0.001),
      mkstage(474883,'postCopy',256,postC),mkstage(474883,'postNaive',256,postN),
      mkstage(474883,'postCopyR',256,postCR),mkstage(474883,'postNaiveR',256,postNR),
      trow(474892,'a','b','c'),mkskill(474892,'skillT',0.9,skillT),mkskill(474892,'skillN',0.7,skillN),
      mkcol(474892,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474892,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkstage(474892,'preCopy',256,preC),mkstage(474892,'preNaive',256,preN),
      mkstage(474892,'bcrCopy',1280,0.004),mkstage(474892,'bcrNaive',1280,0.001),
      mkstage(474892,'postCopy',256,postC),mkstage(474892,'postNaive',256,postN),
      mkstage(474892,'postCopyR',256,postCR),mkstage(474892,'postNaiveR',256,postNR)];
    assert.equal(scoreGen1CueRows(mk(0.010,0.002,0.008,0.001,0.002,0.001,0.03,0.02,off)).verdict,'GEN1-CUE-NOGO-V1');
    assert.equal(scoreGen1CueRows(mk(0.002,0.003,0.008,0.001,0.007,0.001,0.03,0.02,off)).verdict,'GEN1-CUE-INCOMPLETE-NOGAP');
    assert.equal(scoreGen1CueRows(mk(0.010,0.002,0.008,0.001,0.007,0.001,0.02,0.02,off)).verdict,'GEN1-CUE-INCOMPLETE-NOSKILL');
    assert.equal(scoreGen1CueRows(mk(0.010,0.002,0.008,0.001,0.007,0.001,0.03,0.02,[10,11])).verdict,'GEN1-CUE-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(474883,'a','a','c'),mkskill(474883,'skillT',0.9,0.03),mkskill(474883,'skillN',0.7,0.02),
      mkcol(474883,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474883,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474883,'preCopy',256,0.010),mkstage(474883,'preNaive',256,0.002),
      mkstage(474883,'bcrCopy',1280,0.004),mkstage(474883,'bcrNaive',1280,0.001),
      mkstage(474883,'postCopy',256,0.008),mkstage(474883,'postNaive',256,0.001),
      mkstage(474883,'postCopyR',256,0.007),mkstage(474883,'postNaiveR',256,0.001),
      trow(474892,'a','a','c'),mkskill(474892,'skillT',0.9,0.03),mkskill(474892,'skillN',0.7,0.02),
      mkcol(474892,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474892,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474892,'preCopy',256,0.010),mkstage(474892,'preNaive',256,0.002),
      mkstage(474892,'bcrCopy',1280,0.004),mkstage(474892,'bcrNaive',1280,0.001),
      mkstage(474892,'postCopy',256,0.008),mkstage(474892,'postNaive',256,0.001),
      mkstage(474892,'postCopyR',256,0.007),mkstage(474892,'postNaiveR',256,0.001)];
    assert.equal(scoreGen1CueRows(rowsN).verdict,'GEN1-CUE-INVALID-NOLEARN');
    const bad=[trow(474883,'a','b','c')];
    assert.equal(scoreGen1CueRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GCU_TRAIN_TICKS===512&&GCU_PROBE_TICKS===1792&&GCU_MIN_OFFSPRING===6);
    assert.ok(GCU_SKILL_TICKS===256&&GCU_APROBE_TICKS===256&&GCU_EDGE===0.002);
    assert.ok(GCU_BCR_TICKS===1280);
  });
});
