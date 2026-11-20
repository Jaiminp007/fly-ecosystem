// GEN1-SOCIALHOME V1 fixtures (FROZEN docs/GEN1_SOCIALHOME_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, scorer
// GO/NOGO/NOGAP/INCOMPLETE/INVALID branches (social gaps per-pair,
// copy descriptive), constants (incl. edge).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmhBank,scoreGen1SocialhomeRows,causeSplit,muthomeSplitLosers,muthomeRate,muthomeToxin,muthomeOffspringIds,muthomeOffspringSurvival,muthomeOffspringRate,probeIntake8s,meanToxin,
  SCH_FIXTURE_SEEDS,SCH_TRIAGE_SEEDS,SCH_ARMS,SCH_TRAIN_TICKS,
  SCH_PROBE_TICKS,SCH_SKILL_TICKS,SCH_APROBE_TICKS,SCH_BCR_TICKS,SCH_EDGE,SCH_PLACE_ENERGY,SCH_MIN_OFFSPRING} from '../scripts/gen1-socialhome-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='colonySocial'?'copyconditional':(arm==='colonyCopy'?'maternal':'none'),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkstage=(seed,arm,ticks,rate,n=6)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,ticks);
  const toxin={};for(const id of ids)toxin[id]=0.005*ticks;
  return {history:{seed},arm,stage:arm.startsWith('post')||arm.startsWith('pre')?'aprobe':'bcrtrain',frozen:true,survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-socialhome-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1socialhome-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmhBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-socialhome-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...SCH_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(SCH_FIXTURE_SEEDS[0],475387);
    assert.deepEqual([...SCH_TRIAGE_SEEDS],[490604,490605,490606,490607,490608,490609,490610,490611,490612]);
    assert.ok(!SCH_FIXTURE_SEEDS.some(s=>SCH_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...SCH_ARMS],['trainAB','skillT','skillN','colonyCopy','colonySocial','colonyNaive','preCopy','preSocial','preNaive','bcrCopy','bcrSocial','bcrNaive','postCopy','postSocial','postNaive']);
    assert.equal(SCH_TRAIN_TICKS,512);assert.equal(SCH_PROBE_TICKS,1792);
    assert.equal(SCH_SKILL_TICKS,256);assert.equal(SCH_APROBE_TICKS,256);
    assert.equal(SCH_BCR_TICKS,1280);assert.equal(SCH_EDGE,0.002);
    assert.equal(SCH_PLACE_ENERGY,48);assert.equal(SCH_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + side stats on fakes',()=>{
    const r=mkcol(475387,'colonySocial',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(muthomeOffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(muthomeOffspringSurvival(r),4/6);
    assert.ok(Math.abs(muthomeOffspringRate(r)-0.03)<1e-9);
    assert.equal(r.vt,'copyconditional');
    assert.ok(Math.abs(probeIntake8s(mkstage(475387,'postSocial',256,0.006))-0.006)<1e-9);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(muthomeSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (social edge survives gauntlet + return)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,preC,preS,preN,postC,postS,postN)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyCopy',0.5,off,[10,11],0.03),mkcol(sd,'colonySocial',0.5,off,[10,11],0.03),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(sd,'preCopy',256,preC),mkstage(sd,'preSocial',256,preS),mkstage(sd,'preNaive',256,preN),
      mkstage(sd,'bcrCopy',1280,0.004),mkstage(sd,'bcrSocial',1280,0.004),mkstage(sd,'bcrNaive',1280,0.001),
      mkstage(sd,'postCopy',256,postC),mkstage(sd,'postSocial',256,postS),mkstage(sd,'postNaive',256,postN)];
    const v=scoreGen1SocialhomeRows([...mkF(475387,0.010,0.009,0.002,0.008,0.007,0.001),...mkF(475396,0.010,0.009,0.002,0.008,0.007,0.001)]);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-SOCIALHOME-GO-V1');
    assert.ok(Math.abs(v.socialRetention.frac-0.86)<1e-9);
  });
  it('scorer NOGO/NOGAP branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,preC,preS,preN,postC,postS,postN)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyCopy',0.5,off,[10,11],0.03),mkcol(sd,'colonySocial',0.5,off,[10,11],0.03),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(sd,'preCopy',256,preC),mkstage(sd,'preSocial',256,preS),mkstage(sd,'preNaive',256,preN),
      mkstage(sd,'bcrCopy',1280,0.004),mkstage(sd,'bcrSocial',1280,0.004),mkstage(sd,'bcrNaive',1280,0.001),
      mkstage(sd,'postCopy',256,postC),mkstage(sd,'postSocial',256,postS),mkstage(sd,'postNaive',256,postN)];
    const base=[...mkF(475387,0.010,0.009,0.002,0.008,0.007,0.001),...mkF(475396,0.010,0.009,0.002,0.008,0.007,0.001)];
    assert.equal(scoreGen1SocialhomeRows(base).verdict,'GEN1-SOCIALHOME-GO-V1');
    const fixRows=(rows,preS,postS)=>rows.map(r=>r.arm==='preSocial'?{...r,food:Object.fromEntries(Object.keys(r.food).map(id=>[id,preS*256]))}:r.arm==='postSocial'?{...r,food:Object.fromEntries(Object.keys(r.food).map(id=>[id,postS*256]))}:r);
    assert.equal(scoreGen1SocialhomeRows(fixRows(base,0.009,0.003)).verdict,'GEN1-SOCIALHOME-NOGO-V1');
    assert.equal(scoreGen1SocialhomeRows(fixRows(base,0.002,0.007)).verdict,'GEN1-SOCIALHOME-INCOMPLETE-NOGAP');
  });
  it('scorer INCOMPLETE/INVALID branches (skill, births, no-learn)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,sT,sN)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,sT),mkskill(sd,'skillN',0.7,sN),
      mkcol(sd,'colonyCopy',0.5,off,[10,11],0.03),mkcol(sd,'colonySocial',0.5,off,[10,11],0.03),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(sd,'preCopy',256,0.010),mkstage(sd,'preSocial',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcrCopy',1280,0.004),mkstage(sd,'bcrSocial',1280,0.004),mkstage(sd,'bcrNaive',1280,0.001),
      mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postSocial',256,0.007),mkstage(sd,'postNaive',256,0.001)];
    const rowsN0=[...mkF(475387,0.03,0.02),...mkF(475396,0.03,0.02)];
    const rowsN=rowsN0.map(r=>r.arm==='skillT'?{...r,food:Object.fromEntries(Object.keys(r.food).map(id=>[id,0.02*256]))}:r);
    assert.equal(scoreGen1SocialhomeRows(rowsN).verdict,'GEN1-SOCIALHOME-INCOMPLETE-NOSKILL');
    const rowsB=[trow(475387,'a','b','c'),mkskill(475387,'skillT',0.9,0.03),mkskill(475387,'skillN',0.7,0.02),
      mkcol(475387,'colonyCopy',0.5,[10],[10],0.03),mkcol(475387,'colonySocial',0.5,[10],[10],0.03),mkcol(475387,'colonyNaive',0.4,[10],[10],0.02),
      mkstage(475387,'preCopy',256,0.010),mkstage(475387,'preSocial',256,0.009),mkstage(475387,'preNaive',256,0.002),
      mkstage(475387,'bcrCopy',1280,0.004),mkstage(475387,'bcrSocial',1280,0.004),mkstage(475387,'bcrNaive',1280,0.001),
      mkstage(475387,'postCopy',256,0.008),mkstage(475387,'postSocial',256,0.007),mkstage(475387,'postNaive',256,0.001),
      trow(475396,'a','b','c'),mkskill(475396,'skillT',0.9,0.03),mkskill(475396,'skillN',0.7,0.02),
      mkcol(475396,'colonyCopy',0.5,[10],[10],0.03),mkcol(475396,'colonySocial',0.5,[10],[10],0.03),mkcol(475396,'colonyNaive',0.4,[10],[10],0.02),
      mkstage(475396,'preCopy',256,0.010),mkstage(475396,'preSocial',256,0.009),mkstage(475396,'preNaive',256,0.002),
      mkstage(475396,'bcrCopy',1280,0.004),mkstage(475396,'bcrSocial',1280,0.004),mkstage(475396,'bcrNaive',1280,0.001),
      mkstage(475396,'postCopy',256,0.008),mkstage(475396,'postSocial',256,0.007),mkstage(475396,'postNaive',256,0.001)];
    assert.equal(scoreGen1SocialhomeRows(rowsB).verdict,'GEN1-SOCIALHOME-INCOMPLETE-LOWBIRTHS');
    const rowsI0=[...mkF(475387,0.03,0.02),...mkF(475396,0.03,0.02)];
    const rowsI=rowsI0.map(r=>r.arm==='trainAB'?{...r,aDigest:'a'}:r);
    assert.equal(scoreGen1SocialhomeRows(rowsI).verdict,'GEN1-SOCIALHOME-INVALID-NOLEARN');
    assert.equal(scoreGen1SocialhomeRows([trow(475387,'a','b','c')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(SCH_TRAIN_TICKS===512&&SCH_PROBE_TICKS===1792&&SCH_MIN_OFFSPRING===6);
    assert.ok(SCH_SKILL_TICKS===256&&SCH_APROBE_TICKS===256&&SCH_EDGE===0.002);
    assert.ok(SCH_BCR_TICKS===1280);
  });
});
