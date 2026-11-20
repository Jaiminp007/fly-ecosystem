// GEN1-CAPTEST V1 fixtures (FROZEN docs/GEN1_CAPTEST_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, capped
// placement energy on fakes, scorer GO/NOGO/FLOOR/INCOMPLETE/INVALID
// branches (survival gaps per-pair, intake descriptive), constants
// guard (placement energy 20).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {ghBank,scoreGen1CaptestRows,causeSplit,heirSplitLosers,heirRate,heirToxin,offspringIds,offspringSurvival,offspringRate,meanToxin,
  CTP_FIXTURE_SEEDS,CTP_TRIAGE_SEEDS,CTP_ARMS,CTP_TRAIN_TICKS,
  CTP_PROBE_TICKS,CTP_SKILL_TICKS,CTP_PLACE_ENERGY,CTP_MIN_OFFSPRING} from '../scripts/gen1-captest-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(ids,diedIds)=>ids.map(id=>({id,born:0,died:diedIds.includes(id)?1500:null,cause:diedIds.includes(id)?'energy':null,lastEnergy:40}));
const foodcost=(ids,rate,ticks)=>{const food={},cost={};for(const id of ids){food[id]=rate*ticks;cost[id]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD,bD)=>({history:{seed},arm:'trainAB',stage:'train',survival:0.9,meteredTicks:1024,
  initDigest:initD,aDigest:aD,bDigest:bD,
  deathCauses:{energy:0,age:0},endpoint:{tick:1024,budgetAdjustedEnergyPerFounder:-60.0}});
const mkcol=(seed,arm,surv,diedIds,rate)=>{const ids=[0,1,2,3];const {food,cost}=foodcost(ids,rate,900);
  const toxin={};for(const id of ids)toxin[id]=0.005*900;
  return {history:{seed},arm,stage:'colony',frozen:true,survival:surv,meteredTicks:900,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(ids,diedIds),
  founders:ids,vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:diedIds.length,age:0},endpoint:{tick:900,budgetAdjustedEnergyPerFounder:-60.0}};};
const mkskill=(seed,arm,surv,rate)=>{const {food,cost}=foodcost([0,1,2,3],rate,256);
  const toxin={};for(let i=0;i<4;i++)toxin[i]=0.005*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,cost,
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents([0,1,2,3],[]),
  founders:[0,1,2,3],vt:'none',trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-captest-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1captest-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=ghBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-captest-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...CTP_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(CTP_FIXTURE_SEEDS[0],475639);
    assert.deepEqual([...CTP_TRIAGE_SEEDS],[490730,490731,490732,490733,490734,490735,490736,490737,490738]);
    assert.ok(!CTP_FIXTURE_SEEDS.some(s=>CTP_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...CTP_ARMS],['trainAB','skillT','skillN','capSkilled','capNaive']);
    assert.equal(CTP_TRAIN_TICKS,512);assert.equal(CTP_PROBE_TICKS,900);
    assert.equal(CTP_SKILL_TICKS,256);assert.equal(CTP_PLACE_ENERGY,20);
    assert.equal(CTP_MIN_OFFSPRING,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('survival/intake math on capped-colony fakes',()=>{
    const r=mkcol(475639,'capSkilled',0.75,[3],0.03);
    assert.equal(r.survival,0.75);
    assert.ok(Math.abs(heirRate(r)-0.03)<1e-9);
    assert.deepEqual(causeSplit({agents:r.agents}),{energy:1,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split reuse',()=>{
    const ag=agents([0,1,2,3,4],[1,3]);
    assert.equal(heirSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:900}).losers,2);
  });
  it('scorer GO branch (conversion unlocks, both pairs)',()=>{
    const mk=(sDied,nDied)=>[trow(475639,'a','b','c'),mkskill(475639,'skillT',0.9,0.03),mkskill(475639,'skillN',0.7,0.02),
      mkcol(475639,'capSkilled',0.75,sDied,0.03),mkcol(475639,'capNaive',0.25,nDied,0.02),
      trow(475648,'a','b','c'),mkskill(475648,'skillT',0.9,0.03),mkskill(475648,'skillN',0.7,0.02),
      mkcol(475648,'capSkilled',0.75,sDied,0.03),mkcol(475648,'capNaive',0.25,nDied,0.02)];
    const rows=mk([3],[0,1,2]);
    assert.equal(rows.length,10);
    const v=scoreGen1CaptestRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-CAPTEST-GO-V1');
    assert.deepEqual(v.survGap.survPairs,[0.5,0.5]);
    assert.ok(v.intake.capSkilled>v.intake.capNaive);
  });
  it('scorer NOGO/FLOOR/INCOMPLETE branches',()=>{
    const mk=(sDied,nDied)=>[trow(475639,'a','b','c'),mkskill(475639,'skillT',0.9,0.03),mkskill(475639,'skillN',0.7,0.02),
      mkcol(475639,'capSkilled',0.5,sDied,0.02),mkcol(475639,'capNaive',0.4,nDied,0.02),
      trow(475648,'a','b','c'),mkskill(475648,'skillT',0.9,0.03),mkskill(475648,'skillN',0.7,0.02),
      mkcol(475648,'capSkilled',0.5,sDied,0.02),mkcol(475648,'capNaive',0.4,nDied,0.02)];
    assert.equal(scoreGen1CaptestRows(mk([0,1],[0,1])).verdict,'GEN1-CAPTEST-NOGO-V1');
    const mkF=[trow(475639,'a','b','c'),mkskill(475639,'skillT',0.9,0.03),mkskill(475639,'skillN',0.7,0.02),
      mkcol(475639,'capSkilled',0.0,[0,1,2,3],0.02),mkcol(475639,'capNaive',0.0,[0,1,2,3],0.02),
      trow(475648,'a','b','c'),mkskill(475648,'skillT',0.9,0.03),mkskill(475648,'skillN',0.7,0.02),
      mkcol(475648,'capSkilled',0.0,[0,1,2,3],0.02),mkcol(475648,'capNaive',0.0,[0,1,2,3],0.02)];
    assert.equal(scoreGen1CaptestRows(mkF).verdict,'GEN1-CAPTEST-FLOOR-V1');
    const mkN=[trow(475639,'a','b','c'),mkskill(475639,'skillT',0.7,0.02),mkskill(475639,'skillN',0.7,0.02),
      mkcol(475639,'capSkilled',0.5,[0,1],0.02),mkcol(475639,'capNaive',0.4,[0,1],0.02),
      trow(475648,'a','b','c'),mkskill(475648,'skillT',0.7,0.02),mkskill(475648,'skillN',0.7,0.02),
      mkcol(475648,'capSkilled',0.5,[0,1],0.02),mkcol(475648,'capNaive',0.4,[0,1],0.02)];
    assert.equal(scoreGen1CaptestRows(mkN).verdict,'GEN1-CAPTEST-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(475639,'a','a','c'),mkskill(475639,'skillT',0.9,0.03),mkskill(475639,'skillN',0.7,0.02),
      mkcol(475639,'capSkilled',0.5,[0],0.03),mkcol(475639,'capNaive',0.4,[0,1],0.02),
      trow(475648,'a','a','c'),mkskill(475648,'skillT',0.9,0.03),mkskill(475648,'skillN',0.7,0.02),
      mkcol(475648,'capSkilled',0.5,[0],0.03),mkcol(475648,'capNaive',0.4,[0,1],0.02)];
    assert.equal(scoreGen1CaptestRows(rowsN).verdict,'GEN1-CAPTEST-INVALID-NOLEARN');
    assert.equal(scoreGen1CaptestRows([trow(475639,'a','b','c')]).verdict,'INVALID');
  });
  it('constants guard the design',()=>{
    assert.ok(CTP_TRAIN_TICKS===512&&CTP_PROBE_TICKS===900&&CTP_PLACE_ENERGY===20);
    assert.ok(CTP_SKILL_TICKS===256);
  });
});
