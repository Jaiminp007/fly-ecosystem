// GEN1-BIPAR2 V1 fixtures (FROZEN docs/GEN1_BIPAR_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers on fakes, split/cause reuse, mixed-sex placement rule,
// scorer GO/NOGO/FLOOR/INCOMPLETE/INVALID branches (bi gaps per-pair),
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1Bipar2Rows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  BP2_FIXTURE_SEEDS,BP2_TRIAGE_SEEDS,BP2_ARMS,BP2_TRAIN_TICKS,
  BP2_PROBE_TICKS,BP2_PLACE_ENERGY,BP2_MIN_OFFSPRING} from '../scripts/gen1-bipar2-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='naivekid'?'none':(arm==='bi'?'biparental':'maternal'),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-bipar2-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1bipar-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-bipar2-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...BP2_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(BP2_FIXTURE_SEEDS[0],475261);
    assert.deepEqual([...BP2_TRIAGE_SEEDS],[490541,490542,490543,490544,490545,490546,490547,490548,490549]);
    assert.ok(!BP2_FIXTURE_SEEDS.some(s=>BP2_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...BP2_ARMS],['trainAB','skillT','skillN','bi','copy','naivekid']);
    assert.equal(BP2_TRAIN_TICKS,512);assert.equal(BP2_PROBE_TICKS,1792);assert.equal(BP2_PLACE_ENERGY,48);
    assert.equal(BP2_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('mothers are odd ids (sex 0) — placement rule',()=>{
    const mothers=[0,1,2,3,4,5].filter(i=>(i%2)===0).map(i=>i+1);
    assert.deepEqual(mothers,[1,3,5]);
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(475261,'bi',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(offspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(offspringSurvival(r),4/6);
    assert.ok(Math.abs(offspringRate(r)-0.03)<1e-9);
    assert.equal(r.vt,'biparental');
    assert.equal(offspringIds(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(heirSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (recombination preserves edge both pairs)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,bDied,nDied,bR,nR)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'bi',0.5,off,bDied,bR),mkcol(sd,'copy',0.5,off,[10],0.010),mkcol(sd,'naivekid',0.4,off,nDied,nR)];
    const rows=[...mkF(475261,[10,11],[10,11,12,13,14,15],0.009,0.002),...mkF(475270,[10,11],[10,11,12,13,14,15],0.009,0.002)];
    const v=scoreGen1Bipar2Rows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BIPAR2-GO-V1');
    assert.deepEqual(v.biGap.survPairs,[0.5,0.5]);
    assert.equal(v.offspringN.bi,16);
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(bDied,nDied,cDied)=>[trow(475261,'a','b','c'),mkskill(475261,'skillT',0.9,0.03),mkskill(475261,'skillN',0.7,0.02),
      mkcol(475261,'bi',0.5,off,bDied,0.009),mkcol(475261,'copy',0.5,off,cDied,0.010),mkcol(475261,'naivekid',0.4,off,nDied,0.002),
      trow(475270,'a','b','c'),mkskill(475270,'skillT',0.9,0.03),mkskill(475270,'skillN',0.7,0.02),
      mkcol(475270,'bi',0.5,off,bDied,0.009),mkcol(475270,'copy',0.5,off,cDied,0.010),mkcol(475270,'naivekid',0.4,off,nDied,0.002)];
    assert.equal(scoreGen1Bipar2Rows(mk([10,11],[10,11],[10])).verdict,'GEN1-BIPAR2-NOGO-V1');
    assert.equal(scoreGen1Bipar2Rows(mk([10,11],[10,11],[10,11,12,13,14,15,16,17])).verdict,'GEN1-BIPAR2-FLOOR-V1');
    const mkN=[trow(475261,'a','b','c'),mkskill(475261,'skillT',0.7,0.02),mkskill(475261,'skillN',0.7,0.02),
      mkcol(475261,'bi',0.5,off,[10,11],0.009),mkcol(475261,'copy',0.5,off,[10],0.010),mkcol(475261,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475270,'a','b','c'),mkskill(475270,'skillT',0.7,0.02),mkskill(475270,'skillN',0.7,0.02),
      mkcol(475270,'bi',0.5,off,[10,11],0.009),mkcol(475270,'copy',0.5,off,[10],0.010),mkcol(475270,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    assert.equal(scoreGen1Bipar2Rows(mkN).verdict,'GEN1-BIPAR2-INCOMPLETE-NOSKILL');
    const mkB=[trow(475261,'a','b','c'),mkskill(475261,'skillT',0.9,0.03),mkskill(475261,'skillN',0.7,0.02),
      mkcol(475261,'bi',0.5,[10],[10],0.009),mkcol(475261,'copy',0.5,[10],[10],0.010),mkcol(475261,'naivekid',0.4,[10],[10],0.002),
      trow(475270,'a','b','c'),mkskill(475270,'skillT',0.9,0.03),mkskill(475270,'skillN',0.7,0.02),
      mkcol(475270,'bi',0.5,[10],[10],0.009),mkcol(475270,'copy',0.5,[10],[10],0.010),mkcol(475270,'naivekid',0.4,[10],[10],0.002)];
    assert.equal(scoreGen1Bipar2Rows(mkB).verdict,'GEN1-BIPAR2-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(475261,'a','a','c'),mkskill(475261,'skillT',0.9,0.03),mkskill(475261,'skillN',0.7,0.02),
      mkcol(475261,'bi',0.5,off,[10,11],0.009),mkcol(475261,'copy',0.5,off,[10],0.010),mkcol(475261,'naivekid',0.4,off,[10,11],0.002),
      trow(475270,'a','a','c'),mkskill(475270,'skillT',0.9,0.03),mkskill(475270,'skillN',0.7,0.02),
      mkcol(475270,'bi',0.5,off,[10,11],0.009),mkcol(475270,'copy',0.5,off,[10],0.010),mkcol(475270,'naivekid',0.4,off,[10,11],0.002)];
    assert.equal(scoreGen1Bipar2Rows(rowsN).verdict,'GEN1-BIPAR2-INVALID-NOLEARN');
    const bad=[trow(475261,'a','b','c')];
    assert.equal(scoreGen1Bipar2Rows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(BP2_TRAIN_TICKS===512&&BP2_PROBE_TICKS===1792&&BP2_MIN_OFFSPRING===6);
  });
});
