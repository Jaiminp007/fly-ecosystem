// GEN1-SOCHOMEW V1 fixtures (FROZEN docs/GEN1_SOCHOMEW_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8x on fakes, split/cause reuse, scorer
// GO/NOGO/NOGAP/INCOMPLETE/INVALID branches (per-pair social
// fractions through short immersion), constants guard.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ger2Bank,scoreGen1SochomewRows,causeSplit,erode2SplitLosers,erode2Rate,erode2Toxin,erode2OffspringIds,erode2OffspringSurvival,erode2OffspringRate,probeIntake8x,meanToxin,
  SHW_FIXTURE_SEEDS,SHW_TRIAGE_SEEDS,SHW_ARMS,SHW_TRAIN_TICKS,
  SHW_PROBE_TICKS,SHW_SKILL_TICKS,SHW_APROBE_TICKS,SHW_IM_TICKS,SHW_EDGE,SHW_PLACE_ENERGY,SHW_MIN_OFFSPRING} from '../scripts/gen1-sochomew-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,900);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*900;
  const vt=arm==='colonySocial'?'copyconditional':(arm==='colonyCopy'?'maternal':'none');
  return {history:{seed},arm,stage:'colony',frozen:false,survival:surv,meteredTicks:900,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3,...offIds],offDied),
  founders:[0,1,2,3],vt,trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:900,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkstage=(seed,arm,ticks,rate,n=6)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,ticks);
  const toxin={};for(const id of ids)toxin[id]=0.005*ticks;
  return {history:{seed},arm,stage:arm.startsWith('post')||arm.startsWith('pre')?'aprobe':'immtrain',frozen:arm.startsWith('post')||arm.startsWith('pre'),survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-sochomew-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1sochomew-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ger2Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-sochomew-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...SHW_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(SHW_FIXTURE_SEEDS[0],475675);
    assert.deepEqual([...SHW_TRIAGE_SEEDS],[490748,490749,490750,490751,490752,490753,490754,490755,490756]);
    assert.ok(!SHW_FIXTURE_SEEDS.some(s=>SHW_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...SHW_ARMS],['trainAB','skillT','skillN','colonySocial','colonyCopy','colonyNaive','preSocial','preCopy','preNaive','imSocial','imCopy','imNaive','postSocial','postCopy','postNaive']);
    assert.equal(SHW_TRAIN_TICKS,512);assert.equal(SHW_PROBE_TICKS,900);
    assert.equal(SHW_SKILL_TICKS,256);assert.equal(SHW_APROBE_TICKS,256);
    assert.equal(SHW_IM_TICKS,1024);assert.equal(SHW_EDGE,0.002);
    assert.equal(SHW_PLACE_ENERGY,48);assert.equal(SHW_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake8x on fakes',()=>{
    const r=mkcol(475675,'colonySocial',0.5,[10,11,12,13,14,15],[10,11],0.03);
    assert.deepEqual(erode2OffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(erode2OffspringSurvival(r),4/6);
    assert.equal(r.vt,'copyconditional');
    assert.ok(Math.abs(erode2OffspringRate(r)-0.03)<0.01);
    assert.equal(erode2OffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8x(mkstage(475675,'preSocial',256,0.008))-0.008)<1e-9);
    assert.equal(probeIntake8x(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(erode2SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:900}).losers,2);
  });
  it('scorer GO branch (social retains most through short immersion, both pairs)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,preS,postS)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonySocial',0.5,off,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preSocial',256,preS),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'imSocial',1024,0.005),mkstage(sd,'imCopy',1024,0.005),mkstage(sd,'imNaive',1024,0.005),
      mkstage(sd,'postSocial',256,postS),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    const rows=[...mkH(475675,0.010,0.008),...mkH(475684,0.010,0.008)];
    assert.equal(rows.length,30);
    const v=scoreGen1SochomewRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-SOCHOMEW-GO-V1');
    assert.deepEqual(v.retention.pairFrac,[0.75,0.75]);
    assert.equal(v.colonyOffspringN.social,12);
    assert.ok(Math.abs(v.retention.copyFrac-0.86)<1e-9);
  });
  it('scorer NOGO/NOGAP/LOWBIRTHS/NOSKILL branches',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,preS,postS,offIds)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonySocial',0.5,offIds,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,offIds,[10],0.010),mkcol(sd,'colonyNaive',0.4,offIds,[10,11,12,13],0.002),
      mkstage(sd,'preSocial',256,preS),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'imSocial',1024,0.005),mkstage(sd,'imCopy',1024,0.005),mkstage(sd,'imNaive',1024,0.005),
      mkstage(sd,'postSocial',256,postS),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    const nogo=[...mkH(475675,0.010,0.003,off),...mkH(475684,0.010,0.008,off)];
    assert.equal(scoreGen1SochomewRows(nogo).verdict,'GEN1-SOCHOMEW-NOGO-V1');
    const nogap=[...mkH(475675,0.002,0.008,off),...mkH(475684,0.010,0.008,off)];
    assert.equal(scoreGen1SochomewRows(nogap).verdict,'GEN1-SOCHOMEW-INCOMPLETE-NOGAP');
    const lowb=[...mkH(475675,0.010,0.008,[10]),...mkH(475684,0.010,0.008,[10])];
    assert.equal(scoreGen1SochomewRows(lowb).verdict,'GEN1-SOCHOMEW-INCOMPLETE-LOWBIRTHS');
    const nosk=[trow(475675,'a','b','c'),mkskill(475675,'skillT',0.9,0.02),mkskill(475675,'skillN',0.7,0.02)];
    const rest=(sd)=>[mkcol(sd,'colonySocial',0.5,off,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preSocial',256,0.010),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'imSocial',1024,0.005),mkstage(sd,'imCopy',1024,0.005),mkstage(sd,'imNaive',1024,0.005),
      mkstage(sd,'postSocial',256,0.008),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    assert.equal(scoreGen1SochomewRows([...nosk,...rest(475675),trow(475684,'a','b','c'),mkskill(475684,'skillT',0.9,0.02),mkskill(475684,'skillN',0.7,0.02),...rest(475684)]).verdict,'GEN1-SOCHOMEW-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn A, integrity)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd)=>[trow(sd,'a','a','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonySocial',0.5,off,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preSocial',256,0.010),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'imSocial',1024,0.005),mkstage(sd,'imCopy',1024,0.005),mkstage(sd,'imNaive',1024,0.005),
      mkstage(sd,'postSocial',256,0.008),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    assert.equal(scoreGen1SochomewRows([...mkH(475675),...mkH(475684)]).verdict,'GEN1-SOCHOMEW-INVALID-NOLEARN');
    assert.equal(scoreGen1SochomewRows([trow(475675,'a','b','c')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(SHW_TRAIN_TICKS===512&&SHW_PROBE_TICKS===900&&SHW_MIN_OFFSPRING===4);
    assert.ok(SHW_APROBE_TICKS===256&&SHW_IM_TICKS===1024&&SHW_EDGE===0.002);
  });
});
