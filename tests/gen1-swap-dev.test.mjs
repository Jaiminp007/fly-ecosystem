// GEN1-SWAP V1 fixtures (FROZEN docs/GEN1_SWAP_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, swapCueIdentity
// (valence-preserving/bit-changing/Hamming), netRate/toxinRate,
// split/cause reuse, scorer GO/NOGO/INVALID-NOLEARN/INVALID branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import {gswBank,scoreGen1SwapRows,causeSplit,swapSplitLosers,netRate,toxinRate,swapCueIdentity,cueHamming,meanToxin,
  GSW_FIXTURE_SEEDS,GSW_TRIAGE_SEEDS,GSW_ARMS,GSW_TRAIN_TICKS,
  GSW_PROBE_TICKS,GSW_PLACE_ENERGY} from '../scripts/gen1-swap-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD)=>({history:{seed},arm:'trainA',stage:'train',survival:0.9,meteredTicks:512,toxin:tx(1,1),food:tx(2,2),cost:tx(3,3),
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,[]),initDigest:initD,aDigest:aD,aWeights:{},
  deathCauses:{energy:0,age:0},endpoint:{tick:512,budgetAdjustedEnergyPerFounder:-60.0}});
const prow=(seed,arm,surv,rate,tox)=>{const {food,cost}=foodcost(24,rate,256);
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin:(()=>{const t={};for(let i=0;i<24;i++)t[i]=tox*256;return t;})(),food,
  cost,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,[]),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-swap-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1swap-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gswBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-swap-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GSW_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GSW_FIXTURE_SEEDS[0],474505);
    assert.deepEqual([...GSW_TRIAGE_SEEDS],[490163,490164,490165,490166,490167,490168,490169,490170,490171]);
    assert.ok(!GSW_FIXTURE_SEEDS.some(s=>GSW_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GSW_ARMS],['trainA','transplant','naive']);
    assert.equal(GSW_TRAIN_TICKS,512);assert.equal(GSW_PROBE_TICKS,256);assert.equal(GSW_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('swapCueIdentity preserves valences, changes bits (Hamming>0)',()=>{
    const orig=makeCueCodebook(474505);
    const swapped=swapCueIdentity({cueSeed:474505});
    assert.deepEqual(Object.keys(swapped).sort(),['A','B','C']);
    for(const fam of ['A','B','C']){
      assert.equal(swapped[fam].length,4);
      assert.deepEqual(swapped[fam].map(c=>c.valence),orig[fam].map(c=>c.valence));
      assert.deepEqual(swapped[fam].map(c=>c.id),orig[fam].map(c=>c.id));
    }
    const h=cueHamming(swapped,orig);
    assert.ok(h>0&&h<=4);
    assert.equal(cueHamming(orig,orig),0);
    assert.equal(cueHamming(null,orig),null);
  });
  it('netRate/toxinRate per-agent-tick',()=>{
    assert.equal(netRate({food:tx(2,4),agents:agents(2,[]),meteredTicks:100}),0.03);
    assert.equal(toxinRate({toxin:tx(1,3),agents:agents(2,[]),meteredTicks:100}),0.02);
    assert.equal(netRate({}),null);assert.equal(toxinRate(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('split/cause reuse',()=>{
    const ag=agents(5,[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(swapSplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (transplant beats naive x1.1)',()=>{
    const rows=[trow(474505,'a','b'),prow(474505,'transplant',0.9,0.03,0.005),prow(474505,'naive',0.7,0.02,0.005),
      trow(474514,'a','b'),prow(474514,'transplant',0.9,0.03,0.005),prow(474514,'naive',0.7,0.02,0.005)];
    const v=scoreGen1SwapRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-SWAP-GO-V1');
  });
  it('scorer NOGO branch (inversion texture)',()=>{
    const rows=[trow(474505,'a','b'),prow(474505,'transplant',0.5,0.01,0.03),prow(474505,'naive',0.7,0.02,0.005),
      trow(474514,'a','b'),prow(474514,'transplant',0.5,0.01,0.03),prow(474514,'naive',0.7,0.02,0.005)];
    const v=scoreGen1SwapRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-SWAP-NOGO-V1');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474505,'a','a'),prow(474505,'transplant',0.9,0.03,0.005),prow(474505,'naive',0.7,0.02,0.005),
      trow(474514,'a','a'),prow(474514,'transplant',0.9,0.03,0.005),prow(474514,'naive',0.7,0.02,0.005)];
    assert.equal(scoreGen1SwapRows(rowsN).verdict,'GEN1-SWAP-INVALID-NOLEARN');
    const bad=[trow(474505,'a','b'),prow(474505,'transplant',0.9,0.03,0.005),{history:{seed:474505},arm:'naive'}];
    assert.equal(scoreGen1SwapRows(bad).verdict,'INVALID');
  });
});
