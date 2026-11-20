// GEN1-HEIR3 V1 fixtures (FROZEN docs/GEN1_HEIR3_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers (non-founder split/survival/rate on fakes), split/cause
// reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/INCOMPLETE-LOWBIRTHS/
// INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gh3Bank,scoreGen1Heir3Rows,causeSplit,heir3SplitLosers,heir3Rate,heir3Toxin,heir3OffspringIds,heir3OffspringSurvival,heir3OffspringRate,meanToxin,
  GH3_FIXTURE_SEEDS,GH3_TRIAGE_SEEDS,GH3_ARMS,GH3_TRAIN_TICKS,
  GH3_PROBE_TICKS,GH3_PLACE_ENERGY,GH3_MIN_OFFSPRING} from '../scripts/gen1-heir3-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='naivekid'?'none':'maternal',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-heir3-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1heir-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gh3Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-heir3-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GH3_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GH3_FIXTURE_SEEDS[0],474667);
    assert.deepEqual([...GH3_TRIAGE_SEEDS],[490244,490245,490246,490247,490248,490249,490250,490251,490252]);
    assert.ok(!GH3_FIXTURE_SEEDS.some(s=>GH3_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GH3_ARMS],['trainAB','skillT','skillN','copyFrozen','copyLearn','naivekid']);
    assert.equal(GH3_TRAIN_TICKS,512);assert.equal(GH3_PROBE_TICKS,1792);assert.equal(GH3_PLACE_ENERGY,48);
    assert.equal(GH3_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(474667,'copy',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(heir3OffspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(heir3OffspringSurvival(r),4/6);
    assert.ok(Math.abs(heir3OffspringRate(r)-0.03)<1e-9);
    assert.equal(heir3OffspringIds(null),null);
    assert.equal(heir3OffspringSurvival({agents:agents([0,1],[]),founders:[0,1]}),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(heir3SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (copied skill saves offspring)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rows=[trow(474667,'a','b','c'),mkskill(474667,'skillT',0.9,0.03),mkskill(474667,'skillN',0.7,0.02),
      mkcol(474667,'copyFrozen',0.5,off,[10,11],0.03),mkcol(474667,'copyLearn',0.55,off,[10,11],0.03),mkcol(474667,'naivekid',0.4,off,[10,11,12,13,14,15],0.02),
      trow(474676,'a','b','c'),mkskill(474676,'skillT',0.9,0.03),mkskill(474676,'skillN',0.7,0.02),
      mkcol(474676,'copyFrozen',0.5,off,[10,11],0.03),mkcol(474676,'copyLearn',0.55,off,[10,11],0.03),mkcol(474676,'naivekid',0.4,off,[10,11,12,13,14,15],0.02)];
    const v=scoreGen1Heir3Rows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-HEIR3-GO-V1');
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(cDied,nDied)=>[trow(474667,'a','b','c'),mkskill(474667,'skillT',0.9,0.03),mkskill(474667,'skillN',0.7,0.02),
      mkcol(474667,'copyFrozen',0.5,off,cDied,0.025),mkcol(474667,'copyLearn',0.45,off,cDied,0.025),mkcol(474667,'naivekid',0.5,off,nDied,0.025),
      trow(474676,'a','b','c'),mkskill(474676,'skillT',0.9,0.03),mkskill(474676,'skillN',0.7,0.02),
      mkcol(474676,'copyFrozen',0.5,off,cDied,0.025),mkcol(474676,'copyLearn',0.45,off,cDied,0.025),mkcol(474676,'naivekid',0.5,off,nDied,0.025)];
    assert.equal(scoreGen1Heir3Rows(mk([10,11],[10,11])).verdict,'GEN1-HEIR3-NOGO-V1');
    const mkN=[trow(474667,'a','b','c'),mkskill(474667,'skillT',0.7,0.02),mkskill(474667,'skillN',0.7,0.02),
      mkcol(474667,'copyFrozen',0.5,off,[10,11],0.03),mkcol(474667,'copyLearn',0.55,off,[10,11],0.03),mkcol(474667,'naivekid',0.4,off,[10,11,12,13,14,15],0.02),
      trow(474676,'a','b','c'),mkskill(474676,'skillT',0.7,0.02),mkskill(474676,'skillN',0.7,0.02),
      mkcol(474676,'copyFrozen',0.5,off,[10,11],0.03),mkcol(474676,'copyLearn',0.55,off,[10,11],0.03),mkcol(474676,'naivekid',0.4,off,[10,11,12,13,14,15],0.02)];
    assert.equal(scoreGen1Heir3Rows(mkN).verdict,'GEN1-HEIR3-INCOMPLETE-NOSKILL');
    const mkB=[trow(474667,'a','b','c'),mkskill(474667,'skillT',0.9,0.03),mkskill(474667,'skillN',0.7,0.02),
      mkcol(474667,'copyFrozen',0.5,[10,11],[10],0.03),mkcol(474667,'copyLearn',0.5,[10,11],[10],0.03),mkcol(474667,'naivekid',0.4,[10,11],[10],0.02),
      trow(474676,'a','b','c'),mkskill(474676,'skillT',0.9,0.03),mkskill(474676,'skillN',0.7,0.02),
      mkcol(474676,'copyFrozen',0.5,[10,11],[10],0.03),mkcol(474676,'copyLearn',0.5,[10,11],[10],0.03),mkcol(474676,'naivekid',0.4,[10,11],[10],0.02)];
    assert.equal(scoreGen1Heir3Rows(mkB).verdict,'GEN1-HEIR3-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474667,'a','a','c'),mkskill(474667,'skillT',0.9,0.03),mkskill(474667,'skillN',0.7,0.02),
      mkcol(474667,'copyFrozen',0.5,[10,11],[10],0.03),mkcol(474667,'copyLearn',0.5,[10,11],[10],0.03),mkcol(474667,'naivekid',0.4,[10,11],[10],0.02),
      trow(474676,'a','a','c'),mkskill(474676,'skillT',0.9,0.03),mkskill(474676,'skillN',0.7,0.02),
      mkcol(474676,'copyFrozen',0.5,[10,11],[10],0.03),mkcol(474676,'copyLearn',0.5,[10,11],[10],0.03),mkcol(474676,'naivekid',0.4,[10,11],[10],0.02)];
    assert.equal(scoreGen1Heir3Rows(rowsN).verdict,'GEN1-HEIR3-INVALID-NOLEARN');
    const bad=[trow(474667,'a','b','c')];
    assert.equal(scoreGen1Heir3Rows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(GH3_TRAIN_TICKS===512&&GH3_PROBE_TICKS===1792&&GH3_MIN_OFFSPRING===6);
  });
});
