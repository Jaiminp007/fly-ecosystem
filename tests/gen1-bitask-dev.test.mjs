// GEN1-BITASK V1 fixtures (FROZEN docs/GEN1_BITASK_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8s on fakes, split/cause reuse, scorer
// GO/NOGO/NOGAP/INCOMPLETE/INVALID branches (per-pair A-gate + B-gap),
// constants guard.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmsBank,scoreGen1BitaskRows,causeSplit,probeIntake8s,mutsameRate,mutsameOffspringIds,mutsameOffspringSurvival,mulberry32,mutateWeights,
  BTA_FIXTURE_SEEDS,BTA_TRIAGE_SEEDS,BTA_ARMS,BTA_TRAIN_TICKS,
  BTA_BIRTH_TICKS,BTA_SKILL_TICKS,BTA_APROBE_TICKS,BTA_BPROBE_TICKS,BTA_PLACE_ENERGY,BTA_MIN_OFFSPRING} from '../scripts/gen1-bitask-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD)=>({history:{seed},arm:'trainA',stage:'train',survival:0.9,meteredTicks:512,
  initDigest:initD,aDigest:aD,
  deathCauses:{energy:0,age:0},endpoint:{tick:512,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,900);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*900;
  const vt=arm==='colBi'?'biparental':(arm==='colCopy'?'maternal':'none');
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
  return {history:{seed},arm,stage:arm[0]==='b'?'bprobe':'aprobe',frozen:true,survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-bitask-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1bitask-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmsBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-bitask-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...BTA_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(BTA_FIXTURE_SEEDS[0],475495);
    assert.deepEqual([...BTA_TRIAGE_SEEDS],[490658,490659,490660,490661,490662,490663,490664,490665,490666]);
    assert.ok(!BTA_FIXTURE_SEEDS.some(s=>BTA_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...BTA_ARMS],['trainA','skillT','skillN','colBi','colCopy','colNaive','aBi','aCopy','aNaive','bBi','bCopy','bNaive']);
    assert.equal(BTA_TRAIN_TICKS,512);assert.equal(BTA_BIRTH_TICKS,900);
    assert.equal(BTA_SKILL_TICKS,256);assert.equal(BTA_APROBE_TICKS,256);
    assert.equal(BTA_BPROBE_TICKS,256);
    assert.equal(BTA_PLACE_ENERGY,48);assert.equal(BTA_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('mulberry32 deterministic + mutateWeights moves digest, spares input',()=>{
    const r1=mulberry32(475495), r2=mulberry32(475495);
    assert.equal(r1(),r2());
    const w={taste:[0,0,0,0],actor:[1,2,3,4]};
    const m1=mutateWeights(w,0.05,mulberry32(7));
    const m2=mutateWeights(w,0.05,mulberry32(7));
    assert.deepEqual(m1,m2);
    assert.deepEqual(w,{taste:[0,0,0,0],actor:[1,2,3,4]});
    assert.ok(m1.taste.some(v=>v!==0));
  });
  it('offspring helpers + probeIntake8s on fakes',()=>{
    const r=mkcol(475495,'colBi',0.5,[10,11,12,13,14,15],[10,11],0.03);
    assert.deepEqual(mutsameOffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(mutsameOffspringSurvival(r),4/6);
    assert.equal(r.vt,'biparental');
    assert.ok(Math.abs(mutsameRate(r)-0.03)<0.01);
    assert.equal(mutsameOffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8s(mkstage(475495,'bBi',256,0.008))-0.008)<1e-9);
    assert.equal(probeIntake8s(null),null);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
  });
  it('scorer GO branch (recombination transfers to the novel task, both pairs)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,aB,bB)=>[trow(sd,'a','b'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colBi',0.5,off,[10,11],0.009),mkcol(sd,'colCopy',0.5,off,[10],0.010),mkcol(sd,'colNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'aBi',256,aB),mkstage(sd,'aCopy',256,0.009),mkstage(sd,'aNaive',256,0.002),
      mkstage(sd,'bBi',256,bB),mkstage(sd,'bCopy',256,0.004),mkstage(sd,'bNaive',256,0.002)];
    const rows=[...mkH(475495,0.010,0.008),...mkH(475504,0.010,0.008)];
    assert.equal(rows.length,24);
    const v=scoreGen1BitaskRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BITASK-GO-V1');
    assert.deepEqual(v.biGap.pairs,[0.006,0.006]);
    assert.deepEqual(v.aGap.pairs,[0.008,0.008]);
    assert.equal(v.births.bi,12);
  });
  it('scorer NOGO/NOGAP/LOWBIRTHS/NOSKILL branches',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd,aB,bB,offIds)=>[trow(sd,'a','b'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colBi',0.5,offIds,[10,11],0.009),mkcol(sd,'colCopy',0.5,offIds,[10],0.010),mkcol(sd,'colNaive',0.4,offIds,[10,11,12,13],0.002),
      mkstage(sd,'aBi',256,aB),mkstage(sd,'aCopy',256,0.009),mkstage(sd,'aNaive',256,0.002),
      mkstage(sd,'bBi',256,bB),mkstage(sd,'bCopy',256,0.004),mkstage(sd,'bNaive',256,0.002)];
    const nogo=[...mkH(475495,0.010,0.003,off),...mkH(475504,0.010,0.008,off)];
    assert.equal(scoreGen1BitaskRows(nogo).verdict,'GEN1-BITASK-NOGO-V1');
    const nogap=[...mkH(475495,0.002,0.008,off),...mkH(475504,0.010,0.008,off)];
    assert.equal(scoreGen1BitaskRows(nogap).verdict,'GEN1-BITASK-INCOMPLETE-NOGAP');
    const lowb=[...mkH(475495,0.010,0.008,[10]),...mkH(475504,0.010,0.008,[10])];
    assert.equal(scoreGen1BitaskRows(lowb).verdict,'GEN1-BITASK-INCOMPLETE-LOWBIRTHS');
    const nosk=[trow(475495,'a','b'),mkskill(475495,'skillT',0.9,0.02),mkskill(475495,'skillN',0.7,0.02)];
    const rest=(sd)=>[mkcol(sd,'colBi',0.5,off,[10,11],0.009),mkcol(sd,'colCopy',0.5,off,[10],0.010),mkcol(sd,'colNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'aBi',256,0.010),mkstage(sd,'aCopy',256,0.009),mkstage(sd,'aNaive',256,0.002),
      mkstage(sd,'bBi',256,0.008),mkstage(sd,'bCopy',256,0.004),mkstage(sd,'bNaive',256,0.002)];
    assert.equal(scoreGen1BitaskRows([...nosk,...rest(475495),trow(475504,'a','b'),mkskill(475504,'skillT',0.9,0.02),mkskill(475504,'skillN',0.7,0.02),...rest(475504)]).verdict,'GEN1-BITASK-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn A, integrity)',()=>{
    const off=[10,11,12,13,14,15];
    const mkH=(sd)=>[trow(sd,'a','a'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'colBi',0.5,off,[10,11],0.009),mkcol(sd,'colCopy',0.5,off,[10],0.010),mkcol(sd,'colNaive',0.4,off,[10,11,12,13],0.002),
      mkstage(sd,'aBi',256,0.010),mkstage(sd,'aCopy',256,0.009),mkstage(sd,'aNaive',256,0.002),
      mkstage(sd,'bBi',256,0.008),mkstage(sd,'bCopy',256,0.004),mkstage(sd,'bNaive',256,0.002)];
    assert.equal(scoreGen1BitaskRows([...mkH(475495),...mkH(475504)]).verdict,'GEN1-BITASK-INVALID-NOLEARN');
    assert.equal(scoreGen1BitaskRows([trow(475495,'a','b')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(BTA_TRAIN_TICKS===512&&BTA_BIRTH_TICKS===900&&BTA_MIN_OFFSPRING===4);
    assert.ok(BTA_APROBE_TICKS===256&&BTA_BPROBE_TICKS===256);
  });
});
