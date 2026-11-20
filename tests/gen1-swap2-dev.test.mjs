// GEN1-SWAP2 V1 fixtures (FROZEN docs/GEN1_SWAP2_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, swap2CueIdentity
// (valence-preserving/bit-changing/Hamming), swap2Rate/Toxin,
// split/cause reuse, scorer GO/NOGO/INCOMPLETE-NOSKILL/INVALID-
// NOLEARN/INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import {gs2Bank,scoreGen1Swap2Rows,causeSplit,swap2SplitLosers,swap2Rate,swap2Toxin,swap2CueIdentity,swap2Hamming,meanToxin,
  GS2_FIXTURE_SEEDS,GS2_TRIAGE_SEEDS,GS2_ARMS,GS2_TRAIN_TICKS,
  GS2_PROBE_TICKS,GS2_PLACE_ENERGY} from '../scripts/gen1-swap2-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(n,diedIds)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:diedIds.includes(i)?1500:null,cause:diedIds.includes(i)?'energy':null,lastEnergy:40}));
const foodcost=(n,rate,ticks)=>{const food={},cost={};for(let i=0;i<n;i++){food[i]=rate*ticks;cost[i]=rate*ticks*1.4;}return {food,cost};};
const trow=(seed,initD,aD)=>({history:{seed},arm:'trainA',stage:'train',survival:0.9,meteredTicks:512,toxin:tx(1,1),food:tx(2,2),cost:tx(3,3),
  energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,[]),initDigest:initD,aDigest:aD,aWeights:{},
  deathCauses:{energy:0,age:0},endpoint:{tick:512,budgetAdjustedEnergyPerFounder:-60.0}});
const prow=(seed,arm,surv,rate,tox)=>{const {food,cost}=foodcost(24,rate,256);
  const toxin={};for(let i=0;i<24;i++)toxin[i]=tox*256;
  return {history:{seed},arm,stage:'probe',frozen:true,survival:surv,meteredTicks:256,toxin,food,
  cost,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:agents(24,[]),trainDigest:'x',finalDigest:'x',
  deathCauses:{energy:0,age:0},endpoint:{tick:256,budgetAdjustedEnergyPerFounder:-60.0}};};

describe('gen1-swap2-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1swap2-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gs2Bank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-swap2-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GS2_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GS2_FIXTURE_SEEDS[0],474523);
    assert.deepEqual([...GS2_TRIAGE_SEEDS],[490172,490173,490174,490175,490176,490177,490178,490179,490180]);
    assert.ok(!GS2_FIXTURE_SEEDS.some(s=>GS2_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GS2_ARMS],['trainA','origT','origN','swapT','swapN']);
    assert.equal(GS2_TRAIN_TICKS,512);assert.equal(GS2_PROBE_TICKS,256);assert.equal(GS2_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('swap2CueIdentity preserves valences, changes bits (Hamming>0)',()=>{
    const orig=makeCueCodebook(474523);
    const swapped=swap2CueIdentity({cueSeed:474523});
    for(const fam of ['A','B','C']){
      assert.deepEqual(swapped[fam].map(c=>c.valence),orig[fam].map(c=>c.valence));
      assert.deepEqual(swapped[fam].map(c=>c.id),orig[fam].map(c=>c.id));
    }
    const h=swap2Hamming(swapped,orig);
    assert.ok(h>0&&h<=4);
    assert.equal(swap2Hamming(orig,orig),0);
    assert.equal(swap2Hamming(null,orig),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('swap2Rate/Toxin per-agent-tick',()=>{
    assert.equal(swap2Rate({food:tx(2,4),agents:agents(2,[]),meteredTicks:100}),0.03);
    assert.equal(swap2Toxin({toxin:tx(1,3),agents:agents(2,[]),meteredTicks:100}),0.02);
    assert.equal(swap2Rate({}),null);assert.equal(swap2Toxin(null),null);
  });
  it('split/cause reuse',()=>{
    const ag=agents(5,[1,3]);
    assert.deepEqual(causeSplit({agents:ag}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(swap2SplitLosers({agents:ag,food:{0:50,1:0.5,2:50,3:20,4:50},cost:{0:25,1:30,2:25,3:40,4:25},meteredTicks:1792}).losers,2);
  });
  it('scorer GO branch (orig skill + swap survives)',()=>{
    const rows=[trow(474523,'a','b'),prow(474523,'origT',0.9,0.03,0.005),prow(474523,'origN',0.7,0.02,0.005),
      prow(474523,'swapT',0.85,0.03,0.005),prow(474523,'swapN',0.7,0.02,0.005),
      trow(474532,'a','b'),prow(474532,'origT',0.9,0.03,0.005),prow(474532,'origN',0.7,0.02,0.005),
      prow(474532,'swapT',0.85,0.03,0.005),prow(474532,'swapN',0.7,0.02,0.005)];
    const v=scoreGen1Swap2Rows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-SWAP2-GO-V1');
  });
  it('scorer NOGO/INCOMPLETE branches',()=>{
    const mk=(swapRate)=>[trow(474523,'a','b'),prow(474523,'origT',0.9,0.03,0.005),prow(474523,'origN',0.7,0.02,0.005),
      prow(474523,'swapT',0.5,swapRate,0.03),prow(474523,'swapN',0.7,0.02,0.005),
      trow(474532,'a','b'),prow(474532,'origT',0.9,0.03,0.005),prow(474532,'origN',0.7,0.02,0.005),
      prow(474532,'swapT',0.5,swapRate,0.03),prow(474532,'swapN',0.7,0.02,0.005)];
    assert.equal(scoreGen1Swap2Rows(mk(0.02)).verdict,'GEN1-SWAP2-NOGO-V1');
    const mkN=[trow(474523,'a','b'),prow(474523,'origT',0.7,0.02,0.005),prow(474523,'origN',0.7,0.02,0.005),
      prow(474523,'swapT',0.5,0.02,0.005),prow(474523,'swapN',0.7,0.02,0.005),
      trow(474532,'a','b'),prow(474532,'origT',0.7,0.02,0.005),prow(474532,'origN',0.7,0.02,0.005),
      prow(474532,'swapT',0.5,0.02,0.005),prow(474532,'swapN',0.7,0.02,0.005)];
    assert.equal(scoreGen1Swap2Rows(mkN).verdict,'GEN1-SWAP2-INCOMPLETE-NOSKILL');
  });
  it('scorer INVALID branches (no-learn, integrity)',()=>{
    const rowsN=[trow(474523,'a','a'),prow(474523,'origT',0.9,0.03,0.005),prow(474523,'origN',0.7,0.02,0.005),
      prow(474523,'swapT',0.85,0.03,0.005),prow(474523,'swapN',0.7,0.02,0.005),
      trow(474532,'a','a'),prow(474532,'origT',0.9,0.03,0.005),prow(474532,'origN',0.7,0.02,0.005),
      prow(474532,'swapT',0.85,0.03,0.005),prow(474532,'swapN',0.7,0.02,0.005)];
    assert.equal(scoreGen1Swap2Rows(rowsN).verdict,'GEN1-SWAP2-INVALID-NOLEARN');
    const bad=[trow(474523,'a','b'),prow(474523,'origT',0.9,0.03,0.005)];
    assert.equal(scoreGen1Swap2Rows(bad).verdict,'INVALID');
  });
});
