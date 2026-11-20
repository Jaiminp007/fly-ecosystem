// GEN1-COHAB V1 fixtures (FROZEN docs/GEN1_COHAB_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, probeIntake0
// on fakes, split/cause reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/
// INVALID branches, mixed-placement unit, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gcoBank,scoreGen1CohabRows,causeSplit,cohabSplitLosers,cohabRate,cohabToxin,probeIntake0,meanToxin,
  GCO_FIXTURE_SEEDS,GCO_TRIAGE_SEEDS,GCO_ARMS,GCO_TRAIN_TICKS,
  GCO_PROBE_TICKS,GCO_SKILL_TICKS,GCO_APROBE_TICKS,GCO_EDGE,GCO_PLACE_ENERGY} from '../scripts/gen1-cohab-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD)=>({history:{seed},arm:'trainA',stage:'train',survival:0.9,meteredTicks:512,
  initDigest:initD,aDigest:aD,bDigest:aD,
  deathCauses:{energy:0,age:0},endpoint:{tick:512,budgetAdjustedEnergyPerFounder:-60.0}});
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkcohab=(seed,arm,surv,rate)=>{const ids=Array.from({length:24},(_,i)=>i);const {food,cost}=foodcost(ids,rate,1792);
  const toxin={};for(const id of ids)toxin[id]=0.005*1792;
  return {history:{seed},arm,stage:'cohab',frozen:false,survival:surv,meteredTicks:1792,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,learnerIds:ids.slice(12),vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkprobe=(seed,arm,rate,n=12)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,256);
  const toxin={};for(const id of ids)toxin[id]=0.005*256;
  return {history:{seed},arm,stage:'aprobe',frozen:true,survival:0.9,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,learnerIds:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-cohab-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1cohab-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gcoBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-cohab-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GCO_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GCO_FIXTURE_SEEDS[0],474775);
    assert.deepEqual([...GCO_TRIAGE_SEEDS],[490298,490299,490300,490301,490302,490303,490304,490305,490306]);
    assert.ok(!GCO_FIXTURE_SEEDS.some(s=>GCO_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GCO_ARMS],['trainA','skillT','skillN','shared','alone','probeShared','probeAlone']);
    assert.equal(GCO_TRAIN_TICKS,512);assert.equal(GCO_PROBE_TICKS,1792);
    assert.equal(GCO_SKILL_TICKS,256);assert.equal(GCO_APROBE_TICKS,256);
    assert.equal(GCO_EDGE,0.002);assert.equal(GCO_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('probeIntake0 on fakes',()=>{
    assert.ok(Math.abs(probeIntake0(mkprobe(474775,'probeShared',0.008))-0.008)<1e-9);
    assert.equal(probeIntake0(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(cohabSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (cohabitation teaches)',()=>{
    const mk=(sRate,aRate)=>[trow(474775,'a','b'),mkskill(474775,'skillT',0.9,0.03),mkskill(474775,'skillN',0.7,0.02),
      mkcohab(474775,'shared',0.5,0.01),mkcohab(474775,'alone',0.4,0.008),
      mkprobe(474775,'probeShared',sRate),mkprobe(474775,'probeAlone',aRate),
      trow(474784,'a','b'),mkskill(474784,'skillT',0.9,0.03),mkskill(474784,'skillN',0.7,0.02),
      mkcohab(474784,'shared',0.5,0.01),mkcohab(474784,'alone',0.4,0.008),
      mkprobe(474784,'probeShared',sRate),mkprobe(474784,'probeAlone',aRate)];
    const v=scoreGen1CohabRows(mk(0.008,0.001));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-COHAB-GO-V1');
    assert.ok(Math.abs(v.probeIntake.shared-0.008)<1e-9);
    assert.ok(Math.abs(v.probeIntake.edge-0.007)<1e-9);
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const mk=(sRate,aRate,skillT,skillN)=>[trow(474775,'a','b'),mkskill(474775,'skillT',0.9,skillT),mkskill(474775,'skillN',0.7,skillN),
      mkcohab(474775,'shared',0.5,0.01),mkcohab(474775,'alone',0.4,0.008),
      mkprobe(474775,'probeShared',sRate),mkprobe(474775,'probeAlone',aRate),
      trow(474784,'a','b'),mkskill(474784,'skillT',0.9,skillT),mkskill(474784,'skillN',0.7,skillN),
      mkcohab(474784,'shared',0.5,0.01),mkcohab(474784,'alone',0.4,0.008),
      mkprobe(474784,'probeShared',sRate),mkprobe(474784,'probeAlone',aRate)];
    assert.equal(scoreGen1CohabRows(mk(0.002,0.001,0.03,0.02)).verdict,'GEN1-COHAB-NOGO-V1');
    assert.equal(scoreGen1CohabRows(mk(0.008,0.001,0.02,0.02)).verdict,'GEN1-COHAB-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474775,'a','a'),mkskill(474775,'skillT',0.9,0.03),mkskill(474775,'skillN',0.7,0.02),
      mkcohab(474775,'shared',0.5,0.01),mkcohab(474775,'alone',0.4,0.008),
      mkprobe(474775,'probeShared',0.008),mkprobe(474775,'probeAlone',0.001),
      trow(474784,'a','a'),mkskill(474784,'skillT',0.9,0.03),mkskill(474784,'skillN',0.7,0.02),
      mkcohab(474784,'shared',0.5,0.01),mkcohab(474784,'alone',0.4,0.008),
      mkprobe(474784,'probeShared',0.008),mkprobe(474784,'probeAlone',0.001)];
    assert.equal(scoreGen1CohabRows(rowsN).verdict,'GEN1-COHAB-INVALID-NOLEARN');
    const bad=[trow(474775,'a','b')];
    assert.equal(scoreGen1CohabRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GCO_TRAIN_TICKS===512&&GCO_PROBE_TICKS===1792&&GCO_EDGE===0.002);
    assert.ok(GCO_SKILL_TICKS===256&&GCO_APROBE_TICKS===256);
  });
});
