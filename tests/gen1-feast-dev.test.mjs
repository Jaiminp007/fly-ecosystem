// GEN1-FEAST V1 fixtures (FROZEN docs/GEN1_FEAST_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, cleanCodebook
// reuse, feastRatio (front-load/zero-floor/empty-mid), crashMetrics,
// causeSplit, scorer GO/NOGO/INVALID-manipulation/INVALID-deepgate
// branches, constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {gfBank,scoreGen1FeastRows,causeSplit,feastRatio,crashMetrics,meanToxin,
  GF_FIXTURE_SEEDS,GF_TRIAGE_SEEDS,GF_ARMS,GF_DEPLETE_TICKS,
  GF_MEASURE_TICKS,GF_PLACE_ENERGY,GF_SERIES_TICKS,GF_FEAST_RATIO} from '../scripts/gen1-feast-dev.mjs';
import {cleanCodebook} from '../scripts/gen1-clean-dev.mjs';

const tx=(...vs)=>Object.fromEntries(vs.map((v,i)=>[i,v]));
const series=(early,mid,late,peak,alive0,crash=true)=>[
  ...Array.from({length:8},(_,i)=>({tick:(i+1)*32,intake:early,energyMean:peak,alive:alive0})),
  ...Array.from({length:8},(_,i)=>({tick:256+(i+1)*32,intake:(early+mid)/2,energyMean:peak*0.9,alive:alive0})),
  ...Array.from({length:8},(_,i)=>({tick:512+(i+1)*32,intake:mid,energyMean:peak*0.8,alive:alive0})),
  ...Array.from({length:32},(_,i)=>({tick:768+(i+1)*32,intake:late,energyMean:crash?(i<28?peak*0.7:peak*0.4):peak*0.95,alive:(crash&&i>=28)?Math.max(0,alive0-3):alive0}))];
const agents=(n,died)=>Array.from({length:n},(_,i)=>({id:i,born:0,died:died.includes(i)?1700:null,cause:died.includes(i)?'energy':null,lastEnergy:40}));
const row=(seed,arm,tox,surv,ser,died)=>({history:{seed},arm,stage:'main',survival:surv,
  meteredTicks:1792,toxin:tox,food:{},energyCurve:[],series:ser,agents:agents(arm==='deep'?24:24,died),
  deathCauses:{energy:died.length,age:0},endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0}});

describe('gen1-feast-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1feast-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gfBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-feast-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...GF_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(GF_FIXTURE_SEEDS[0],474379);
    assert.deepEqual([...GF_TRIAGE_SEEDS],[490100,490101,490102,490103,490104,490105,490106,490107,490108]);
    assert.ok(!GF_FIXTURE_SEEDS.some(s=>GF_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GF_ARMS],['fresh','deep']);
    assert.equal(GF_DEPLETE_TICKS,1024);assert.equal(GF_MEASURE_TICKS,1792);assert.equal(GF_PLACE_ENERGY,48);
    assert.equal(GF_SERIES_TICKS,32);assert.equal(GF_FEAST_RATIO,2.0);
    rmSync(dir,{recursive:true,force:true});
  });
  it('cleanCodebook reuse forces all +1',()=>{
    const clean=cleanCodebook({cueSeed:474379});
    for(const fam of ['A','B','C']){assert.equal(clean[fam].length,4);assert.ok(clean[fam].every(c=>c.valence===1));}
  });
  it('feastRatio front-load, zero-floor, empty-mid',()=>{
    const feast=series(4,1,0.2,60,24);
    assert.ok(feastRatio(feast)>=3.9&&feastRatio(feast)<=4.1);
    const flat=series(1,1,1,60,24);
    assert.ok(Math.abs(feastRatio(flat)-1)<1e-9);
    const zeroed=series(0,0,0,60,24);
    assert.equal(feastRatio(zeroed),1);
    const emptied=series(4,0,0,60,24);
    assert.equal(feastRatio(emptied),Infinity);
  });
  it('crashMetrics deaths + collapse',()=>{
    const cm=crashMetrics(series(4,1,0.2,60,24),agents(24,[1,2]));
    assert.equal(cm.deaths,2);assert.equal(cm.peak,60);
    assert.ok(cm.collapseRatio<0.6);
    const cm2=crashMetrics(series(1,1,1,60,24,false),agents(24,[]));
    assert.equal(cm2.deaths,0);assert.ok(cm2.collapseRatio>=0.9);
  });
  it('causeSplit counts',()=>{
    assert.deepEqual(causeSplit({agents:agents(5,[1,3])}),{energy:2,age:0,both:0,alive:3});
    assert.equal(causeSplit(null),null);
    assert.equal(meanToxin({toxin:tx(1,2)}),1.5);
  });
  it('scorer GO branch (fresh feasts+crashes, deep steady)',()=>{
    const rows=[row(474379,'fresh',tx(0,0),0.75,series(4,1,0.2,60,24),[1,2]),
      row(474379,'deep',tx(13,13),0.958,series(1,1,0.9,40,24,false),[]),
      row(474388,'fresh',tx(0,0),0.75,series(4,1,0.2,60,24),[1,2]),
      row(474388,'deep',tx(13,13),0.958,series(1,1,0.9,40,24,false),[])];
    const v=scoreGen1FeastRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-FEAST-GO-V1');
  });
  it('scorer NOGO/INVALID branches',()=>{
    const mk=(fser,fdied,dser)=>[row(474379,'fresh',tx(0,0),0.9,fser,fdied),
      row(474379,'deep',tx(13,13),0.958,dser,[]),
      row(474388,'fresh',tx(0,0),0.9,fser,fdied),
      row(474388,'deep',tx(13,13),0.958,dser,[])];
    const vn=scoreGen1FeastRows(mk(series(1,1,1,60,24,false),[],series(1,1,0.9,40,24,false)));
    assert.equal(vn.verdict,'GEN1-FEAST-NOGO-V1');assert.equal(vn.go,false);
    const badT=[row(474379,'fresh',tx(5,5),0.9,series(4,1,0.2,60,24),[1,2]),
      row(474379,'deep',tx(13,13),0.958,series(1,1,0.9,40,24,false),[]),
      row(474388,'fresh',tx(5,5),0.9,series(4,1,0.2,60,24),[1,2]),
      row(474388,'deep',tx(13,13),0.958,series(1,1,0.9,40,24,false),[])];
    assert.equal(scoreGen1FeastRows(badT).verdict,'INVALID');
    const badD=mk(series(4,1,0.2,60,24),[1,2],series(4,1,0.2,60,24));
    assert.equal(scoreGen1FeastRows(badD).verdict,'INVALID');
  });
});
