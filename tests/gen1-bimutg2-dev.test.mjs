// GEN1-BIMUTG2 V1 fixtures (FROZEN docs/GEN1_BIMUTG_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8x on fakes, split/cause reuse, scorer
// GO/NOGO/NOGAP/INCOMPLETE/INVALID branches (per-pair bimut
// fractions, bi-exact descriptive), constants guard.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ger2Bank,scoreGen1Bimutg2Rows,causeSplit,erode2SplitLosers,erode2Rate,erode2Toxin,erode2OffspringIds,erode2OffspringSurvival,erode2OffspringRate,probeIntake8x,meanToxin,
  BM2_FIXTURE_SEEDS,BM2_TRIAGE_SEEDS,BM2_ARMS,BM2_TRAIN_TICKS,
  BM2_PROBE_TICKS,BM2_SKILL_TICKS,BM2_APROBE_TICKS,BM2_BC_TICKS,BM2_EDGE,BM2_PLACE_ENERGY,BM2_MIN_OFFSPRING,BM2_MUT_NOISE} from '../scripts/gen1-bimutg2-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,900);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*900;
  const vt=arm==='colonyNaive'?'none':'biparental';
  return {history:{seed},arm,stage:'colony',frozen:false,survival:surv,meteredTicks:900,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3,...offIds],offDied),
  founders:[0,1,2,3],vt,tn:arm==='colonyBimut'?0.05:null,trainDigest:'x',finalDigest:'x',
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

describe('gen1-bimutg2-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1bimutg-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ger2Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-bimutg2-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...BM2_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(BM2_FIXTURE_SEEDS[0],475621);
    assert.deepEqual([...BM2_TRIAGE_SEEDS],[490721,490722,490723,490724,490725,490726,490727,490728,490729]);
    assert.ok(!BM2_FIXTURE_SEEDS.some(s=>BM2_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...BM2_ARMS],['trainAB','skillT','skillN','colonyBimut','colonyBi','colonyNaive','preBimut','preBi','preNaive','bcBimut','bcBi','bcNaive','postBimut','postBi','postNaive']);
    assert.equal(BM2_TRAIN_TICKS,512);assert.equal(BM2_PROBE_TICKS,900);
    assert.equal(BM2_SKILL_TICKS,256);assert.equal(BM2_APROBE_TICKS,256);
    assert.equal(BM2_BC_TICKS,1024);assert.equal(BM2_EDGE,0.002);
    assert.equal(BM2_PLACE_ENERGY,48);assert.equal(BM2_MIN_OFFSPRING,4);
    assert.equal(BM2_MUT_NOISE,0.05);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake8x + noise field on fakes',()=>{
    const r=mkcol(475621,'colonyBimut',0.5,[10,11,12,13,14,15],[10,11],0.03);
    assert.deepEqual(erode2OffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(erode2OffspringSurvival(r),4/6);
    assert.equal(r.vt,'biparental');
    assert.equal(r.tn,0.05);
    assert.ok(Math.abs(erode2OffspringRate(r)-0.03)<0.01);
    assert.equal(erode2OffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8x(mkstage(475621,'preBimut',256,0.008))-0.008)<1e-9);
    assert.equal(probeIntake8x(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(erode2SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:900}).losers,2);
  });
  it('scorer GO branch (mutated recombination retains most through BC, both pairs)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,preM,postM)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyBimut',0.5,off,[10,11],0.009),mkcol(sd,'colonyBi',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preBimut',256,preM),mkstage(sd,'preBi',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBimut',1024,0.005),mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBimut',256,postM),mkstage(sd,'postBi',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    const rows=[...mkH(475621,0.010,0.008),...mkH(475630,0.010,0.008)];
    assert.equal(rows.length,30);
    const v=scoreGen1Bimutg2Rows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BIMUTG2-GO-V1');
    assert.deepEqual(v.retention.pairFrac,[0.75,0.75]);
    assert.equal(v.colonyOffspringN.bimut,12);
    assert.ok(Math.abs(v.retention.biFrac-0.86)<1e-9);
  });
  it('scorer NOGO/NOGAP/LOWBIRTHS/NOSKILL branches',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,preM,postM,offIds)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyBimut',0.5,offIds,[10,11],0.009),mkcol(sd,'colonyBi',0.5,offIds,[10],0.010),mkcol(sd,'colonyNaive',0.4,offIds,[10,11,12,13],0.002),
      mkstage(sd,'preBimut',256,preM),mkstage(sd,'preBi',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBimut',1024,0.005),mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBimut',256,postM),mkstage(sd,'postBi',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    const nogo=[...mkH(475621,0.010,0.003,off),...mkH(475630,0.010,0.008,off)];
    assert.equal(scoreGen1Bimutg2Rows(nogo).verdict,'GEN1-BIMUTG2-NOGO-V1');
    const nogap=[...mkH(475621,0.002,0.008,off),...mkH(475630,0.010,0.008,off)];
    assert.equal(scoreGen1Bimutg2Rows(nogap).verdict,'GEN1-BIMUTG2-INCOMPLETE-NOGAP');
    const lowb=[...mkH(475621,0.010,0.008,[10]),...mkH(475630,0.010,0.008,[10])];
    assert.equal(scoreGen1Bimutg2Rows(lowb).verdict,'GEN1-BIMUTG2-INCOMPLETE-LOWBIRTHS');
    const nosk=[trow(475621,'a','b','c'),mkskill(475621,'skillT',0.9,0.02),mkskill(475621,'skillN',0.7,0.02)];
    const rest=(sd)=>[mkcol(sd,'colonyBimut',0.5,off,[10,11],0.009),mkcol(sd,'colonyBi',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preBimut',256,0.010),mkstage(sd,'preBi',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBimut',1024,0.005),mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBimut',256,0.008),mkstage(sd,'postBi',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    assert.equal(scoreGen1Bimutg2Rows([...nosk,...rest(475621),trow(475630,'a','b','c'),mkskill(475630,'skillT',0.9,0.02),mkskill(475630,'skillN',0.7,0.02),...rest(475630)]).verdict,'GEN1-BIMUTG2-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn A, integrity)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd)=>[trow(sd,'a','a','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colonyBimut',0.5,off,[10,11],0.009),mkcol(sd,'colonyBi',0.5,off,[10],0.010),mkcol(sd,'colonyNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'preBimut',256,0.010),mkstage(sd,'preBi',256,0.009),mkstage(sd,'preNaive',256,0.002),
      mkstage(sd,'bcBimut',1024,0.005),mkstage(sd,'bcBi',1024,0.005),mkstage(sd,'bcNaive',1024,0.005),
      mkstage(sd,'postBimut',256,0.008),mkstage(sd,'postBi',256,0.008),mkstage(sd,'postNaive',256,0.002)];
    assert.equal(scoreGen1Bimutg2Rows([...mkH(475621),...mkH(475630)]).verdict,'GEN1-BIMUTG2-INVALID-NOLEARN');
    assert.equal(scoreGen1Bimutg2Rows([trow(475621,'a','b','c')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(BM2_TRAIN_TICKS===512&&BM2_PROBE_TICKS===900&&BM2_MIN_OFFSPRING===4);
    assert.ok(BM2_APROBE_TICKS===256&&BM2_BC_TICKS===1024&&BM2_EDGE===0.002&&BM2_MUT_NOISE===0.05);
  });
});
