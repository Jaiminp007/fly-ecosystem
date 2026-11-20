// GEN1-MUT V1 fixtures (FROZEN docs/GEN1_MUT_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake8q on fakes, split/cause reuse, scorer
// GO/NOGO/INCOMPLETE/INVALID branches, constants (incl. noise).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gmtBank,scoreGen1MutRows,causeSplit,mutSplitLosers,mutRate,mutToxin,mutOffspringIds,mutOffspringSurvival,mutOffspringRate,probeIntake8q,meanToxin,
  GMT_FIXTURE_SEEDS,GMT_TRIAGE_SEEDS,GMT_ARMS,GMT_TRAIN_TICKS,
  GMT_PROBE_TICKS,GMT_SKILL_TICKS,GMT_APROBE_TICKS,GMT_EDGE,GMT_PLACE_ENERGY,GMT_MIN_OFFSPRING,GMT_MUT_NOISE} from '../scripts/gen1-mut-dev.mjs';

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

describe('gen1-mut-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1mut-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gmtBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-mut-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GMT_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GMT_FIXTURE_SEEDS[0],474919);
    assert.deepEqual([...GMT_TRIAGE_SEEDS],[490370,490371,490372,490373,490374,490375,490376,490377,490378]);
    assert.ok(!GMT_FIXTURE_SEEDS.some(s=>GMT_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GMT_ARMS],['trainAB','skillT','skillN','colonyCopy','colonyMut','colonyNaive','probeCopy','probeMut','probeNaive']);
    assert.equal(GMT_TRAIN_TICKS,512);assert.equal(GMT_PROBE_TICKS,1792);
    assert.equal(GMT_SKILL_TICKS,256);assert.equal(GMT_APROBE_TICKS,256);
    assert.equal(GMT_EDGE,0.002);assert.equal(GMT_PLACE_ENERGY,48);
    assert.equal(GMT_MIN_OFFSPRING,6);assert.equal(GMT_MUT_NOISE,0.01);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake8q on fakes',()=>{
    const r=mkcol(474919,'colonyCopy',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(mutOffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(mutOffspringSurvival(r),4/6);
    assert.ok(Math.abs(mutOffspringRate(r)-0.03)<1e-9);
    assert.equal(mutOffspringIds(null),null);
    assert.ok(Math.abs(probeIntake8q(mkprobe(474919,'probeMut',0.006))-0.006)<1e-9);
    assert.equal(probeIntake8q(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(mutSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (natural mutation preserves a usable edge)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(copyR,mutR,naiveR)=>[trow(474919,'a','b','c'),mkskill(474919,'skillT',0.9,0.03),mkskill(474919,'skillN',0.7,0.02),
      mkcol(474919,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474919,'colonyMut',0.5,off,[10,11],0.03),mkcol(474919,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474919,'probeCopy',copyR),mkprobe(474919,'probeMut',mutR),mkprobe(474919,'probeNaive',naiveR),
      trow(474928,'a','b','c'),mkskill(474928,'skillT',0.9,0.03),mkskill(474928,'skillN',0.7,0.02),
      mkcol(474928,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474928,'colonyMut',0.5,off,[10,11],0.03),mkcol(474928,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474928,'probeCopy',copyR),mkprobe(474928,'probeMut',mutR),mkprobe(474928,'probeNaive',naiveR)];
    const v=scoreGen1MutRows(mk(0.008,0.006,0.001));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-MUT-GO-V1');
    assert.ok(Math.abs(v.probeIntake.mut-0.006)<1e-9);
    assert.ok(Math.abs(v.probeIntake.mutGap-0.005)<1e-9);
    assert.ok(Math.abs(v.probeIntake.copyMutCost-0.002)<1e-9);
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(copyR,mutR,naiveR,skillT,skillN,colOff)=>[trow(474919,'a','b','c'),mkskill(474919,'skillT',0.9,skillT),mkskill(474919,'skillN',0.7,skillN),
      mkcol(474919,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474919,'colonyMut',0.5,colOff,[10,11],0.03),mkcol(474919,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkprobe(474919,'probeCopy',copyR),mkprobe(474919,'probeMut',mutR),mkprobe(474919,'probeNaive',naiveR),
      trow(474928,'a','b','c'),mkskill(474928,'skillT',0.9,skillT),mkskill(474928,'skillN',0.7,skillN),
      mkcol(474928,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474928,'colonyMut',0.5,colOff,[10,11],0.03),mkcol(474928,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkprobe(474928,'probeCopy',copyR),mkprobe(474928,'probeMut',mutR),mkprobe(474928,'probeNaive',naiveR)];
    assert.equal(scoreGen1MutRows(mk(0.008,0.002,0.001,0.03,0.02,off)).verdict,'GEN1-MUT-NOGO-V1');
    assert.equal(scoreGen1MutRows(mk(0.008,0.006,0.001,0.02,0.02,off)).verdict,'GEN1-MUT-INCOMPLETE-NOSKILL');
    assert.equal(scoreGen1MutRows(mk(0.008,0.006,0.001,0.03,0.02,[10,11])).verdict,'GEN1-MUT-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(474919,'a','a','c'),mkskill(474919,'skillT',0.9,0.03),mkskill(474919,'skillN',0.7,0.02),
      mkcol(474919,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474919,'colonyMut',0.5,off,[10,11],0.03),mkcol(474919,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474919,'probeCopy',0.008),mkprobe(474919,'probeMut',0.006),mkprobe(474919,'probeNaive',0.001),
      trow(474928,'a','a','c'),mkskill(474928,'skillT',0.9,0.03),mkskill(474928,'skillN',0.7,0.02),
      mkcol(474928,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474928,'colonyMut',0.5,off,[10,11],0.03),mkcol(474928,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkprobe(474928,'probeCopy',0.008),mkprobe(474928,'probeMut',0.006),mkprobe(474928,'probeNaive',0.001)];
    assert.equal(scoreGen1MutRows(rowsN).verdict,'GEN1-MUT-INVALID-NOLEARN');
    const bad=[trow(474919,'a','b','c')];
    assert.equal(scoreGen1MutRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GMT_TRAIN_TICKS===512&&GMT_PROBE_TICKS===1792&&GMT_MIN_OFFSPRING===6);
    assert.ok(GMT_SKILL_TICKS===256&&GMT_APROBE_TICKS===256&&GMT_EDGE===0.002);
    assert.ok(GMT_MUT_NOISE===0.01);
  });
});
