// GEN1-LOSER V1 fixtures (FROZEN docs/GEN1_LOSER_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, splitLosers (never/under/over/median), causeSplit, scorer
// GO-NEVER/GO-UNDER/NOGO/INCOMPLETE/INVALID branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gloBank,scoreGen1LoserRows,causeSplit,splitLosers,meanToxin,
  GLO_FIXTURE_SEEDS,GLO_TRIAGE_SEEDS,GLO_ARMS,GLO_DEPLETE_TICKS,
  GLO_MEASURE_TICKS,GLO_PLACE_ENERGY,GLO_NEVER_FRAC,GLO_SUPERMAJORITY,GLO_MIN_LOSERS} from '../scripts/gen1-loser-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const mk=(nSurv,survRate,diedSpecs,ticks=1792)=>{
  // diedSpecs: [{intake,costs,died}] per dead agent.
  const agents=[];
  for(let i=0;i<nSurv;i++)agents.push({id:i,born:0,died:null,cause:null,lastEnergy:40});
  const food={},cost={};
  for(let i=0;i<nSurv;i++){food[i]=survRate*ticks;cost[i]=survRate*ticks*0.5;}
  diedSpecs.forEach((d,j)=>{const id=nSurv+j;agents.push({id,born:0,died:d.died,cause:'energy',lastEnergy:0});food[id]=d.intake;cost[id]=d.costs;});
  return {agents,food,cost};
};
const row=(seed,arm,surv,agents,food,cost)=>({history:{seed},arm,stage:'main',survival:surv,
  meteredTicks:1792,toxin:tx(0,0),food,cost,energyCurve:[],series:[{tick:32,intake:20,energyMean:47,alive:24}],agents,
  deathCauses:{energy:agents.filter(a=>a.died!==null).length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}});

describe('gen1-loser-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1loser-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gloBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-loser-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GLO_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GLO_FIXTURE_SEEDS[0],474415);
    assert.deepEqual([...GLO_TRIAGE_SEEDS],[490118,490119,490120,490121,490122,490123,490124,490125,490126]);
    assert.ok(!GLO_FIXTURE_SEEDS.some(s=>GLO_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GLO_ARMS],['fresh','deep']);
    assert.equal(GLO_DEPLETE_TICKS,1024);assert.equal(GLO_MEASURE_TICKS,1792);assert.equal(GLO_PLACE_ENERGY,48);
    assert.equal(GLO_NEVER_FRAC,0.1);assert.equal(GLO_SUPERMAJORITY,2/3);assert.equal(GLO_MIN_LOSERS,4);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1',()=>{
    const clean=cleanCodebook({cueSeed:474415});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('splitLosers never/under/over with survivor median',()=>{
    const {agents,food,cost}=mk(20,0.03,[{intake:0.5,costs:30,died:1500},{intake:20,costs:40,died:1600},{intake:50,costs:40,died:1700}]);
    const sp=splitLosers({agents,food,cost,meteredTicks:1792});
    assert.equal(sp.losers,3);
    assert.equal(sp.never,1);assert.equal(sp.under,1);assert.equal(sp.over,1);
    assert.ok(sp.survivorMedian>0.029&&sp.survivorMedian<0.031);
    assert.equal(splitLosers(null),null);
    assert.equal(meanToxin({toxin:tx(1,3)}),2);
  });
  it('causeSplit counts',()=>{
    assert.deepEqual(causeSplit({agents:[{died:null},{died:5,cause:'energy'},{died:9,cause:'age'}]}),{energy:1,age:1,both:0,alive:1});
    assert.equal(causeSplit(null),null);
  });
  it('scorer GO-NEVER branch',()=>{
    const a=mk(20,0.03,[{intake:0.5,costs:30,died:1500},{intake:0.4,costs:30,died:1600},{intake:0.6,costs:30,died:1700},{intake:0.5,costs:30,died:1550}]);
    const rows=[row(474415,'fresh',0.833,a.agents,a.food,a.cost),row(474415,'deep',0.958,a.agents,a.food,a.cost),
      row(474424,'fresh',0.833,a.agents,a.food,a.cost),row(474424,'deep',0.958,a.agents,a.food,a.cost)];
    const v=scoreGen1LoserRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-LOSER-GO-NEVER-V1');
  });
  it('scorer GO-UNDER/NOGO/INCOMPLETE branches',()=>{
    const u=mk(20,0.03,[{intake:20,costs:40,died:1500},{intake:22,costs:40,died:1600},{intake:21,costs:40,died:1700},{intake:20,costs:40,died:1550}]);
    const mkrows=(fa)=>[row(474415,'fresh',0.833,fa.agents,fa.food,fa.cost),row(474415,'deep',0.958,fa.agents,fa.food,fa.cost),
      row(474424,'fresh',0.833,fa.agents,fa.food,fa.cost),row(474424,'deep',0.958,fa.agents,fa.food,fa.cost)];
    assert.equal(scoreGen1LoserRows(mkrows(u)).verdict,'GEN1-LOSER-GO-UNDER-V1');
    const m=mk(20,0.03,[{intake:0.5,costs:30,died:1500},{intake:0.4,costs:30,died:1600},{intake:20,costs:40,died:1700},{intake:22,costs:40,died:1550}]);
    assert.equal(scoreGen1LoserRows(mkrows(m)).verdict,'GEN1-LOSER-NOGO-V1');
    const f=mk(23,0.03,[{intake:0.5,costs:30,died:1500}]);
    assert.equal(scoreGen1LoserRows(mkrows(f)).verdict,'INCOMPLETE-NOLOSE');
  });
  it('scorer INVALID on missing cost tables',()=>{
    const a=mk(20,0.03,[{intake:0.5,costs:30,died:1500},{intake:0.4,costs:30,died:1600},{intake:0.6,costs:30,died:1700},{intake:0.5,costs:30,died:1550}]);
    const bad=row(474415,'fresh',0.833,a.agents,a.food,null);
    const rows=[bad,row(474415,'deep',0.958,a.agents,a.food,a.cost),
      row(474424,'fresh',0.833,a.agents,a.food,a.cost),row(474424,'deep',0.958,a.agents,a.food,a.cost)];
    assert.equal(scoreGen1LoserRows(rows).verdict,'INVALID');
  });
});
