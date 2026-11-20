// GEN1-PLACED V1 fixtures (FROZEN docs/GEN1_PLACED_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, placeNaive +
// survivalFraction on zero-tick learners, scorer GO/NOGO branches,
// constants.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {snapshotWeights} from '../scripts/turn-gated-dev-v1m.mjs';
import {gpBank,scoreGen1PlacedRows,placeNaive,survivalFraction,GP_FIXTURE_SEEDS,GP_TRIAGE_SEEDS,GP_ARMS,GP_MARGIN,GP_DEPLETE_TICKS,GP_MEASURE_TICKS,GP_PLACE_ENERGY} from '../scripts/gen1-placed-dev.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const row=(seed,arm,survival)=>({history:{seed},arm,stage:'main',transferred:24,survival,
  depleteTicks:arm==='deep'?1024:0,measureTicks:1792,
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:Math.round(survival*24)}});

describe('gen1-placed-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'gen1placed-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=gpBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'gen1-placed-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.equal(GP_FIXTURE_SEEDS[0],474289);
    assert.deepEqual([...GP_TRIAGE_SEEDS],[490064,490065,490066,490067,490068,490069,490070,490071,490072]);
    assert.ok(!GP_FIXTURE_SEEDS.some(s=>GP_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...GP_ARMS],['deep','fresh']);
    assert.equal(GP_DEPLETE_TICKS,1024);assert.equal(GP_MEASURE_TICKS,1792);assert.equal(GP_PLACE_ENERGY,48);
    rmSync(dir,{recursive:true,force:true});
  });
  it('placeNaive installs init weights, clears store, freezes, sets energy 48 + re-baselines books',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const snap=snapshotWeights(run.learners);
    const e0=run.world.energy();
    for(const id of Object.keys(run.learners)){run.learners[id].weights.taste.fill(9.9);run.learners[id].recent.push({phi:[0.1],target:0});}
    const r=placeNaive(run,snap);
    assert.ok(r.transferred>0);
    assert.ok(Number.isFinite(r.placedEnergyDelta));
    assert.ok(Math.abs(run.world.energy()-(e0+r.placedEnergyDelta))<1e-6);
    for(const id of Object.keys(run.learners)){
      const st=run.learners[id];
      assert.ok(st.weights.taste.every((v,i)=>v===snap[id].taste[i]));
      assert.equal(st.recent.length,0);assert.equal(st.older.length,0);
      assert.equal(st.acquisition,false);
    }
    for(const fly of run.world.flies)assert.equal(fly.energy,GP_PLACE_ENERGY);
  });
  it('survivalFraction reads alive founders',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    assert.equal(survivalFraction(run),1.0);
    run.world.flies.pop();run.world.flies.pop();
    assert.ok(Math.abs(survivalFraction(run)-22/24)<1e-9);
  });
  it('scorer GO branch (depleted kills faster)',()=>{
    const rows=[row(474289,'deep',0.5),row(474289,'fresh',1.0),row(474298,'deep',0.5),row(474298,'fresh',1.0)];
    const v=scoreGen1PlacedRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-PLACED-GO-V1');
  });
  it('scorer GO branch (reverse: fresh kills faster)',()=>{
    const rows=[row(474289,'deep',1.0),row(474289,'fresh',0.5),row(474298,'deep',1.0),row(474298,'fresh',0.5)];
    const v=scoreGen1PlacedRows(rows);
    assert.equal(v.go,true);assert.equal(v.verdict,'GEN1-PLACED-GO-V1');
  });
  it('scorer NOGO branch (no world effect, incl. floor/ceiling ties)',()=>{
    const rows=[row(474289,'deep',1.0),row(474289,'fresh',1.0),row(474298,'deep',0.0),row(474298,'fresh',0.0)];
    const v=scoreGen1PlacedRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'GEN1-PLACED-NOGO-V1');
    assert.ok(GP_MARGIN===1.1);
  });
});
