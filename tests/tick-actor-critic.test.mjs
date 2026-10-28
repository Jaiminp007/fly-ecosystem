import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {cueObservation,motorPrimitive} from '../learning/cue-foraging.mjs';
import {odorIdentityCode} from '../learning/odor-identity.mjs';
import {encodedStateBytes,billSarsaWork,chargeForStep} from '../learning/sarsa-experiment.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';
import {TICK_AC_PARAMETERS,TICK_AC_ACTIONS,createTickBody,tickFeatures,tickNetwork,
  chooseTickAction,observeTickBody,tickMotor,freezeTickBody,resetTickBody,restoreTickBody} from '../learning/tick-actor-critic.mjs';

const pricing = {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)};
function sensory(tick = 1, bits = [1,-1,1,-1]) {
  const raw = Array(17).fill(0);
  raw[0] = .8; raw[2] = .6; raw[3] = .5; raw[4] = .4; raw[13] = tick%2 ? 0 : -.25; raw[16] = 1;
  return {raw,observation: cueObservation(raw,bits)};
}
function choose(state, tick, energy = 50, emit = () => {}) {
  return chooseTickAction(state,{agentId: state.agentId,tick,energy,...sensory(tick)},emit);
}
function observe(state, tick, energy = 50, terminal = false, emit = () => {}) {
  observeTickBody(state,{agentId: state.agentId,tick,energy,terminal},emit);
}

test('all 16 identity codes survive alongside raw directions; neutral keeps lawful physical sensors', () => {
  for (let pattern = 0; pattern < 16; pattern++) {
    const bits = Array.from({length: 4},(_,index) => pattern>>index&1 ? 1 : -1);
    const state = createTickBody(1,101), own = sensory(1,bits), before = structuredClone(own);
    const inputs = tickFeatures(state,own.raw,own.observation);
    assert.deepEqual(inputs.slice(0,17),own.raw);
    assert.deepEqual(inputs.slice(17),odorIdentityCode(bits));
    assert.deepEqual(own,before);
  }
  const state = createTickBody(1,101), neutral = sensory(1,[0,0,0,0]);
  assert.deepEqual(tickFeatures(state,neutral.raw,neutral.observation).slice(17),Array(16).fill(0));
  const wrong = structuredClone(neutral); wrong.observation[13] = 1;
  assert.throws(() => tickFeatures(state,wrong.raw,wrong.observation));
  assert.throws(() => tickFeatures(state,Array(17).fill(NaN),neutral.observation));
});

test('all 161 actor log-probability and critic derivatives match central finite differences', () => {
  const weights = Array.from({length: TICK_AC_PARAMETERS},(_,index) => Math.sin(index*.7)*.1);
  const state = createTickBody(1,101), own = sensory(), inputs = tickFeatures(state,own.raw,own.observation);
  const evaluate = (parameters,action = null) => tickNetwork(parameters,inputs,{scalarOperations: 0},action);
  const epsilon = 1e-6;
  for (let action = 0; action < 4; action++) {
    const gradients = evaluate(weights,action);
    for (let index = 0; index < TICK_AC_PARAMETERS; index++) {
      const above = [...weights], below = [...weights]; above[index] += epsilon; below[index] -= epsilon;
      const upper = evaluate(above), lower = evaluate(below);
      const actor = (Math.log(upper.probabilities[action])-Math.log(lower.probabilities[action]))/(2*epsilon);
      const critic = (upper.value-lower.value)/(2*epsilon);
      assert.ok(Math.abs(actor-gradients.actorGradient[index]) < 1e-8,`actor ${action}/${index}`);
      assert.ok(Math.abs(critic-gradients.criticGradient[index]) < 1e-8,`critic ${action}/${index}`);
    }
  }
});

test('declared abstract work matches independently counted init, forward, gradient and update operations', () => {
  const state = createTickBody(1,101); assert.equal(state.work.scalarOperations,132*9+1);
  const own = sensory(), inputs = tickFeatures(state,own.raw,own.observation), work = {scalarOperations: 0};
  tickNetwork(state.weights,inputs,work); assert.equal(work.scalarOperations,340);
  work.scalarOperations = 0; tickNetwork(state.weights,inputs,work,0); assert.equal(work.scalarOperations,678);
  const before = state.work.scalarOperations, action = choose(state,1);
  assert.equal(state.work.scalarOperations-before,21+340+7+678+2*(action+1));
  const afterChoice = state.work.scalarOperations;
  observe(state,1,49,true);
  assert.equal(state.work.scalarOperations-afterChoice,8+161*10);
  assert.equal(state.work.liveUpdates,1);
});

test('tick reward, bootstrap, eligibility and joint actor/critic updates reconstruct independently', () => {
  const state = createTickBody(1,101), rows = [];
  choose(state,1,50); observe(state,1,49);
  const before = structuredClone(state), next = sensory(2), scratch = {scalarOperations: 0};
  const inputs = tickFeatures({work: scratch},next.raw,next.observation);
  const nextValue = tickNetwork(before.weights,inputs,scratch).value;
  const delta = (49-50)/120+.99*nextValue-before.pending.value;
  choose(state,2,49,row => rows.push(row));
  assert.equal(rows.length,1); assert.equal(rows[0].duration,1); assert.equal(rows[0].delta,delta);
  for (let index = 0; index < TICK_AC_PARAMETERS; index++) {
    const actorTrace = .99*.9*before.eligibility[0][index]+before.pending.actorGradient[index];
    const criticTrace = .99*.9*before.eligibility[1][index]+before.pending.criticGradient[index];
    const expected = Math.max(-4,Math.min(4,before.weights[index]+(.01*delta*actorTrace+.05*delta*criticTrace)));
    assert.equal(state.eligibility[0][index],actorTrace); assert.equal(state.eligibility[1][index],criticTrace);
    assert.equal(state.weights[index],expected);
  }
  observe(state,2,-.1,true,row => rows.push(row));
  assert.equal(rows[1].nextValue,0); assert.equal(rows[1].finalEnergy,-.1);
  assert.equal(rows[1].reward,(-.1-49)/120);
  assert.ok(state.eligibility.every(trace => trace.every(value => value === 0)));
  assert.throws(() => choose(state,3));
});

test('checkpoint restore exactly continues with private RNG and no cross-body or hidden-label access', () => {
  const state = createTickBody(1,101), other = createTickBody(2,102), untouched = structuredClone(other);
  choose(state,1); const midAction = restoreTickBody(JSON.parse(JSON.stringify(state)));
  observe(state,1,49); observe(midAction,1,49); assert.deepEqual(midAction,state);
  const twin = restoreTickBody(JSON.parse(JSON.stringify(state)));
  for (let tick = 2; tick <= 40; tick++) {
    assert.equal(choose(state,tick,50-tick*.01),choose(twin,tick,50-tick*.01));
    observe(state,tick,50-tick*.01); observe(twin,tick,50-tick*.01);
  }
  assert.deepEqual(twin,state); assert.deepEqual(other,untouched);
  const hidden = structuredClone(state), plain = structuredClone(state);
  const own = {agentId: 1,tick: 41,energy: 49,...sensory(41)};
  assert.equal(chooseTickAction(hidden,{...own,valence: -1,taskId: 'B',otherBodyReward: 99}),chooseTickAction(plain,own));
  assert.deepEqual(hidden,plain);
  const mismatched = structuredClone(state);
  assert.throws(() => chooseTickAction(mismatched,{...own,agentId: 2}));
  assert.deepEqual(mismatched,state);
  const invalid = structuredClone(state); invalid.pending.actorGradient[0] = NaN;
  assert.throws(() => restoreTickBody(invalid));
});

test('freeze preserves learned weights; reset restores initialization without rewinding own exploration', () => {
  const state = createTickBody(1,101), initial = structuredClone(state.weights);
  choose(state,1); observe(state,1,49); choose(state,2,49); observe(state,2,48);
  assert.notDeepEqual(state.weights,initial);
  const weights = structuredClone(state.weights); freezeTickBody(state);
  assert.equal(state.pending,null);
  const beforeRng = state.rngState; choose(state,3,48); observe(state,3,47);
  assert.equal(state.rngState,advanceRng(beforeRng)); assert.deepEqual(state.weights,weights);
  const counters = {decisions: state.decisions,transitions: state.transitions,rngState: state.rngState};
  resetTickBody(state); assert.deepEqual(state.weights,initial); assert.equal(state.acquisition,false);
  for (const [key,value] of Object.entries(counters)) assert.equal(state[key],value);
  assert.deepEqual(restoreTickBody(state),state);
});

test('same old steering supports the declared factorial action menu, without a tuned bearing law', () => {
  assert.equal(TICK_AC_ACTIONS.length,4);
  const state = createTickBody(1,101), own = sensory();
  for (let action = 0; action < 4; action++) {
    const before = state.work.scalarOperations, accept = action === 0 || action === 2;
    const expected = motorPrimitive(own.raw,accept ? 1 : -1); if (action >= 2) expected[1] = -1;
    assert.deepEqual(tickMotor(state,own.raw,action),expected);
    assert.equal(state.work.scalarOperations-before,accept ? 6 : 9);
  }
});

test('actual retained state and post-terminal work flow through existing byte-time and debt accounting', () => {
  const state = createTickBody(1,101);
  choose(state,1); tickMotor(state,sensory().raw,0);
  const bytes = encodedStateBytes(state), operations = state.work.scalarOperations;
  const bill = chargeForStep(state,pricing);
  assert.equal(state.charge.storageBytes,bytes);
  assert.equal(bill.energyCost,operations*pricing.operationEnergy+bytes*pricing.byteEnergyPerSecond*.1);
  bill.afterEnergyCharge({paid: .00001});
  observe(state,1,-state.charge.outstandingEnergy,true);
  const debtBefore = state.charge.outstandingEnergy, unbilled = state.work.scalarOperations-state.charge.operationsBilled;
  billSarsaWork(state,pricing);
  assert.equal(state.charge.outstandingEnergy,debtBefore+unbilled*pricing.operationEnergy);
  assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy) < 1e-12);
  assert.deepEqual(restoreTickBody(state),state);
});

test('synthetic chosen-action reinforcement changes shared responses, without establishing ecological memory pressure', () => {
  const state = createTickBody(1,101), own = sensory(), alien = sensory(1,[-1,1,-1,1]);
  const response = (body,context) => tickNetwork(body.weights,tickFeatures(body,context.raw,context.observation),body.work).probabilities;
  const baseline = response(state,own), otherBefore = response(state,alien);
  assert.ok(Math.abs(baseline[0]-.475) < 1e-15);
  const action = choose(state,1,50); observe(state,1,51);
  choose(state,2,51); observe(state,2,51);
  assert.ok(response(state,own)[action] > baseline[action]);
  assert.notDeepEqual(response(state,alien),otherBefore);
});

test('named two-founder physical fixture learns, pays actual work/storage, and cold-continues exactly', () => {
  const world = new World({seed: 17003,founders: 2,reproduction: false,mutation: false,learning: false,
    controller: 'episodic-actor',episodicParameters: {actuator: 'move'},cueForaging: true,seasonal: false,nutrient: 0});
  world.obstacles = [];
  for (const [index,fly] of world.flies.entries()) Object.assign(fly,{x: 100+index*400,y: 100,energy: 50});
  for (const patch of world.food) Object.assign(patch,{amount: 0,regrowth: 0});
  Object.assign(world.food[0],{x: 100,y: 100,amount: .8,capacity: 1,cueId: 1,cue: [1,-1,1,-1],valence: 1});
  world.initialEnergy = world.energy();
  const run = {world,learners: Object.fromEntries(world.flies.map(fly => [fly.id,createTickBody(fly.id,17003+fly.id)]))};
  const step = target => {
    const before = [...target.world.flies];
    target.world.step((fly,raw,tick) => {
      const state = target.learners[fly.id], action = chooseTickAction(state,{agentId: fly.id,tick,
        energy: fly.energy-state.charge.outstandingEnergy,raw,observation: cueObservation(raw,fly.sensedCue)});
      const outputs = tickMotor(state,raw,action), bill = chargeForStep(state,pricing);
      return {...bill,afterController: native => native.splice(0,5,...outputs),afterStep: row => {
        assert.ok(Math.abs(row.initialEnergy-row.cost+row.beneficialEaten-row.toxinDamage-row.finalEnergy) < 1e-10);
      }};
    });
    for (const fly of before) {
      const state = target.learners[fly.id], alive = target.world.flies.includes(fly);
      observeTickBody(state,{agentId: fly.id,tick: target.world.tick,energy: (alive ? fly.energy : 0)-state.charge.outstandingEnergy,terminal: !alive});
      if (!alive) billSarsaWork(state,pricing);
    }
    assert.ok(Math.abs(target.world.metrics().accountingError) < 1e-8);
  };
  for (let tick = 0; tick < 3; tick++) step(run);
  const captured = JSON.parse(JSON.stringify({world: world.checkpoint(),learners: run.learners}));
  const twin = {world: World.restore(captured.world),learners: Object.fromEntries(Object.entries(captured.learners).map(([id,state]) => [id,restoreTickBody(state)]))};
  for (let tick = 0; tick < 9; tick++) {step(run); step(twin);}
  assert.deepEqual(twin.world.checkpoint(),run.world.checkpoint());
  assert.deepEqual(twin.learners,run.learners);
  for (const state of Object.values(run.learners)) {
    assert.equal(state.decisions,12); assert.equal(state.transitions,11);
    assert.ok(state.charge.incurredEnergy > 0 && state.charge.paidEnergy > 0);
    assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy) < 1e-10);
  }
});
