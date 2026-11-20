// GEN1-CARRY4 V1 fixtures (FROZEN docs/GEN1_CARRY4_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers + probeIntake4 on fakes, split/cause reuse, scorer
// GO/NOGO/INCOMPLETE-NOSKILL/INCOMPLETE-LOWBIRTHS/INVALID branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gcr4Bank,scoreGen1Carry4Rows,causeSplit,carry4SplitLosers,carry4Rate,carry4Toxin,carry4OffspringIds,carry4OffspringSurvival,carry4OffspringRate,probeIntake4,meanToxin,
  GCR4_FIXTURE_SEEDS,GCR4_TRIAGE_SEEDS,GCR4_ARMS,GCR4_TRAIN_TICKS,
  GCR4_PROBE_TICKS,GCR4_B_TICKS,GCR4_APROBE_TICKS,GCR4_EDGE,GCR4_PLACE_ENERGY,GCR4_MIN_OFFSPRING} from '../scripts/gen1-carry4-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='colonyNaive'?'none':'maternal',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkstage=(seed,arm,ticks,rate,n)=>{const ids=Array.from({length:n},(_,i)=>i);const {food,cost}=foodcost(ids,rate,ticks);
  const toxin={};for(const id of ids)toxin[id]=0.005*ticks;
  return {history:{seed},arm,stage:arm[0]==='b'?'btrain':'aprobe',frozen:arm[0]==='p',survival:0.9,meteredTicks:ticks,toxin,food,cost,
  energyCurve:[],series:[],agents:agents(ids,[]),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:ticks,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-carry4-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1carry-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gcr4Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-carry4-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GCR4_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GCR4_FIXTURE_SEEDS[0],474739);
    assert.deepEqual([...GCR4_TRIAGE_SEEDS],[490280,490281,490282,490283,490284,490285,490286,490287,490288]);
    assert.ok(!GCR4_FIXTURE_SEEDS.some(s=>GCR4_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GCR4_ARMS],['trainAB','skillT','skillN','colonyCopy','colonyNaive','preCopy','preNaive','bCopy','bNaive','probeCopy','probeNaive']);
    assert.equal(GCR4_TRAIN_TICKS,512);assert.equal(GCR4_PROBE_TICKS,1792);
    assert.equal(GCR4_B_TICKS,512);assert.equal(GCR4_APROBE_TICKS,256);
    assert.equal(GCR4_EDGE,0.002);assert.equal(GCR4_PLACE_ENERGY,48);
    assert.equal(GCR4_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers + probeIntake4 on fakes',()=>{
    const r=mkcol(474739,'colonyCopy',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(carry4OffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(carry4OffspringSurvival(r),4/6);
    assert.ok(Math.abs(carry4OffspringRate(r)-0.03)<1e-9);
    assert.equal(carry4OffspringIds(null),null);
    assert.equal(carry4OffspringSurvival({agents:agents([0,1],[]),founders:[0,1]}),null);
    assert.ok(Math.abs(probeIntake4(mkstage(474739,'probeCopy',256,0.008,6))-0.008)<1e-9);
    assert.equal(probeIntake4(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(carry4SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (retention fraction holds with post-gap)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(preC,preN,copyRate,naiveRate)=>[trow(474739,'a','b','c'),mkskill(474739,'skillT',0.9,0.03),mkskill(474739,'skillN',0.7,0.02),
      mkcol(474739,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474739,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474739,'preCopy',256,preC,6),mkstage(474739,'preNaive',256,preN,6),
      mkstage(474739,'bCopy',512,0.004,6),mkstage(474739,'bNaive',512,0.001,6),
      mkstage(474739,'probeCopy',256,copyRate,6),mkstage(474739,'probeNaive',256,naiveRate,6),
      trow(474748,'a','b','c'),mkskill(474748,'skillT',0.9,0.03),mkskill(474748,'skillN',0.7,0.02),
      mkcol(474748,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474748,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474748,'preCopy',256,preC,6),mkstage(474748,'preNaive',256,preN,6),
      mkstage(474748,'bCopy',512,0.004,6),mkstage(474748,'bNaive',512,0.001,6),
      mkstage(474748,'probeCopy',256,copyRate,6),mkstage(474748,'probeNaive',256,naiveRate,6)];
    const v=scoreGen1Carry4Rows(mk(0.010,0.002,0.008,0.001));
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-CARRY4-GO-V1');
    assert.ok(Math.abs(v.probeIntake.copy-0.008)<1e-9);
    assert.ok(Math.abs(v.retention.frac-0.88)<1e-9);
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(preC,preN,copyRate,naiveRate,skillT,skillN,colOff)=>[trow(474739,'a','b','c'),mkskill(474739,'skillT',0.9,skillT),mkskill(474739,'skillN',0.7,skillN),
      mkcol(474739,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474739,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkstage(474739,'preCopy',256,preC,6),mkstage(474739,'preNaive',256,preN,6),
      mkstage(474739,'bCopy',512,0.004,6),mkstage(474739,'bNaive',512,0.001,6),
      mkstage(474739,'probeCopy',256,copyRate,6),mkstage(474739,'probeNaive',256,naiveRate,6),
      trow(474748,'a','b','c'),mkskill(474748,'skillT',0.9,skillT),mkskill(474748,'skillN',0.7,skillN),
      mkcol(474748,'colonyCopy',0.5,colOff,[10,11],0.03),mkcol(474748,'colonyNaive',0.4,colOff,[10,11,12,13,14,15],0.02),
      mkstage(474748,'preCopy',256,preC,6),mkstage(474748,'preNaive',256,preN,6),
      mkstage(474748,'bCopy',512,0.004,6),mkstage(474748,'bNaive',512,0.001,6),
      mkstage(474748,'probeCopy',256,copyRate,6),mkstage(474748,'probeNaive',256,naiveRate,6)];
    assert.equal(scoreGen1Carry4Rows(mk(0.010,0.002,0.003,0.001,0.03,0.02,off)).verdict,'GEN1-CARRY4-NOGO-V1');
    assert.equal(scoreGen1Carry4Rows(mk(0.002,0.003,0.008,0.001,0.03,0.02,off)).verdict,'GEN1-CARRY4-INCOMPLETE-NOGAP');
    assert.equal(scoreGen1Carry4Rows(mk(0.010,0.002,0.008,0.001,0.02,0.02,off)).verdict,'GEN1-CARRY4-INCOMPLETE-NOSKILL');
    assert.equal(scoreGen1Carry4Rows(mk(0.010,0.002,0.008,0.001,0.03,0.02,[10,11])).verdict,'GEN1-CARRY4-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(474739,'a','a','c'),mkskill(474739,'skillT',0.9,0.03),mkskill(474739,'skillN',0.7,0.02),
      mkcol(474739,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474739,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474739,'preCopy',256,0.010,6),mkstage(474739,'preNaive',256,0.002,6),
      mkstage(474739,'bCopy',512,0.004,6),mkstage(474739,'bNaive',512,0.001,6),
      mkstage(474739,'probeCopy',256,0.008,6),mkstage(474739,'probeNaive',256,0.001,6),
      trow(474748,'a','a','c'),mkskill(474748,'skillT',0.9,0.03),mkskill(474748,'skillN',0.7,0.02),
      mkcol(474748,'colonyCopy',0.5,off,[10,11],0.03),mkcol(474748,'colonyNaive',0.4,off,[10,11,12,13,14,15],0.02),
      mkstage(474748,'preCopy',256,0.010,6),mkstage(474748,'preNaive',256,0.002,6),
      mkstage(474748,'bCopy',512,0.004,6),mkstage(474748,'bNaive',512,0.001,6),
      mkstage(474748,'probeCopy',256,0.008,6),mkstage(474748,'probeNaive',256,0.001,6)];
    assert.equal(scoreGen1Carry4Rows(rowsN).verdict,'GEN1-CARRY4-INVALID-NOLEARN');
    const bad=[trow(474739,'a','b','c')];
    assert.equal(scoreGen1Carry4Rows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GCR4_TRAIN_TICKS===512&&GCR4_PROBE_TICKS===1792&&GCR4_MIN_OFFSPRING===6);
    assert.ok(GCR4_B_TICKS===512&&GCR4_APROBE_TICKS===256&&GCR4_EDGE===0.002);
  });
});
