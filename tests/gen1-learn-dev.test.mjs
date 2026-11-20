// GEN1-LEARN V1 fixtures (FROZEN docs/GEN1_LEARN_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, balanceMargin (survivor/dead), learnSplitLosers reuse, scorer
// GO/NOGO/INVALID-unmoved/INVALID-moved branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {glnBank,scoreGen1LearnRows,causeSplit,learnSplitLosers,balanceMargin,meanToxin,
  GLN_FIXTURE_SEEDS,GLN_TRIAGE_SEEDS,GLN_ARMS,GLN_DEPLETE_TICKS,
  GLN_MEASURE_TICKS,GLN_PLACE_ENERGY} from '../scripts/gen1-learn-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const agents=(specs)=>specs.map((s,i)=>({id:i,born:0,died:s.died??null,cause:s.died!=null?'energy':null,lastEnergy:s.lastEnergy??40}));
const row=(seed,arm,surv,ag,food,cost,initD,finalD)=>({history:{seed},arm,stage:'main',frozen:arm!=='learned',survival:surv,
  meteredTicks:1792,toxin:tx(0,0),food,cost,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents:ag,
  initDigest:initD,finalDigest:finalD,
  deathCauses:{energy:ag.filter(a=>a.died!==null).length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}});

describe('gen1-learn-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1learn-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=glnBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-learn-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GLN_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GLN_FIXTURE_SEEDS[0],474433);
    assert.deepEqual([...GLN_TRIAGE_SEEDS],[490127,490128,490129,490130,490131,490132,490133,490134,490135]);
    assert.ok(!GLN_FIXTURE_SEEDS.some(s=>GLN_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GLN_ARMS],['learned','naive','deep']);
    assert.equal(GLN_DEPLETE_TICKS,1024);assert.equal(GLN_MEASURE_TICKS,1792);assert.equal(GLN_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1',()=>{
    const clean=cleanCodebook({cueSeed:474433});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('balanceMargin survivor/dead (closure-aware)',()=>{
    const ag=agents([{lastEnergy:50},{died:1500}]);
    const m=balanceMargin({agents:ag,food:{0:60,1:20},cost:{0:58,1:60}});
    assert.ok(Math.abs(m-(((48+60-58-50)+(48+20-60-0))/2))<1e-9);
    assert.equal(balanceMargin(null),null);
    assert.equal(meanToxin({toxin:tx(2,4)}),3);
  });
  it('learnSplitLosers reuse (never/under split)',()=>{
    const ag=agents([{lastEnergy:40},{lastEnergy:41}]);
    const food={0:53.76,1:53.76,2:0.5,3:20}, cost={0:26,1:26,2:30,3:40};
    ag.push({id:2,born:0,died:1500,cause:'energy',lastEnergy:0},{id:3,born:0,died:1600,cause:'energy',lastEnergy:0});
    const sp=learnSplitLosers({agents:ag,food,cost,meteredTicks:1792});
    assert.equal(sp.losers,2);assert.equal(sp.never,1);assert.equal(sp.under,1);
    assert.equal(causeSplit({agents:ag}).alive,2);
  });
  it('scorer GO branch (learned moves + survives better)',()=>{
    const mk=(arm,surv,initD,finalD)=>row(474433,arm,surv,agents([{lastEnergy:40}]),{0:50},{0:40},initD,finalD);
    const rows=[mk('learned',0.9,'aaa','bbb'),mk('naive',0.7,'aaa','aaa'),mk('deep',0.958,'ccc','ccc'),
      row(474442,'learned',0.9,agents([{lastEnergy:40}]),{0:50},{0:40},'aaa','bbb'),
      row(474442,'naive',0.7,agents([{lastEnergy:40}]),{0:50},{0:40},'aaa','aaa'),
      row(474442,'deep',0.958,agents([{lastEnergy:40}]),{0:50},{0:40},'ccc','ccc')];
    const v=scoreGen1LearnRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-LEARN-GO-V1');
  });
  it('scorer NOGO branch (learned ties)',()=>{
    const mk=(arm,surv)=>row(474433,arm,surv,agents([{lastEnergy:40}]),{0:50},{0:40},arm==='learned'?'aaa':'xxx',arm==='learned'?'bbb':'xxx');
    const rows=[mk('learned',0.72),mk('naive',0.70),mk('deep',0.958),
      row(474442,'learned',0.72,agents([{lastEnergy:40}]),{0:50},{0:40},'aaa','bbb'),
      row(474442,'naive',0.70,agents([{lastEnergy:40}]),{0:50},{0:40},'xxx','xxx'),
      row(474442,'deep',0.958,agents([{lastEnergy:40}]),{0:50},{0:40},'ccc','ccc')];
    const v=scoreGen1LearnRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-LEARN-NOGO-V1');
  });
  it('scorer INVALID when learned unmoved or naive moved',()=>{
    const good=(arm,initD,finalD)=>row(474433,arm,0.8,agents([{lastEnergy:40}]),{0:50},{0:40},initD,finalD);
    const rows1=[good('learned','aaa','aaa'),good('naive', 'aaa','aaa'),good('deep','ccc','ccc'),
      row(474442,'learned',0.8,agents([{lastEnergy:40}]),{0:50},{0:40},'aaa','aaa'),
      row(474442,'naive',0.8,agents([{lastEnergy:40}]),{0:50},{0:40},'aaa','aaa'),
      row(474442,'deep',0.958,agents([{lastEnergy:40}]),{0:50},{0:40},'ccc','ccc')];
    assert.equal(scoreGen1LearnRows(rows1).verdict,'INVALID');
    const rows2=[good('learned','aaa','bbb'),good('naive','aaa','aab'),good('deep','ccc','ccc'),
      row(474442,'learned',0.8,agents([{lastEnergy:40}]),{0:50},{0:40},'aaa','bbb'),
      row(474442,'naive',0.8,agents([{lastEnergy:40}]),{0:50},{0:40},'aaa','aab'),
      row(474442,'deep',0.958,agents([{lastEnergy:40}]),{0:50},{0:40},'ccc','ccc')];
    assert.equal(scoreGen1LearnRows(rows2).verdict,'INVALID');
  });
});
