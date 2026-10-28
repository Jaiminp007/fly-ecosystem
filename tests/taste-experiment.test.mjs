import test from 'node:test';
import assert from 'node:assert/strict';
import {TasteExperiment,runTasteProbe} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {runTastePressureBattery,tastePressureEffects} from '../learning/taste-pressure.mjs';
const history={seed:255001,cueSeed:255002,resourceSeeds:[255003,255004,255005,255006]};
const create=(arm='candidate')=>new TasteExperiment({history,arm,reference:{...structuredClone(VALUE_REFERENCE),founders:2}});
function quiet(run){for(const f of run.world.flies){f.energy=120;Object.assign(f.genome.traits,{speed:0,metabolism:0,lifespan:1000});}for(const p of run.world.food){p.amount=0;p.regrowth=0;}
  run.world.initialEnergy=run.world.energy();run.startingEnergy=240;}

test('physical integration resumes exactly, bills real policy work and does not change default physics',()=>{
  const a=create();quiet(a);a.advance(48);const b=TasteExperiment.restore(a.checkpoint());a.advance(32);b.advance(32);
  assert.deepEqual(a.checkpoint(),b.checkpoint());assert.ok(Math.abs(a.endpoint().accountingResidual)<1e-7);assert.ok(a.endpoint().paidEnergy>0);
  assert.equal(a.world.config.learning,false);assert.equal(a.world.config.reproduction,false);
});
test('continuing A/B/C and inference probes preserve bodies, debts, original denominators and exact sham',()=>{
  const run=create();quiet(run);run.advance(1536);assert.ok(run.atA&&run.atB&&run.atC);assert.deepEqual(Object.keys(run.savedModels),['A','B','C']);
  const spec={family:'A',version:'A',seed:255007,ticks:16,founders:2},first=runTasteProbe(run.atC,spec),sham=runTasteProbe(run.atC,spec),reset=runTasteProbe(run.atC,{...spec,version:'reset'});
  assert.deepEqual(first,sham);assert.equal(first.startWorldSha256,reset.startWorldSha256);assert.equal(first.endpoint.startingEnergy,reset.endpoint.startingEnergy);assert.equal(first.endpoint.startingDebt,reset.endpoint.startingDebt);
  assert.ok(Math.abs(first.endpoint.accountingResidual)<1e-7);assert.equal(first.founders,2);
  const transfer=runTasteProbe(run.atC,{family:'transfer',version:'current',seed:255008,ticks:8,founders:2});assert.ok(Number.isFinite(transfer.value));
  const battery=runTastePressureBattery(run.atC,{probeSeeds:{A:255007,B:255008,transfer:255009}},{founders:2,ticks:8});
  assert.equal(Object.keys(battery.probes).length,12);assert.deepEqual(battery.sham,battery.probes['A:A']);assert.ok(Object.values(tastePressureEffects(battery)).every(Number.isFinite));
});

test('full-speed experimental actions and controls use the same physical output and resume exactly',()=>{
  const run=new TasteExperiment({history,arm:'acceptCruise',cruiseSpeed:1,reference:{...structuredClone(VALUE_REFERENCE),founders:2}});
  run.advance(1);assert.ok(run.world.flies.every(f=>f.lastActions[1]===1));const resumed=TasteExperiment.restore(run.checkpoint());
  run.advance(5);resumed.advance(5);assert.deepEqual(run.checkpoint(),resumed.checkpoint());
});
test('unlearned control remains untrained and deaths cannot revive through probes',()=>{
  const unlearned=create('unlearned');unlearned.advance(12);assert.ok(Object.values(unlearned.learners).every(s=>s.work.liveUpdates===0));
  const extinct=create();for(const f of extinct.world.flies)f.genome.traits.lifespan=.01;extinct.advance(2);
  assert.equal(extinct.world.flies.length,0);assert.equal(extinct.endpoint().founders,2);assert.ok(Object.values(extinct.learners).every(s=>s.dead));
  const probe=runTasteProbe(extinct.checkpoint(),{seed:255009,founders:2});assert.equal(probe.survivors,0);assert.equal(probe.founders,2);assert.equal(probe.skippedAllDead,true);
});
