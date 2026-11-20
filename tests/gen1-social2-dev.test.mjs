// GEN1-SOCIAL2 V1 fixtures (FROZEN docs/GEN1_SOCIAL_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers on fakes, split/cause reuse, scorer GO/NOGO/FLOOR/
// INCOMPLETE/INVALID branches (social gaps per-pair), constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1Social2Rows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  SO2_FIXTURE_SEEDS,SO2_TRIAGE_SEEDS,SO2_ARMS,SO2_TRAIN_TICKS,
  SO2_PROBE_TICKS,SO2_PLACE_ENERGY,SO2_MIN_OFFSPRING} from '../scripts/gen1-social2-dev.mjs';

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
  founders:[0,1,2,3],vt:arm==='naivekid'?'none':(arm==='social'?'copyconditional':'maternal'),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-social2-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1social-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-social2-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...SO2_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(SO2_FIXTURE_SEEDS[0],475315);
    assert.deepEqual([...SO2_TRIAGE_SEEDS],[490568,490569,490570,490571,490572,490573,490574,490575,490576]);
    assert.ok(!SO2_FIXTURE_SEEDS.some(s=>SO2_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...SO2_ARMS],['trainAB','skillT','skillN','social','copy','naivekid']);
    assert.equal(SO2_TRAIN_TICKS,512);assert.equal(SO2_PROBE_TICKS,1792);assert.equal(SO2_PLACE_ENERGY,48);
    assert.equal(SO2_MIN_OFFSPRING,6);
    rmSync(dir,{recursive:true,force:true});
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(475315,'social',0.5,[10,11,12,13,14,15],[10,11],0.03);
    for(const id of [10,11]){r.food[id]=0.03*1500;r.cost[id]=0.03*1500*1.4;}
    assert.deepEqual(offspringIds(r).map(a=>a.id),[10,11,12,13,14,15]);
    assert.equal(offspringSurvival(r),4/6);
    assert.ok(Math.abs(offspringRate(r)-0.03)<1e-9);
    assert.equal(r.vt,'copyconditional');
    assert.equal(offspringIds(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(heirSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:50},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (social works both pairs)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mkF=(sd,sDied,nDied,sR,nR)=>[trow(sd,'a','b','c'),mkskill(sd,'skillT',0.9,0.03),mkskill(sd,'skillN',0.7,0.02),
      mkcol(sd,'social',0.5,off,sDied,sR),mkcol(sd,'copy',0.5,off,[10],0.010),mkcol(sd,'naivekid',0.4,off,nDied,nR)];
    const rows=[...mkF(475315,[10,11],[10,11,12,13,14,15],0.009,0.002),...mkF(475324,[10,11],[10,11,12,13,14,15],0.009,0.002)];
    const v=scoreGen1Social2Rows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-SOCIAL2-GO-V1');
    assert.deepEqual(v.socialGap.survPairs,[0.5,0.5]);
    assert.equal(v.offspringN.social,16);
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(sDied,nDied,cDied)=>[trow(475315,'a','b','c'),mkskill(475315,'skillT',0.9,0.03),mkskill(475315,'skillN',0.7,0.02),
      mkcol(475315,'social',0.5,off,sDied,0.009),mkcol(475315,'copy',0.5,off,cDied,0.010),mkcol(475315,'naivekid',0.5,off,nDied,0.002),
      trow(475324,'a','b','c'),mkskill(475324,'skillT',0.9,0.03),mkskill(475324,'skillN',0.7,0.02),
      mkcol(475324,'social',0.5,off,sDied,0.009),mkcol(475324,'copy',0.5,off,cDied,0.010),mkcol(475324,'naivekid',0.5,off,nDied,0.002)];
    assert.equal(scoreGen1Social2Rows(mk([10,11],[10,11],[10])).verdict,'GEN1-SOCIAL2-NOGO-V1');
    assert.equal(scoreGen1Social2Rows(mk([10,11],[10,11],[10,11,12,13,14,15,16,17])).verdict,'GEN1-SOCIAL2-FLOOR-V1');
    const mkN=[trow(475315,'a','b','c'),mkskill(475315,'skillT',0.7,0.02),mkskill(475315,'skillN',0.7,0.02),
      mkcol(475315,'social',0.5,off,[10,11],0.009),mkcol(475315,'copy',0.5,off,[10],0.010),mkcol(475315,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475324,'a','b','c'),mkskill(475324,'skillT',0.7,0.02),mkskill(475324,'skillN',0.7,0.02),
      mkcol(475324,'social',0.5,off,[10,11],0.009),mkcol(475324,'copy',0.5,off,[10],0.010),mkcol(475324,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    assert.equal(scoreGen1Social2Rows(mkN).verdict,'GEN1-SOCIAL2-INCOMPLETE-NOSKILL');
    const mkB=[trow(475315,'a','b','c'),mkskill(475315,'skillT',0.9,0.03),mkskill(475315,'skillN',0.7,0.02),
      mkcol(475315,'social',0.5,[10],[10],0.009),mkcol(475315,'copy',0.5,[10],[10],0.010),mkcol(475315,'naivekid',0.4,[10],[10],0.002),
      trow(475324,'a','b','c'),mkskill(475324,'skillT',0.9,0.03),mkskill(475324,'skillN',0.7,0.02),
      mkcol(475324,'social',0.5,[10],[10],0.009),mkcol(475324,'copy',0.5,[10],[10],0.010),mkcol(475324,'naivekid',0.4,[10],[10],0.002)];
    assert.equal(scoreGen1Social2Rows(mkB).verdict,'GEN1-SOCIAL2-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(475315,'a','a','c'),mkskill(475315,'skillT',0.9,0.03),mkskill(475315,'skillN',0.7,0.02),
      mkcol(475315,'social',0.5,off,[10,11],0.009),mkcol(475315,'copy',0.5,off,[10],0.010),mkcol(475315,'naivekid',0.4,off,[10,11],0.002),
      trow(475324,'a','a','c'),mkskill(475324,'skillT',0.9,0.03),mkskill(475324,'skillN',0.7,0.02),
      mkcol(475324,'social',0.5,off,[10,11],0.009),mkcol(475324,'copy',0.5,off,[10],0.010),mkcol(475324,'naivekid',0.4,off,[10,11],0.002)];
    assert.equal(scoreGen1Social2Rows(rowsN).verdict,'GEN1-SOCIAL2-INVALID-NOLEARN');
    const bad=[trow(475315,'a','b','c')];
    assert.equal(scoreGen1Social2Rows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(SO2_TRAIN_TICKS===512&&SO2_PROBE_TICKS===1792&&SO2_MIN_OFFSPRING===6);
  });
});
