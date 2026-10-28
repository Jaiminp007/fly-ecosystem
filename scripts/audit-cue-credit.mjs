import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {World} from '../engine.mjs';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {createMushroomBody, chooseMushroomAction, observeMushroomBody} from '../learning/mushroom-body.mjs';

const positiveCue = [1,-1,1,-1];
const negativeCue = [-1,1,-1,1];
const separation = (left, right) => Math.hypot(left.x-right.x,left.y-right.y);

function physicalFixture(name, patches, move = -1) {
  const world = new World({seed: 17001,founders: 2,reproduction: false,mutation: false,
    learning: false,controller: 'episodic-actor',episodicParameters: {actuator: 'move'},
    seasonal: false,nutrient: 0,challenges: 'off',cueForaging: true});
  world.obstacles = [];
  const focal = world.flies[0];
  for (const [index,fly] of world.flies.entries()) {
    Object.assign(fly,{x: index ? 800 : 100,y: index ? 500 : 100,heading: 0,energy: 50});
    fly.genome.traits.speed = 30;
  }
  for (const patch of world.food) Object.assign(patch,{amount: 0,regrowth: 0});
  for (const [index,patch] of patches.entries()) Object.assign(world.food[index],patch,{regrowth: 0,capacity: 2});
  world.initialEnergy = world.energy();
  const initial = world.checkpoint();
  function advance(target) {
    let sensed, receipt;
    const body = target.flies.find(fly => fly.id === focal.id);
    const before = {x: body.x,y: body.y};
    const amounts = target.food.map(patch => patch.amount);
    target.step((fly,raw,tick) => {
      if (fly.id === body.id) {
        const foods = target.food.filter(patch => patch.amount > .06 && separation(fly,patch) <= fly.genome.traits.sense);
        const ranked = [...foods].sort((left,right) => right.amount/(separation(fly,right)+20)-left.amount/(separation(fly,left)+20))[0];
        sensed = {tick,cueId: fly.sensedCueId,cue: [...fly.sensedCue],raw: [...raw],
          observation: cueObservation(raw,fly.sensedCue),rankedCueId: ranked?.cueId ?? 0,
          contactCueIds: foods.filter(patch => separation(fly,patch) <= 15).map(patch => patch.cueId)};
      }
      return {energyCost: 0,afterController: outputs => {
        outputs.splice(0,5,0,fly.id === body.id ? move : -1,fly.id === body.id ? 1 : -1,-1,0);
      },afterStep: row => {if (row.agentId === body.id) receipt = row;}};
    });
    assert.ok(Math.abs(target.metrics().accountingError) < 1e-9);
    return {name,before,after: {x: body.x,y: body.y},sensed,receipt,
      consumed: target.food.flatMap((patch,index) => amounts[index] > patch.amount ?
        [{cueId: patch.cueId,valence: patch.valence,amount: amounts[index]-patch.amount}] : []),
      previousFoodAfter: body.lastFood,accountingResidual: target.metrics().accountingError};
  }
  const result = advance(world), replay = World.restore(initial);
  assert.deepEqual(advance(replay),result);
  assert.deepEqual(replay.checkpoint(),world.checkpoint());
  return {...result,exactCheckpointReplay: true};
}

function creditFixture(terminal = false) {
  const state = createMushroomBody(1,17002);
  const raw = Array(17).fill(0); raw[4] = 50/120; raw[16] = 1;
  const first = cueObservation(raw,positiveCue), later = cueObservation(raw,negativeCue);
  chooseMushroomAction(state,{agentId: 1,tick: 1,energy: 50,observation: first});
  const pending = structuredClone(state.pending);
  for (let tick = 1; tick <= 8; tick++) {
    observeMushroomBody(state,{agentId: 1,tick,energy: tick < 4 ? 50 : 49,terminal: terminal && tick === 8});
  }
  if (!terminal) chooseMushroomAction(state,{agentId: 1,tick: 9,energy: 49,observation: later});
  const transition = state.recent[0];
  assert.equal(state.transitions,1);
  assert.equal(transition.reward,-1/120);
  assert.deepEqual(transition.phi,pending.phi);
  assert.equal(transition.duration,8);
  return {terminal,decisionTicks: terminal ? [1] : [1,9],
    suppliedObservationTicks: terminal ? [1] : [1,9],
    observeTicks: [1,2,3,4,5,6,7,8],energyDropTick: 4,
    pendingFeatures: pending.phi,transition,
    interpretation: 'Synthetic API schedule: intervening cues are not supplied; the net energy change credits the first decision features.'};
}

export function auditCueCredit() {
  const patch = (cueId,x,y,amount,valence) => ({cueId,x,y,amount,valence,cue: valence > 0 ? [...positiveCue] : [...negativeCue]});
  const fixtures = [
    physicalFixture('contact-versus-ranked',[patch(1,100,102,.1,1),patch(2,130,100,2,-1)]),
    physicalFixture('mixed-contact-intake',[patch(1,100,101,.1,1),patch(2,100,102,.8,-1)]),
    physicalFixture('movement-crosses-contact',[patch(1,100,114.9,.1,1),patch(2,116,100,.8,-1)],1)
  ];
  const sourcePaths = ['engine.mjs','learning/cue-foraging.mjs','learning/mushroom-body.mjs','scripts/audit-cue-credit.mjs'];
  return {schema: 1,kind: 'deterministic-cue-credit-engineering-diagnostic',
    scope: 'Named synthetic fixtures, not performance histories, prevalence estimates, a qualified learner, or proof of the cause of prior failures.',
    sources: Object.fromEntries(sourcePaths.map(path => [path,createHash('sha256').update(readFileSync(new URL(`../${path}`,import.meta.url))).digest('hex')])),
    physicalFixtures: fixtures,creditFixtures: [creditFixture(),creditFixture(true)]};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--output'),'Usage: node scripts/audit-cue-credit.mjs [--output PATH]');
  const text = JSON.stringify(auditCueCredit(),null,2)+'\n';
  if (args.length) writeFileSync(args[1],text,{flag: 'wx'});
  else process.stdout.write(text);
}
