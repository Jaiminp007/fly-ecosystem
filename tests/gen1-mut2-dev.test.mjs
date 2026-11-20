// GEN1-MUT2 V1 fixtures (FROZEN docs/GEN1_MUT2_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8r on fakes, split/cause reuse, scorer
// GO/NOGO/INCOMPLETE/INVALID branches, constants (incl. noise).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmuBank,scoreGen1Mut2Rows,causeSplit,mut2SplitLosers,mut2Rate,mut2Toxin,mut2OffspringIds,mut2OffspringSurvival,mut2OffspringRate,probeIntake8r,meanToxin,
  GMU_FIXTURE_SEEDS,GMU_TRIAGE_SEEDS,GMU_ARMS,GMU_TRAIN_TICKS,
  GMU_PROBE_TICKS,GMU_SKILL_TICKS,GMU_APROBE_TICKS,GMU_EDGE,GMU_PLACE_ENERGY,GMU_MIN_OFFSPRING,GMU_MUT_NOISE} from '../scripts/gen1-mut2-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='colonyNaive'?'none':'maternal',tn:arm==='colonyMut'?0.01:null,trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkprobe=(seed,arm,rate,n=6)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,256);
  const toxin={};for(const id of ids)toxin[id]=0.005*256;
  return {history:{seed},arm,stage:'aprobe',frozen:true,survival:0.9,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-mut2-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1mut2-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmuBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-mut2-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GMU_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GMU_FIXTURE_SEEDS[0],474937);
    assert.deepEqual([...GMU_TRIAGE_SEEDS],[490379,490380,490381,490382,490383,490384,490385,490386,490387]);
    assert.ok(!GMU_FIXTURE_SEEDS.some(s=>GMU_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GMU_ARMS],['trainAB','skillT','skillN','colonyCopy','colonyMut','colonyNaive','probeCopy','probeMut','probeNaive']);
    assert.equal(GMU_TRAIN_TICKS,512);assert.equal(GMU_PROBE_TICKS,1792);
    assert.equal(GMU_SKILL_TICKS,256);assert.equal(GMU_APROBE_TICKS,256);
    assert.equal(GMU_EDGE,0.002);assert.equal(GMU_PLACE_ENERGY,48);
    assert.equal(GMU_MIN_OFFSPRING,6);assert.equal(GMU_MUT_NOISE,0.05);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake8r on fakes',()=>{
    const r=mkcol(474937,'colonyCopy',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(mut2OffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(mut2OffspringSurvival(r),4/6);
    assert.ok(Math.abs(mut2OffspringRate(r)-0.03)<1e-9);
    assert.equal(mut2OffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8r(mkprobe(474937,'probeMut',0.006))-0.006)<1e-9);
    assert.equal(probeIntake8r(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(mut2SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (natural mutation preserves a usable edge)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(copyR,mutR,naiveR)=>[trow(474937,'a','b','c'),mkskill(474937,'skillT',0.9,0.03),mkskill(474937,'skillN',0.7,0.02),
      mkcol(474937,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474937,'colonyMut',0.5,off,[10,11],0.03),mkcol(474937,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474937,'probeCopy',copyR),mkprobe(474937,'probeMut',mutR),mkprobe(474937,'probeNaive',naiveR),
      trow(474946,'a','b','c'),mkskill(474946,'skillT',0.9,0.03),mkskill(474946,'skillN',0.7,0.02),
      mkcol(474946,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474946,'colonyMut',0.5,off,[10,11],0.03),mkcol(474946,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474946,'probeCopy',copyR),mkprobe(474946,'probeMut',mutR),mkprobe(474946,'probeNaive',naiveR)];
    const v=scoreGen1Mut2Rows(mk(0.008,0.006,0.001));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-MUT2-GO-V1');
    assert.ok(Math.abs(v.probeIntake.mut-0.006)<1e-9);
    assert.ok(Math.abs(v.probeIntake.mutGap-0.005)<1e-9);
    assert.ok(Math.abs(v.probeIntake.copyMutCost-0.002)<1e-9);
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(copyR,mutR,naiveR,skillT,skillN,colOff)=>[trow(474937,'a','b','c'),mkskill(474937,'skillT',0.9,skillT),mkskill(474937,'skillN',0.7,skillN),
      mkcol(474937,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474937,'colonyMut',0.5,colOff,[10,11],0.03),mkcol(474937,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkprobe(474937,'probeCopy',copyR),mkprobe(474937,'probeMut',mutR),mkprobe(474937,'probeNaive',naiveR),
      trow(474946,'a','b','c'),mkskill(474946,'skillT',0.9,skillT),mkskill(474946,'skillN',0.7,skillN),
      mkcol(474946,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474946,'colonyMut',0.5,colOff,[10,11],0.03),mkcol(474946,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkprobe(474946,'probeCopy',copyR),mkprobe(474946,'probeMut',mutR),mkprobe(474946,'probeNaive',naiveR)];
    assert.equal(scoreGen1Mut2Rows(mk(0.008,0.002,0.001,0.03,0.02,off)).verdict,'GEN1-MUT2-NOGO-V1');
    assert.equal(scoreGen1Mut2Rows(mk(0.008,0.006,0.001,0.02,0.02,off)).verdict,'GEN1-MUT2-INCOMPLETE-NOSKILL');
    assert.equal(scoreGen1Mut2Rows(mk(0.008,0.006,0.001,0.03,0.02,[10,11])).verdict,'GEN1-MUT2-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(474937,'a','a','c'),mkskill(474937,'skillT',0.9,0.03),mkskill(474937,'skillN',0.7,0.02),
      mkcol(474937,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474937,'colonyMut',0.5,off,[10,11],0.03),mkcol(474937,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474937,'probeCopy',0.008),mkprobe(474937,'probeMut',0.006),mkprobe(474937,'probeNaive',0.001),
      trow(474946,'a','a','c'),mkskill(474946,'skillT',0.9,0.03),mkskill(474946,'skillN',0.7,0.02),
      mkcol(474946,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474946,'colonyMut',0.5,off,[10,11],0.03),mkcol(474946,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474946,'probeCopy',0.008),mkprobe(474946,'probeMut',0.006),mkprobe(474946,'probeNaive',0.001)];
    assert.equal(scoreGen1Mut2Rows(rowsN).verdict,'GEN1-MUT2-INVALID-NOLEARN');
    const bad=[trow(474937,'a','b','c')];
    assert.equal(scoreGen1Mut2Rows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GMU_TRAIN_TICKS===512&&GMU_PROBE_TICKS===1792&&GMU_MIN_OFFSPRING===6);
    assert.ok(GMU_SKILL_TICKS===256&&GMU_APROBE_TICKS===256&&GMU_EDGE===0.002);
    assert.ok(GMU_MUT_NOISE===0.05);
  });
});
