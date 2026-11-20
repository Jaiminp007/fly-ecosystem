// GEN1-MUTSAME V1 fixtures (FROZEN docs/GEN1_MUTSAME_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, PRNG + noise,
// side stats on fakes, scorer GO/NOGO/INCOMPLETE/INVALID branches,
// constants (incl. noise + edges).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmsBank,scoreGen1MutsameRows,causeSplit,sideSurvival,sideIntake,probeIntake8s,mutsameRate,mutsameOffspringIds,mutsameOffspringSurvival,mulberry32,mutateWeights,
  GMS_FIXTURE_SEEDS,GMS_TRIAGE_SEEDS,GMS_ARMS,GMS_TRAIN_TICKS,GMS_BIRTH_TICKS,GMS_SKILL_TICKS,GMS_SHARED_TICKS,GMS_PLACE_ENERGY,GMS_MIN_OFFSPRING,GMS_MUT_NOISE,GMS_SURV_EDGE,GMS_INTAKE_EDGE} from '../scripts/gen1-mutsame-dev.mjs';

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
const mksame=(seed,cOff,mOff,nOff,n,cRate,mRate,nRate)=>{
  const copyIds=Array.from({length:n},(_,i)=>i), mutIds=Array.from({length:n},(_,i)=>n+i), naiveIds=Array.from({length:n},(_,i)=>2*n+i);
  const food={},cost={};
  for(const id of copyIds){food[id]=cRate*1792;cost[id]=cRate*1792*1.4;}
  for(const id of mutIds){food[id]=mRate*1792;cost[id]=mRate*1792*1.4;}
  for(const id of naiveIds){food[id]=nRate*1792;cost[id]=nRate*1792*1.4;}
  const toxin={};for(let i=0;i<3*n;i++)toxin[i]=0.005*1792;
  const died=[...copyIds.slice(0,cOff),...mutIds.slice(0,mOff),...naiveIds.slice(0,nOff)];
  return {history:{seed},arm:'sameCol',stage:'shared',frozen:true,survival:0.5,meteredTicks:1792,toxin,food,cost,
  energyCurve:[],series:[],agents:agents([...copyIds,...mutIds,...naiveIds],died),
  founders:[...copyIds,...mutIds,...naiveIds],vt:'none',sideIds:{copy:copyIds,mut:mutIds,naive:naiveIds},sideN:n,
  trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:died.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-mutsame-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1mutsame-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmsBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-mutsame-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GMS_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GMS_FIXTURE_SEEDS[0],475027);
    assert.deepEqual([...GMS_TRIAGE_SEEDS],[490424,490425,490426,490427,490428,490429,490430,490431,490432]);
    assert.ok(!GMS_FIXTURE_SEEDS.some(s=>GMS_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GMS_ARMS],['trainA','skillT','skillN','birthCol','sameCol']);
    assert.equal(GMS_TRAIN_TICKS,512);assert.equal(GMS_BIRTH_TICKS,1792);
    assert.equal(GMS_SKILL_TICKS,256);assert.equal(GMS_SHARED_TICKS,1792);
    assert.equal(GMS_PLACE_ENERGY,48);assert.equal(GMS_MIN_OFFSPRING,12);
    assert.equal(GMS_MUT_NOISE,0.05);
    rmSync(dir,{recursive:true,force:true});
  });
  it('mulberry32 deterministic + mutateWeights moves digest, spares input',()=>{
    const r1=mulberry32(475027), r2=mulberry32(475027);
    assert.equal(r1(),r2());
    const w={taste:[0,0,0,0],actor:[1,2,3,4],deep:{x:[5]}};
    const m1=mutateWeights(w,0.05,mulberry32(7));
    const m2=mutateWeights(w,0.05,mulberry32(7));
    assert.deepEqual(m1,m2);
    assert.deepEqual(w,{taste:[0,0,0,0],actor:[1,2,3,4],deep:{x:[5]}});
    assert.ok(m1.taste.some(v=>v!==0));
    assert.ok(Math.abs(m1.actor.reduce((a,b)=>a+b,0)-10)<2);
  });
  it('side stats + offspring helpers on fakes',()=>{
    const r=mksame(475027,1,2,4,6,0.010,0.009,0.003);
    assert.equal(sideSurvival(r,[0,1,2,3,4,5]),5/6);
    assert.equal(sideSurvival(r,[6,7,8,9,10,11]),4/6);
    assert.equal(sideSurvival(r,[12,13,14,15,16,17]),2/6);
    assert.ok(Math.abs(sideIntake(r,[6,7,8,9,10,11])-0.009)<1e-9);
    assert.equal(sideSurvival(r,[]),null);
    assert.equal(sideIntake(r,[]),null);
    assert.equal(sideSurvival(null,[0]),null);
    assert.ok(Math.abs(probeIntake8s(mkskill(475027,'skillT',0.9,0.03))-0.03)<1e-9);
    assert.equal(mutsameOffspringIds(null),null);
  });
  it('scorer GO branch (mut wins shared colony on both gaps)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(cO,mO,nO)=>[trow(475027,'a','b'),mkskill(475027,'skillT',0.9,0.03),mkskill(475027,'skillN',0.7,0.02),
      mkbirth(475027,off,[10,11]),mksame(475027,cO,mO,nO,8,0.010,0.009,0.002),
      trow(475036,'a','b'),mkskill(475036,'skillT',0.9,0.03),mkskill(475036,'skillN',0.7,0.02),
      mkbirth(475036,off,[10,11]),mksame(475036,cO,mO,nO,8,0.010,0.009,0.002)];
    const v=scoreGen1MutsameRows(mk(1,2,6));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-MUTSAME-GO-V1');
    assert.ok(Math.abs(v.mutGap.surv-0.5)<1e-9);
    assert.ok(Math.abs(v.mutGap.intake-0.007)<1e-9);
    assert.equal(v.births,16);
  });
  it('scorer NOGO branches (surv fail / intake fail)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(cO,mO,nO,cR,mR,nR)=>[trow(475027,'a','b'),mkskill(475027,'skillT',0.9,0.03),mkskill(475027,'skillN',0.7,0.02),
      mkbirth(475027,off,[10,11]),mksame(475027,cO,mO,nO,8,cR,mR,nR),
      trow(475036,'a','b'),mkskill(475036,'skillT',0.9,0.03),mkskill(475036,'skillN',0.7,0.02),
      mkbirth(475036,off,[10,11]),mksame(475036,cO,mO,nO,8,cR,mR,nR)];
    assert.equal(scoreGen1MutsameRows(mk(1,5,2,0.010,0.009,0.002)).verdict,'GEN1-MUTSAME-NOGO-V1');
    assert.equal(scoreGen1MutsameRows(mk(1,2,2,0.010,0.003,0.002)).verdict,'GEN1-MUTSAME-NOGO-V1');
  });
  it('scorer INCOMPLETE/INVALID branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(aD,sT,sN,bOff)=>[trow(475027,'a',aD),mkskill(475027,'skillT',0.9,sT),mkskill(475027,'skillN',0.7,sN),
      mkbirth(475027,bOff,[10,11]),mksame(475027,1,2,6,8,0.010,0.009,0.002),
      trow(475036,'a',aD),mkskill(475036,'skillT',0.9,sT),mkskill(475036,'skillN',0.7,sN),
      mkbirth(475036,bOff,[10,11]),mksame(475036,1,2,6,8,0.010,0.009,0.002)];
    assert.equal(scoreGen1MutsameRows(mk('b',0.03,0.02,off)).verdict,'GEN1-MUTSAME-GO-V1');
    assert.equal(scoreGen1MutsameRows(mk('a',0.03,0.02,off)).verdict,'GEN1-MUTSAME-INVALID-NOLEARN');
    assert.equal(scoreGen1MutsameRows(mk('b',0.02,0.02,off)).verdict,'GEN1-MUTSAME-INCOMPLETE-NOSKILL');
    assert.equal(scoreGen1MutsameRows(mk('b',0.03,0.02,[10,11])).verdict,'GEN1-MUTSAME-INCOMPLETE-LOWBIRTHS');
    assert.equal(scoreGen1MutsameRows([trow(475027,'a','b')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GMS_TRAIN_TICKS===512&&GMS_BIRTH_TICKS===1792&&GMS_MIN_OFFSPRING===12);
    assert.ok(GMS_SKILL_TICKS===256&&GMS_SHARED_TICKS===1792&&GMS_MUT_NOISE===0.05);
    assert.ok(GMS_SURV_EDGE===0.10&&GMS_INTAKE_EDGE===0.002);
  });
});
