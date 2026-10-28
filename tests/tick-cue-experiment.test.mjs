import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceRng,digest} from '../learning/intervention-study.mjs';
import {createTickBody} from '../learning/tick-actor-critic.mjs';
import {TickCueExperiment,TICK_CUE_ARMS,TICK_CUE_PROBES,runTickCueProbe} from '../learning/tick-cue-experiment.mjs';

const history = {seed: 17031,cueSeed: 17032,resourceSeeds: [17033,17034,17035,17036],shuffleSeed: 17037,nullSeed: 17038};
const reference = {founders: 2,actorParameters: {},parameters: {actuator: 'move',moveMode: 'levels',slowSpeed: .15,fastSpeed: .5,decisionTicks: 8,creditTicks: 8,returnMode: 'td',discount: .99}};
const pricing = {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)};
const config = (arm,emit = () => {}) => ({history,reference,pricing,arm,emit});
function quietFixture(run) {
  for (const [index,fly] of run.world.flies.entries()) {
    Object.assign(fly,{energy: 120,x: 100+400*index,y: 100,age: 0});
    Object.assign(fly.genome.traits,{speed: 0,metabolism: 0,lifespan: 1000});
  }
  for (const patch of run.world.food) Object.assign(patch,{amount: 0,regrowth: 0});
  run.world.initialEnergy = run.world.energy(); run.startingEnergy = 240;
  return run;
}

test('all matched arms start with common physical states and fixed controls retain no unused circuit', () => {
  const runs = TICK_CUE_ARMS.map(arm => new TickCueExperiment(config(arm)));
  const matched = runs.filter(run => !['incumbent','nullCandidate','nullBlind'].includes(run.arm));
  assert.equal(new Set(matched.map(run => digest(run.world.checkpoint()))).size,1);
  for (const run of runs) {
    assert.equal(run.world.config.reproduction,false); assert.equal(run.world.config.mutation,false);
    assert.equal(run.world.config.learning,run.arm === 'incumbent');
    for (const state of Object.values(run.learners)) {
      assert.equal(Object.hasOwn(state,'codebook'),false);
      assert.equal(Object.hasOwn(state,'valence'),false);
      assert.equal(Object.hasOwn(state,'savedModels'),false);
      if (state.kind === 'fixed-tick-menu-control') {
        assert.equal(Object.hasOwn(state,'weights'),false); assert.equal(Object.hasOwn(state,'eligibility'),false);
      }
    }
  }
  const nullRun = runs.find(run => run.arm === 'nullCandidate');
  for (const cueId of new Set(nullRun.world.food.map(patch => patch.cueId))) {
    assert.equal(new Set(nullRun.world.food.filter(patch => patch.cueId === cueId).map(patch => patch.valence)).size,2);
  }
});

test('all thirteen arms cold-continue exactly; random and fixed choices pay their own work and use private RNG', () => {
  for (const arm of TICK_CUE_ARMS) {
    const events = [], run = quietFixture(new TickCueExperiment(config(arm,event => events.push(event))));
    run.advance(3); const twinEvents = [], twin = TickCueExperiment.restore(run.checkpoint(),event => twinEvents.push(event));
    events.length = 0; run.advance(5); twin.advance(5);
    assert.deepEqual(twin.checkpoint(),run.checkpoint(),arm); assert.deepEqual(twinEvents,events,arm);
    assert.equal(run.world.tick,8); assert.equal(run.endpoint().founders,2);
    for (const state of Object.values(run.learners)) {
      assert.equal(state.decisions,8);
      assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy) < 1e-10);
      if (state.kind === 'fixed-tick-menu-control') {
        let rng = (history.seed ^ Math.imul(state.agentId,2654435761)) >>> 0 || 1;
        if (arm === 'random') for (let tick = 0; tick < 8; tick++) rng = advanceRng(rng);
        assert.equal(state.rngState,rng);
        const decisions = events.filter(event => event.type === 'decision' && event.own.agentId === state.agentId);
        for (let index = 1; index < decisions.length; index++) {
          const event = decisions[index], motor = [0,2].includes(event.choice) ? 6 : 9;
          assert.equal(event.scalarOperations-decisions[index-1].scalarOperations,(arm === 'random' ? 10 : 1)+motor);
        }
      }
    }
  }
});

test('observer mutation cannot change policy inputs, outputs, or continued state', () => {
  const normal = quietFixture(new TickCueExperiment(config('candidate')));
  const attacked = TickCueExperiment.restore(normal.checkpoint(),event => {
    if (event.own?.raw) event.own.raw.fill(999);
    if (event.outputs) event.outputs.fill(999);
    if (event.own?.observation) event.own.observation.fill(999);
  });
  normal.advance(8); attacked.advance(8); assert.deepEqual(attacked.checkpoint(),normal.checkpoint());
});

test('phase entry freezes after A or resets on B/C without changing bodies or rewinding exploration', () => {
  for (const arm of ['candidate','frozen','reset']) {
    const run = quietFixture(new TickCueExperiment(config(arm))); run.advance(509);
    const twin = TickCueExperiment.restore(run.checkpoint()); run.advance(3); twin.advance(3);
    assert.deepEqual(twin.checkpoint(),run.checkpoint());
    assert.equal(run.world.tick,512); assert.ok(run.savedModels.A);
    const before = structuredClone(run.learners), bodies = structuredClone(run.world.flies), inventory = run.world.energy(), rng = run.world.rng.state;
    assert.equal(run.enterNextPhase(),true);
    assert.deepEqual(run.world.flies,bodies); assert.equal(run.world.energy(),inventory); assert.equal(run.world.rng.state,rng);
    assert.equal(run.resource.family,'B');
    for (const [id,state] of Object.entries(run.learners)) {
      assert.equal(state.rngState,before[id].rngState);
      if (arm === 'frozen') {assert.equal(state.acquisition,false); assert.equal(state.pending,null); assert.deepEqual(state.weights,run.savedModels.A[id]);}
      if (arm === 'reset') {
        assert.deepEqual(state.weights,createTickBody(state.agentId,state.rngState).weights);
        assert.equal(state.work.scalarOperations-before[id].work.scalarOperations,1189);
        assert.equal(state.pending,null);
      }
    }
    const resumed = TickCueExperiment.restore(run.checkpoint()); run.advance(4); resumed.advance(4);
    assert.deepEqual(resumed.checkpoint(),run.checkpoint());
    if (arm === 'candidate') assert.ok(Object.values(run.learners).every(state => state.transitions === 515));
    run.advance(1024-run.world.tick); assert.ok(run.savedModels.B);
    const beforeC = structuredClone(run.learners); run.enterNextPhase(); assert.equal(run.resource.family,'C');
    for (const [id,state] of Object.entries(run.learners)) {
      assert.equal(state.rngState,beforeC[id].rngState);
      if (arm === 'reset') {
        assert.deepEqual(state.weights,createTickBody(state.agentId,state.rngState).weights);
        assert.equal(state.work.scalarOperations-beforeC[id].work.scalarOperations,1189);
      }
      if (arm === 'frozen') assert.deepEqual(state.weights,run.savedModels.A[id]);
    }
  }
});

test('end-C common-body A/B/C and original-ecology probes are read-only, acquisition-disabled and never refill', () => {
  const run = quietFixture(new TickCueExperiment(config('candidate'))); run.advance(1536);
  assert.equal(run.world.tick,1536); assert.ok(run.atC); assert.ok(run.savedModels.A && run.savedModels.B);
  const checkpoint = run.atC, before = digest(run.checkpoint()), rows = [], probeEvents = {};
  const physicalEnergy = checkpoint.world.world.flies.reduce((sum,fly) => sum+fly.energy,0);
  for (const spec of TICK_CUE_PROBES) {
    const events = [], row = runTickCueProbe(checkpoint,spec,17039,2,{ticks: 4,emit: event => events.push(event)});
    rows.push(row); probeEvents[`${spec.family}/${spec.version}`] = events;
    assert.equal(row.founders,2); assert.equal(row.survival,row.survivors/2);
    assert.equal(row.endpoint.startingEnergy,physicalEnergy);
    assert.equal(row.resetInitializationOperations,spec.version === 'reset' ? 1189*2 : 0);
    assert.equal(row.resetInitializationEnergyPerFounder,row.resetInitializationOperations*pricing.operationEnergy/2);
    assert.ok(row.acquisitionDisabled && row.learnedWeightsUnchanged);
    assert.ok(events.filter(event => event.type === 'probe-start').length === 1);
    assert.equal(events.some(event => event.type === 'transition'),false);
    if (spec.family === 'transfer') for (const event of events.filter(event => event.type === 'decision')) {
      assert.deepEqual(event.own.observation.slice(0,4),[0,.5,.5,.5]);
    }
  }
  for (const family of ['A','B','C','transfer']) assert.equal(new Set(rows.filter(row => row.family === family).map(row => row.startWorldSha256)).size,1);
  const cEvents = probeEvents['transfer/C'], acceptEvents = probeEvents['transfer/accept'];
  assert.ok(acceptEvents.find(event => event.type === 'decision').storageBytes < cEvents.find(event => event.type === 'decision').storageBytes);
  for (const version of ['accept','acceptStationary']) {
    const start = probeEvents[`transfer/${version}`].find(event => event.type === 'probe-start');
    assert.ok(Object.values(start.learners).every(state => !Object.hasOwn(state,'weights')));
  }
  const reset = probeEvents['transfer/reset'].find(event => event.type === 'probe-start');
  for (const [id,state] of Object.entries(reset.learners)) {
    assert.equal(state.work.scalarOperations-checkpoint.state.learners[id].work.scalarOperations,1189);
  }
  assert.equal(digest(run.checkpoint()),before);
  run.advance(256); assert.equal(run.world.tick,1792);
  assert.deepEqual(run.phaseRows.map(row => row.phase),['A','B','C','return-A']);
  assert.equal(run.step(),false); assert.equal(run.world.tick,1792);
  const stopped = TickCueExperiment.restore(run.checkpoint()); assert.equal(stopped.step(),false);
  assert.deepEqual(stopped.checkpoint(),run.checkpoint());
});

test('age deaths retain discarded energy and terminal work debt; extinct probes never insert replacement founders', () => {
  const events = [], run = quietFixture(new TickCueExperiment(config('candidate',event => events.push(event))));
  for (const fly of run.world.flies) fly.genome.traits.lifespan = .01;
  run.advance(1); assert.equal(run.world.flies.length,0);
  assert.equal(run.endpoint().founders,2); assert.equal(run.endpoint().survival,0);
  for (const state of Object.values(run.learners)) {
    assert.ok(state.dead); assert.equal(state.transitions,1);
    assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
    assert.ok(Math.abs(state.charge.outstandingEnergy-1618*pricing.operationEnergy) < 1e-12);
  }
  assert.ok(events.filter(event => event.type === 'observe').every(event => event.discardedEnergy > 0));
  const expected = (-run.startingEnergy-run.endpoint().outstandingEnergy)/2;
  assert.equal(run.endpoint().budgetAdjustedEnergyPerFounder,expected);
  const captured = run.checkpoint(false), original = digest(captured), startingDebt = run.endpoint().outstandingEnergy;
  for (const version of ['C','reset','accept','acceptStationary']) {
    const row = runTickCueProbe(captured,{family: 'transfer',version},17039,2,{ticks: 4});
    assert.ok(row.skippedAllDead); assert.equal(row.value,0);
    assert.equal(row.endpoint.outstandingEnergy,startingDebt); assert.equal(row.endpoint.startingDebt,startingDebt);
    assert.equal(row.endpoint.additionalScalarOperations,0);
    assert.equal(row.resetInitializationOperations,0);
  }
  assert.equal(digest(captured),original);
  const skipped = runTickCueProbe(null,{family: 'A',version: 'C'},17039,2);
  assert.ok(skipped.skippedAllDead); assert.equal(skipped.value,0); assert.equal(skipped.founders,2);
});

test('partial mortality keeps original denominators and common pre-existing debt in all probe policies', () => {
  const run = quietFixture(new TickCueExperiment(config('candidate')));
  run.world.flies[0].genome.traits.lifespan = .01; run.advance(1);
  assert.equal(run.world.flies.length,1);
  const alive = run.learners[run.world.flies[0].id];
  alive.charge.outstandingEnergy += .01; alive.charge.incurredEnergy += .01;
  const debt = run.endpoint().outstandingEnergy, checkpoint = run.checkpoint(false);
  const before = digest(checkpoint), rows = [];
  for (const version of ['C','reset','accept','acceptStationary']) {
    const row = runTickCueProbe(checkpoint,{family: 'transfer',version},17039,2,{ticks: 2}); rows.push(row);
    assert.equal(row.founders,2); assert.equal(row.survivors,1); assert.equal(row.survival,.5);
    assert.equal(row.endpoint.startingDebt,debt);
    assert.equal(row.resetInitializationOperations,version === 'reset' ? 1189 : 0);
    assert.equal(row.value,(row.endpoint.physicalEnergy-row.endpoint.startingEnergy-(row.endpoint.outstandingEnergy-debt))/2);
  }
  assert.equal(new Set(rows.map(row => row.startWorldSha256)).size,1); assert.equal(digest(checkpoint),before);
  const missing = structuredClone(checkpoint); delete missing.state.learners[1]; assert.throws(() => TickCueExperiment.restore(missing));
  const revived = structuredClone(checkpoint); revived.state.learners[1].dead = false; assert.throws(() => TickCueExperiment.restore(revived));
  const badVersion = structuredClone(checkpoint); badVersion.state.savedModels.A = {1: Array(161).fill(NaN)};
  assert.throws(() => TickCueExperiment.restore(badVersion));
  const foreignBody = structuredClone(checkpoint); foreignBody.state.founderIds[0] = 999;
  assert.throws(() => TickCueExperiment.restore(foreignBody));
  const fixed = new TickCueExperiment(config('acceptCruise')).checkpoint(); fixed.state.learners[1].weights = [123];
  assert.throws(() => TickCueExperiment.restore(fixed));
});
