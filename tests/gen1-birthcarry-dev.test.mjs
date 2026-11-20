// GEN1-BIRTHCARRY V1 fixtures (FROZEN docs/GEN1_BIRTHCARRY_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, PRNG + noise,
// B-probe intake on fakes, scorer GO/NOGO/INCOMPLETE/INVALID branches
// (per-pair copy gaps, mut descriptive), constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmsBank,scoreGen1BirthcarryRows,causeSplit,probeIntake8s,mutsameRate,mutsameOffspringIds,mutsameOffspringSurvival,mulberry32,mutateWeights,
  GNB_FIXTURE_SEEDS,GNB_TRIAGE_SEEDS,GNB_ARMS,GNB_TRAIN_TICKS,GNB_BIRTH_TICKS,GNB_SKILL_TICKS,GNB_BPROBE_TICKS,GNB_PLACE_ENERGY,GNB_MIN_OFFSPRING,GNB_MUT_NOISE} from '../scripts/gen1-birthcarry-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD)=>({history:{seed},arm:'trainA',stage:'train',survival:0.9,meteredTicks:512,
  initDigest:initD,aDigest:aD,
  deathCauses:{energy:0,age:0},endpoint:{tick:512,budgetAdjustedEnergyPerFounder:-60.0}});
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkbirth=(seed,offIds,offDied)=>{const ids=[0,1,2,3,...offIds];const {food,cost}=foodcost(ids,0.03,1792);
  const toxin={};for(const id of ids)toxin[id]=0.005*1792;
  return {history:{seed},arm:'birthCol',stage:'colony',frozen:true,survival:0.5,meteredTicks:1792,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,offDied),
  founders:[0,1,2,3],vt:'maternal',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkb=(seed,arm,rate,n=8)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,256);
  const toxin={};for(const id of ids)toxin[id]=0.005*256;
  return {history:{seed},arm,stage:'bprobe',frozen:true,survival:0.9,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-birthcarry-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1birthcarry-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmsBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-birthcarry-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GNB_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GNB_FIXTURE_SEEDS[0],475063);
    assert.deepEqual([...GNB_TRIAGE_SEEDS],[490442,490443,490444,490445,490446,490447,490448,490449,490450]);
    assert.ok(!GNB_FIXTURE_SEEDS.some(s=>GNB_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GNB_ARMS],['trainA','skillT','skillN','birthCol','bprobeCopy','bprobeMut','bprobeNaive']);
    assert.equal(GNB_TRAIN_TICKS,512);assert.equal(GNB_BIRTH_TICKS,1792);
    assert.equal(GNB_SKILL_TICKS,256);assert.equal(GNB_BPROBE_TICKS,256);
    assert.equal(GNB_PLACE_ENERGY,48);assert.equal(GNB_MIN_OFFSPRING,12);
    assert.equal(GNB_MUT_NOISE,0.05);
    rmSync(dir,{recursive:true,force:true});
  });
  it('mulberry32 deterministic + mutateWeights moves digest, spares input',()=>{
    const r1=mulberry32(475063), r2=mulberry32(475063);
    assert.equal(r1(),r2());
    const w={taste:[0,0,0,0],actor:[1,2,3,4]};
    const m1=mutateWeights(w,0.05,mulberry32(7));
    const m2=mutateWeights(w,0.05,mulberry32(7));
    assert.deepEqual(m1,m2);
    assert.deepEqual(w,{taste:[0,0,0,0],actor:[1,2,3,4]});
    assert.ok(m1.taste.some(v=>v!==0));
  });
  it('probe intake + offspring helpers on fakes',()=>{
    assert.ok(Math.abs(probeIntake8s(mkb(475063,'bprobeCopy',0.008))-0.008)<1e-9);
    assert.equal(probeIntake8s(null),null);
    assert.equal(mutsameOffspringIds(null),null);
  });
  it('scorer GO branch (copy wins novel task both pairs)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(cR,mR,nR)=>[trow(475063,'a','b'),mkskill(475063,'skillT',0.9,0.03),mkskill(475063,'skillN',0.7,0.02),
      mkbirth(475063,off,[10,11]),mkb(475063,'bprobeCopy',cR),mkb(475063,'bprobeMut',mR),mkb(475063,'bprobeNaive',nR),
      trow(475072,'a','b'),mkskill(475072,'skillT',0.9,0.03),mkskill(475072,'skillN',0.7,0.02),
      mkbirth(475072,off,[10,11]),mkb(475072,'bprobeCopy',cR),mkb(475072,'bprobeMut',mR),mkb(475072,'bprobeNaive',nR)];
    const v=scoreGen1BirthcarryRows(mk(0.008,0.007,0.002));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BIRTHCARRY-GO-V1');
    assert.deepEqual(v.copyGap.pairs,[0.006,0.006]);
    assert.deepEqual(v.mutGap.pairs,[0.005,0.005]);
    assert.equal(v.births,16);
  });
  it('scorer NOGO branches (one pair fails / both fail)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rows=[trow(475063,'a','b'),mkskill(475063,'skillT',0.9,0.03),mkskill(475063,'skillN',0.7,0.02),
      mkbirth(475063,off,[10,11]),mkb(475063,'bprobeCopy',0.008),mkb(475063,'bprobeMut',0.007),mkb(475063,'bprobeNaive',0.002),
      trow(475072,'a','b'),mkskill(475072,'skillT',0.9,0.03),mkskill(475072,'skillN',0.7,0.02),
      mkbirth(475072,off,[10,11]),mkb(475072,'bprobeCopy',0.003),mkb(475072,'bprobeMut',0.003),mkb(475072,'bprobeNaive',0.002)];
    assert.equal(scoreGen1BirthcarryRows(rows).verdict,'GEN1-BIRTHCARRY-NOGO-V1');
  });
  it('scorer INCOMPLETE/INVALID branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(aD,sT,sN,bOff)=>[trow(475063,'a',aD),mkskill(475063,'skillT',0.9,sT),mkskill(475063,'skillN',0.7,sN),
      mkbirth(475063,bOff,[10,11]),mkb(475063,'bprobeCopy',0.008),mkb(475063,'bprobeMut',0.007),mkb(475063,'bprobeNaive',0.002),
      trow(475072,'a',aD),mkskill(475072,'skillT',0.9,sT),mkskill(475072,'skillN',0.7,sN),
      mkbirth(475072,bOff,[10,11]),mkb(475072,'bprobeCopy',0.008),mkb(475072,'bprobeMut',0.007),mkb(475072,'bprobeNaive',0.002)];
    assert.equal(scoreGen1BirthcarryRows(mk('b',0.03,0.02,off)).verdict,'GEN1-BIRTHCARRY-GO-V1');
    assert.equal(scoreGen1BirthcarryRows(mk('a',0.03,0.02,off)).verdict,'GEN1-BIRTHCARRY-INVALID-NOLEARN');
    assert.equal(scoreGen1BirthcarryRows(mk('b',0.02,0.02,off)).verdict,'GEN1-BIRTHCARRY-INCOMPLETE-NOSKILL');
    assert.equal(scoreGen1BirthcarryRows(mk('b',0.03,0.02,[10,11])).verdict,'GEN1-BIRTHCARRY-INCOMPLETE-LOWBIRTHS');
    assert.equal(scoreGen1BirthcarryRows([trow(475063,'a','b')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GNB_TRAIN_TICKS===512&&GNB_BIRTH_TICKS===1792&&GNB_MIN_OFFSPRING===12);
    assert.ok(GNB_SKILL_TICKS===256&&GNB_BPROBE_TICKS===256&&GNB_MUT_NOISE===0.05);
  });
});
