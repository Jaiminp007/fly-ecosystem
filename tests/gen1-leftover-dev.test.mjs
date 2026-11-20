// GEN1-LEFTOVER V1 fixtures (FROZEN docs/GEN1_LEFTOVER_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, probeIntake9
// on fakes, split/cause reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/
// INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {glfBank,scoreGen1LeftoverRows,causeSplit,leftoverSplitLosers,leftoverRate,leftoverToxin,probeIntake9,meanToxin,
  GLF_FIXTURE_SEEDS,GLF_TRIAGE_SEEDS,GLF_ARMS,GLF_TRAIN_TICKS,
  GLF_PROBE_TICKS,GLF_SKILL_TICKS,GLF_APROBE_TICKS,GLF_SHAPE_TICKS,GLF_LEARN_TICKS,GLF_EDGE,GLF_PLACE_ENERGY} from '../scripts/gen1-leftover-dev.mjs';

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
const mkworld=(seed,arm,surv,rate,lids)=>{const ids=Array.from({length:24},(_,i)=>i);const {food,cost}=foodcost(ids,rate,1792);
  const toxin={};for(const id of ids)toxin[id]=0.005*1792;
  return {history:{seed},arm,stage:'world',frozen:false,survival:surv,meteredTicks:1792,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,learnerIds:lids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:2304,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkprobe=(seed,arm,rate,n=24)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,256);
  const toxin={};for(const id of ids)toxin[id]=0.005*256;
  return {history:{seed},arm,stage:'aprobe',frozen:true,survival:0.9,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,learnerIds:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-leftover-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1leftover-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=glfBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-leftover-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GLF_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GLF_FIXTURE_SEEDS[0],474793);
    assert.deepEqual([...GLF_TRIAGE_SEEDS],[490307,490308,490309,490310,490311,490312,490313,490314,490315]);
    assert.ok(!GLF_FIXTURE_SEEDS.some(s=>GLF_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GLF_ARMS],['trainA','skillT','skillN','leftover','dummyfresh','probeLeft','probeFresh']);
    assert.equal(GLF_TRAIN_TICKS,512);assert.equal(GLF_PROBE_TICKS,1792);
    assert.equal(GLF_SKILL_TICKS,256);assert.equal(GLF_APROBE_TICKS,256);
    assert.equal(GLF_SHAPE_TICKS,256);
    assert.equal(GLF_EDGE,0.002);assert.equal(GLF_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('probeIntake9 on fakes',()=>{
    assert.ok(Math.abs(probeIntake9(mkprobe(474793,'probeLeft',0.008))-0.008)<1e-9);
    assert.equal(probeIntake9(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(leftoverSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (leftover field teaches)',()=>{
    const lids=Array.from({length:24},(_,i)=>i);
    const mk=(lRate,fRate)=>[trow(474793,'a','b'),mkskill(474793,'skillT',0.9,0.03),mkskill(474793,'skillN',0.7,0.02),
      mkworld(474793,'leftover',0.5,0.01,lids),mkworld(474793,'dummyfresh',0.4,0.008,lids),
      mkprobe(474793,'probeLeft',lRate),mkprobe(474793,'probeFresh',fRate),
      trow(474802,'a','b'),mkskill(474802,'skillT',0.9,0.03),mkskill(474802,'skillN',0.7,0.02),
      mkworld(474802,'leftover',0.5,0.01,lids),mkworld(474802,'dummyfresh',0.4,0.008,lids),
      mkprobe(474802,'probeLeft',lRate),mkprobe(474802,'probeFresh',fRate)];
    const v=scoreGen1LeftoverRows(mk(0.008,0.001));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-LEFTOVER-GO-V1');
    assert.ok(Math.abs(v.probeIntake.leftover-0.008)<1e-9);
    assert.ok(Math.abs(v.probeIntake.edge-0.007)<1e-9);
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const lids=Array.from({length:24},(_,i)=>i);
    const mk=(lRate,fRate,skillT,skillN)=>[trow(474793,'a','b'),mkskill(474793,'skillT',0.9,skillT),mkskill(474793,'skillN',0.7,skillN),
      mkworld(474793,'leftover',0.5,0.01,lids),mkworld(474793,'dummyfresh',0.4,0.008,lids),
      mkprobe(474793,'probeLeft',lRate),mkprobe(474793,'probeFresh',fRate),
      trow(474802,'a','b'),mkskill(474802,'skillT',0.9,skillT),mkskill(474802,'skillN',0.7,skillN),
      mkworld(474802,'leftover',0.5,0.01,lids),mkworld(474802,'dummyfresh',0.4,0.008,lids),
      mkprobe(474802,'probeLeft',lRate),mkprobe(474802,'probeFresh',fRate)];
    assert.equal(scoreGen1LeftoverRows(mk(0.002,0.001,0.03,0.02)).verdict,'GEN1-LEFTOVER-NOGO-V1');
    assert.equal(scoreGen1LeftoverRows(mk(0.008,0.001,0.02,0.02)).verdict,'GEN1-LEFTOVER-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const lids=Array.from({length:24},(_,i)=>i);
    const rowsN=[trow(474793,'a','a'),mkskill(474793,'skillT',0.9,0.03),mkskill(474793,'skillN',0.7,0.02),
      mkworld(474793,'leftover',0.5,0.01,lids),mkworld(474793,'dummyfresh',0.4,0.008,lids),
      mkprobe(474793,'probeLeft',0.008),mkprobe(474793,'probeFresh',0.001),
      trow(474802,'a','a'),mkskill(474802,'skillT',0.9,0.03),mkskill(474802,'skillN',0.7,0.02),
      mkworld(474802,'leftover',0.5,0.01,lids),mkworld(474802,'dummyfresh',0.4,0.008,lids),
      mkprobe(474802,'probeLeft',0.008),mkprobe(474802,'probeFresh',0.001)];
    assert.equal(scoreGen1LeftoverRows(rowsN).verdict,'GEN1-LEFTOVER-INVALID-NOLEARN');
    const bad=[trow(474793,'a','b')];
    assert.equal(scoreGen1LeftoverRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GLF_TRAIN_TICKS===512&&GLF_PROBE_TICKS===1792&&GLF_EDGE===0.002);
    assert.ok(GLF_SKILL_TICKS===256&&GLF_APROBE_TICKS===256&&GLF_SHAPE_TICKS===256&&GLF_LEARN_TICKS===256);
  });
});
