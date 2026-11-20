// GEN1-BIPARWIN V1 fixtures (FROZEN docs/GEN1_BIPAR_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, offspring
// helpers on fakes, split/cause reuse, mixed-sex placement rule,
// scorer GO/NOGO/FLOOR/INCOMPLETE/INVALID branches (bi gaps per-pair),
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1BiparwinRows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  BPW_FIXTURE_SEEDS,BPW_TRIAGE_SEEDS,BPW_ARMS,BPW_TRAIN_TICKS,
  BPW_PROBE_TICKS,BPW_PLACE_ENERGY,BPW_MIN_OFFSPRING} from '../scripts/gen1-biparwin-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,offIds,offDied,rate)=>{const {food,cost}=foodcost([0,1,2,3,...offIds],rate,900);
  const toxin={};for(const id of [0,1,2,3,...offIds])toxin[id]=0.005*900;
  return {history:{seed},arm,stage:'colony',frozen:true,survival:surv,meteredTicks:900,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3,...offIds],offDied),
  founders:[0,1,2,3],vt:arm==='naivekid'?'none':(arm==='bi'?'biparental':'maternal'),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:offDied.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-biparwin-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1bipar-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-biparwin-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...BPW_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(BPW_FIXTURE_SEEDS[0],475423);
    assert.deepEqual([...BPW_TRIAGE_SEEDS],[490622,490623,490624,490625,490626,490627,490628,490629,490630]);
    assert.ok(!BPW_FIXTURE_SEEDS.some(s=>BPW_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...BPW_ARMS],['trainAB','skillT','skillN','bi','copy','naivekid']);
    assert.equal(BPW_TRAIN_TICKS,512);assert.equal(BPW_PROBE_TICKS,900);assert.equal(BPW_PLACE_ENERGY,48);
    assert.equal(BPW_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('mothers are odd ids (sex 0) — placement rule',()=>{
    const mothers=[0,1,2,3,4,5].filter(i=>(i%2)===0).map(i=>i+1);
    assert.deepEqual(mothers,[1,3,5]);
  });
  it('offspring helpers split founders from offspring',()=>{
    const r=mkcol(475423,'bi',0.5,[10,11,12,13,14,15],[10,11],0.03);
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
    const rows=[...mkF(475423,[10,11],[10,11,12,13,14,15],0.009,0.002),...mkF(475432,[10,11],[10,11,12,13,14,15],0.009,0.002)];
    const v=scoreGen1BiparwinRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-BIPARWIN-GO-V1');
    assert.deepEqual(v.biGap.survPairs,[0.5,0.5]);
    assert.equal(v.offspringN.bi,16);
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const mk=(bDied,nDied,cDied)=>[trow(475423,'a','b','c'),mkskill(475423,'skillT',0.9,0.03),mkskill(475423,'skillN',0.7,0.02),
      mkcol(475423,'bi',0.5,off,bDied,0.009),mkcol(475423,'copy',0.5,off,cDied,0.010),mkcol(475423,'naivekid',0.4,off,nDied,0.002),
      trow(475432,'a','b','c'),mkskill(475432,'skillT',0.9,0.03),mkskill(475432,'skillN',0.7,0.02),
      mkcol(475432,'bi',0.5,off,bDied,0.009),mkcol(475432,'copy',0.5,off,cDied,0.010),mkcol(475432,'naivekid',0.4,off,nDied,0.002)];
    assert.equal(scoreGen1BiparwinRows(mk([10,11],[10,11],[10])).verdict,'GEN1-BIPARWIN-NOGO-V1');
    assert.equal(scoreGen1BiparwinRows(mk([10,11],[10,11],[10,11,12,13,14,15,16,17])).verdict,'GEN1-BIPARWIN-FLOOR-V1');
    const mkN=[trow(475423,'a','b','c'),mkskill(475423,'skillT',0.7,0.02),mkskill(475423,'skillN',0.7,0.02),
      mkcol(475423,'bi',0.5,off,[10,11],0.009),mkcol(475423,'copy',0.5,off,[10],0.010),mkcol(475423,'naivekid',0.4,off,[10,11,12,13,14,15],0.002),
      trow(475432,'a','b','c'),mkskill(475432,'skillT',0.7,0.02),mkskill(475432,'skillN',0.7,0.02),
      mkcol(475432,'bi',0.5,off,[10,11],0.009),mkcol(475432,'copy',0.5,off,[10],0.010),mkcol(475432,'naivekid',0.4,off,[10,11,12,13,14,15],0.002)];
    assert.equal(scoreGen1BiparwinRows(mkN).verdict,'GEN1-BIPARWIN-INCOMPLETE-NOSKILL');
    const mkB=[trow(475423,'a','b','c'),mkskill(475423,'skillT',0.9,0.03),mkskill(475423,'skillN',0.7,0.02),
      mkcol(475423,'bi',0.5,[10],[10],0.009),mkcol(475423,'copy',0.5,[10],[10],0.010),mkcol(475423,'naivekid',0.4,[10],[10],0.002),
      trow(475432,'a','b','c'),mkskill(475432,'skillT',0.9,0.03),mkskill(475432,'skillN',0.7,0.02),
      mkcol(475432,'bi',0.5,[10],[10],0.009),mkcol(475432,'copy',0.5,[10],[10],0.010),mkcol(475432,'naivekid',0.4,[10],[10],0.002)];
    assert.equal(scoreGen1BiparwinRows(mkB).verdict,'GEN1-BIPARWIN-INCOMPLETE-LOWBIRTHS');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const off=[10,11,12,13,14,15,16,17];
    const rowsN=[trow(475423,'a','a','c'),mkskill(475423,'skillT',0.9,0.03),mkskill(475423,'skillN',0.7,0.02),
      mkcol(475423,'bi',0.5,off,[10,11],0.009),mkcol(475423,'copy',0.5,off,[10],0.010),mkcol(475423,'naivekid',0.4,off,[10,11],0.002),
      trow(475432,'a','a','c'),mkskill(475432,'skillT',0.9,0.03),mkskill(475432,'skillN',0.7,0.02),
      mkcol(475432,'bi',0.5,off,[10,11],0.009),mkcol(475432,'copy',0.5,off,[10],0.010),mkcol(475432,'naivekid',0.4,off,[10,11],0.002)];
    assert.equal(scoreGen1BiparwinRows(rowsN).verdict,'GEN1-BIPARWIN-INVALID-NOLEARN');
    const bad=[trow(475423,'a','b','c')];
    assert.equal(scoreGen1BiparwinRows(bad).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(BPW_TRAIN_TICKS===512&&BPW_PROBE_TICKS===900&&BPW_MIN_OFFSPRING===4);
  });
});
