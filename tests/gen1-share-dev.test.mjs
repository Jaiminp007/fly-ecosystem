// GEN1-SHARE V1 fixtures (FROZEN docs/GEN1_SHARE_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, shareSplitLosers reuse, shareBalanceMargin reuse, scorer
// GO/NOGO/INVALID-NOALERT/INVALID-freeze branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gsBank,scoreGen1ShareRows,causeSplit,shareSplitLosers,shareBalanceMargin,meanToxin,
  GS_FIXTURE_SEEDS,GS_TRIAGE_SEEDS,GS_ARMS,GS_DEPLETE_TICKS,
  GS_MEASURE_TICKS,GS_PLACE_ENERGY,GS_ALERT_MEAL,GS_ALERT_MULT,GS_ALERT_TICKS} from '../scripts/gen1-share-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;}return {food,cost};};
const row=(seed,arm,surv,diedIds,alert,initD='aaa',finalD='aaa')=>{const {food,cost}=foodcost(24,0.03,1792);
  return {history:{seed},arm,stage:'main',frozen:true,survival:surv,alert,
  meteredTicks:1792,toxin:tx(0,0),food,cost,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,diedIds),
  initDigest:initD,finalDigest:finalD,
  deathCauses:{energy:diedIds.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-share-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1share-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gsBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-share-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GS_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GS_FIXTURE_SEEDS[0],474451);
    assert.deepEqual([...GS_TRIAGE_SEEDS],[490136,490137,490138,490139,490140,490141,490142,490143,490144]);
    assert.ok(!GS_FIXTURE_SEEDS.some(s=>GS_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GS_ARMS],['shared','asocial','deep']);
    assert.equal(GS_DEPLETE_TICKS,1024);assert.equal(GS_MEASURE_TICKS,1792);assert.equal(GS_PLACE_ENERGY,48);
    assert.equal(GS_ALERT_MEAL,0.2);assert.equal(GS_ALERT_MULT,2.0);assert.equal(GS_ALERT_TICKS,32);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1',()=>{
    const clean=cleanCodebook({cueSeed:474451});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('shareSplitLosers/shareBalanceMargin reuse',()=>{
    const ag=agents(20,[18,19]);
    const {food,cost}=foodcost(20,0.03,1792);
    food[18]=0.5;cost[18]=30;food[19]=20;cost[19]=40;
    const sp=shareSplitLosers({agents:ag,food,cost,meteredTicks:1792});
    assert.equal(sp.losers,2);assert.equal(sp.never+sp.under+sp.over,2);
    assert.ok(Number.isFinite(shareBalanceMargin({agents:ag,food,cost})));
    assert.equal(shareSplitLosers(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('causeSplit counts',()=>{
    assert.deepEqual(causeSplit({agents:agents(5,[1,3])}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
  });
  it('scorer GO branch (shared lifts tail, rule fired, freeze held)',()=>{
    const mk=(arm,surv,died,alert)=>row(474451,arm,surv,died,alert);
    const rows=[mk('shared',0.9,[1],{events:5,alertTicks:120}),mk('asocial',0.75,[1,2,3],null),mk('deep',0.958,[],null),
      row(474460,'shared',0.9,[1],{events:5,alertTicks:120}),row(474460,'asocial',0.75,[1,2,3],null),row(474460,'deep',0.958,[],null)];
    const v=scoreGen1ShareRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-SHARE-GO-V1');
  });
  it('scorer NOGO branch (shared ties)',()=>{
    const mk=(arm,surv)=>row(474451,arm,surv,[1],arm==='shared'?{events:5,alertTicks:120}:null);
    const rows=[mk('shared',0.75),mk('asocial',0.75),mk('deep',0.958),
      row(474460,'shared',0.75,[1],{events:5,alertTicks:120}),row(474460,'asocial',0.75,[1],null),row(474460,'deep',0.958,[],null)];
    const v=scoreGen1ShareRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-SHARE-NOGO-V1');
  });
  it('scorer INVALID branches (no-alert, freeze-break)',()=>{
    const mkA=(alert)=>[row(474451,'shared',0.9,[1],alert),row(474451,'asocial',0.75,[1,2],null),row(474451,'deep',0.958,[],null),
      row(474460,'shared',0.9,[1],alert),row(474460,'asocial',0.75,[1,2],null),row(474460,'deep',0.958,[],null)];
    assert.equal(scoreGen1ShareRows(mkA({events:0,alertTicks:0})).verdict,'GEN1-SHARE-INVALID-NOALERT');
    assert.equal(scoreGen1ShareRows(mkA(null)).verdict,'GEN1-SHARE-INVALID-NOALERT');
    const bad=[row(474451,'shared',0.9,[1],{events:5,alertTicks:120},'aaa','bbb'),row(474451,'asocial',0.75,[1,2],null),row(474451,'deep',0.958,[],null),
      row(474460,'shared',0.9,[1],{events:5,alertTicks:120}),row(474460,'asocial',0.75,[1,2],null),row(474460,'deep',0.958,[],null)];
    assert.equal(scoreGen1ShareRows(bad).verdict,'INVALID');
  });
});
