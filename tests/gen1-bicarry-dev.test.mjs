// GEN1-BICARRY V1 fixtures (FROZEN docs/GEN1_BICARRY_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8x on fakes, split/cause reuse, scorer
// GO/NOGO/NOGAP/INCOMPLETE/INVALID branches (per-pair fractions),
// constants guard.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ger2Bank,scoreGen1BicarryRows,causeSplit,erode2SplitLosers,erode2Rate,erode2Toxin,erode2OffspringIds,erode2OffspringSurvival,erode2OffspringRate,probeIntake8x,meanToxin,
  BIC_FIXTURE_SEEDS,BIC_TRIAGE_SEEDS,BIC_ARMS,BIC_TRAIN_TICKS,
  BIC_PROBE_TICKS,BIC_SKILL_TICKS,BIC_APROBE_TICKS,BIC_BC_TICKS,BIC_EDGE,BIC_PLACE_ENERGY,BIC_MIN_OFFSPRING} from '../scripts/gen1-bicarry-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,900);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*900;
  const vt=arm==='colonyBi'?'biparental':(arm==='colonyCopy'?'maternal':'none');
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
  return {history:{seed},arm,stage:arm.startsWith('post')||arm.startsWith('pre')?'aprobe':'bctrain',frozen:arm.startsWith('post')||arm.startsWith('pre'),survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-bicarry-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1bicarry-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ger2Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-bicarry-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...BIC_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(BIC_FIXTURE_SEEDS[0],475477);
    assert.deepEqual([...BIC_TRIAGE_SEEDS],[490649,490650,490651,490652,490653,490654,490655,490656,490657]);
    assert.ok(!BIC_FIXTURE_SEEDS.some(s=>BIC_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...BIC_ARMS],['trainAB','skillT','skillN','colonyBi','colonyCopy','colonyNaive','preBi','preCopy','preNaive','bcBi','bcCopy','bcNaive','postBi','postCopy','postNaive']);
    assert.equal(BIC_TRAIN_TICKS,512);assert.equal(BIC_PROBE_TICKS,900);
    assert.equal(BIC_SKILL_TICKS,256);assert.equal(BIC_APROBE_TICKS,256);
    assert.equal(BIC_BC_TICKS,1024);assert.equal(BIC_EDGE,0.002);
    assert.equal(BIC_PLACE_ENERGY,48);assert.equal(BIC_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake8x on fakes',()=>{
    const r=mkcol(475477,'colonyBi',0.5,[10,11,12,13,14,15],[10,11],0.03);
    assert.deepEqual(erode2OffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(erode2OffspringSurvival(r),4/6);
    assert.equal(r.vt,'biparental');
    assert.ok(Math.abs(erode2OffspringRate(r)-0.03)<0.01);
    assert.equal(erode2OffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8x(mkstage(475477,'preBi',256,0.008))-0.008)<1e-9);
    assert.equal(probeIntake8x(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(erode2SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:900}).losers,2);
  });
  it('scorer GO branch (recombination retains most through BC on both pairs)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,preB,postB)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyBi',0.5,off,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preBi',256,preB),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcCopy',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBi',256,postB),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    const rows=[...mkH(475477,0.010,0.008),...mkH(475486,0.010,0.008)];
    assert.equal(rows.length,30);
    const v=scoreGen1BicarryRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BICARRY-GO-V1');
    assert.deepEqual(v.retention.pairFrac,[0.75,0.75]);
    assert.equal(v.colonyOffspringN.bi,12);
    assert.ok(Math.abs(v.retention.copyFrac-0.86)<1e-9);
  });
  it('scorer NOGO/NOGAP/LOWBIRTHS/NOSKILL branches',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,preB,postB,offIds)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyBi',0.5,offIds,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,offIds,[10],0.010),mkcol(sd,'colonyNaive',0.4,offIds,[10,11,12,13],0.002),
      mkstage(sd,'preBi',256,preB),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcCopy',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBi',256,postB),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    const nogo=[...mkH(475477,0.010,0.003,off),...mkH(475486,0.010,0.008,off)];
    assert.equal(scoreGen1BicarryRows(nogo).verdict,'GEN1-BICARRY-NOGO-V1');
    const nogap=[...mkH(475477,0.002,0.008,off),...mkH(475486,0.010,0.008,off)];
    assert.equal(scoreGen1BicarryRows(nogap).verdict,'GEN1-BICARRY-INCOMPLETE-NOGAP');
    const lowb=[...mkH(475477,0.010,0.008,[10]),...mkH(475486,0.010,0.008,[10])];
    assert.equal(scoreGen1BicarryRows(lowb).verdict,'GEN1-BICARRY-INCOMPLETE-LOWBIRTHS');
    const nosk=[trow(475477,'a','b','c'),mkskill(475477,'skillT',0.9,0.02),mkskill(475477,'skillN',0.7,0.02)];
    const rest=(sd)=>[mkcol(sd,'colonyBi',0.5,off,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preBi',256,0.010),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcCopy',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBi',256,0.008),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    assert.equal(scoreGen1BicarryRows([...nosk,...rest(475477),trow(475486,'a','b','c'),mkskill(475486,'skillT',0.9,0.02),mkskill(475486,'skillN',0.7,0.02),...rest(475486)]).verdict,'GEN1-BICARRY-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn A, integrity)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd)=>[trow(sd,'a','a','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyBi',0.5,off,[10,11],0.009),mkcol(sd,'colonyCopy',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preBi',256,0.010),mkstage(sd,'preCopy',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcCopy',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBi',256,0.008),mkstage(sd,'postCopy',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    assert.equal(scoreGen1BicarryRows([...mkH(475477),...mkH(475486)]).verdict,'GEN1-BICARRY-INVALID-NOLEARN');
    assert.equal(scoreGen1BicarryRows([trow(475477,'a','b','c')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(BIC_TRAIN_TICKS===512&&BIC_PROBE_TICKS===900&&BIC_MIN_OFFSPRING===4);
    assert.ok(BIC_APROBE_TICKS===256&&BIC_BC_TICKS===1024&&BIC_EDGE===0.002);
  });
});
