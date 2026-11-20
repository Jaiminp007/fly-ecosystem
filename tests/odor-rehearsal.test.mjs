// ODOR DEV ROUND 2 fixtures: rehearsal phase table + machinery (PLAN V1 §2).
// Pure asserts + synthetic-seed smoke (1-tick slots test machinery, not the
// frozen schedule; frozen sums asserted purely). Zero bank worlds.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTINUAL_PHASES,CONTINUAL_PHASES_REHEARSAL,ODOR_R2_TICKS,ODOR_R2_SEED_MAP,ODOR_R2_OP_CAP,ODOR_R2_WALL_CAP_SECONDS} from '../learning/continual-regimes.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

const options={history:{seed:900021,cueSeed:900022,resourceSeeds:[900023,900024,900025,900026]},
  reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual'};

test('rehearsal table: A256-B512-A128-C512-A128-D256 = 1792, frozen',()=>{
  assert.equal(CONTINUAL_PHASES_REHEARSAL.length,6);
  assert.deepEqual(CONTINUAL_PHASES_REHEARSAL.map(p=>p.id),['A','B','A','C','A','D']);
  assert.deepEqual(CONTINUAL_PHASES_REHEARSAL.map(p=>p.ticks),[256,512,128,512,128,256]);
  assert.equal(CONTINUAL_PHASES_REHEARSAL.reduce((s,p)=>s+p.ticks,0),1792);
  assert.ok(Object.isFrozen(CONTINUAL_PHASES_REHEARSAL));
  const d=CONTINUAL_PHASES_REHEARSAL[5];
  assert.equal(d.kind,'stable');assert.equal(d.nutrient,.4);assert.equal(d.shiftEvery,0);
});

test('frozen round-2 numbers: schedule, seed map, caps (PLAN V1)',()=>{
  assert.deepEqual([...ODOR_R2_TICKS],[256,512,128,512,128,256]);
  assert.equal(ODOR_R2_TICKS.reduce((s,t)=>s+t,0),1792);
  assert.deepEqual([...ODOR_R2_SEED_MAP],[0,1,0,2,0,3]);
  assert.ok(Math.max(...ODOR_R2_SEED_MAP)<4,'seed map stays inside the 4 reused resource seeds');
  assert.equal(ODOR_R2_OP_CAP,40_000_000_000);
  assert.equal(ODOR_R2_WALL_CAP_SECONDS,3600);
});

test('constructor accepts the table + seed map; rejects bad shapes and non-continuous regimes',()=>{
  const run=new OdorRoutedExperiment({...options,phaseTable:CONTINUAL_PHASES_REHEARSAL,phaseSeedMap:[0,1,0,2,0,3]});
  assert.deepEqual(run.phaseSeedMap,[0,1,0,2,0,3]);
  assert.throws(()=>new OdorRoutedExperiment({...options,phaseTable:[{id:'A'}]}));
  assert.throws(()=>new OdorRoutedExperiment({...options,phaseTable:CONTINUAL_PHASES_REHEARSAL,phaseSeedMap:[0,1]}));
  assert.throws(()=>new OdorRoutedExperiment({...options,phaseTable:CONTINUAL_PHASES_REHEARSAL,trainingRegime:'freeze-after-A'}));
  const plain=new OdorRoutedExperiment(options);
  assert.equal(Object.hasOwn(plain,'phaseTable'),false);
  assert.equal(Object.hasOwn(plain,'phaseSeedMap'),false);
});

test('smoke: six 1-tick slots run to transfer with slot anchor keys + final-A alias',()=>{
  const run=new OdorRoutedExperiment({...options,phaseTable:CONTINUAL_PHASES_REHEARSAL,phaseSeedMap:[0,1,0,2,0,3],phaseDurations:[1,1,1,1,1,1]});
  run.advance(9);
  assert.equal(run.finished,true);assert.equal(run.transfer,true);
  for(const k of ['A1','B1','A2','C1','A3','D1','A'])assert.ok(run.anchors[k],k);
  assert.deepEqual(run.anchors['A'],run.anchors['A3']);
});
