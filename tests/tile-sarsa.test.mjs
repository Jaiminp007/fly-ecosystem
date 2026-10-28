import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createTileBody, tileFeatures, learnTileTransition, restoreTileBody} from '../learning/tile-sarsa-body.mjs';
import {SarsaExperiment, runSarsaProbe} from '../learning/sarsa-experiment.mjs';

const reference = {founders: 4, actorParameters: {}, parameters: {actuator: 'move', moveMode: 'levels', slowSpeed: .15, fastSpeed: .5, decisionTicks: 8, creditTicks: 8, returnMode: 'td', discount: .99}};
const config = {seed: 83, resourceSeeds: [901, 902, 903, 904], arm: 'candidate', reference, pricing: {byteEnergyPerSecond: 1e-5 / (17 * 8), operationEnergy: 5e-6 / 17}};

test('local tile features are bounded, normalized and contain nonlinear sensor conjunctions', () => {
  const s = createTileBody(1, 41), observations = [];
  for (const proximity of [.1, .9]) for (const energy of [.1, .9]) {
    const o = Array(17).fill(0); o[3] = proximity; o[4] = energy; observations.push(o);
  }
  const vectors = observations.map(o => tileFeatures(s, o));
  for (const phi of vectors) { assert.ok(phi.length <= 16); assert.ok(Math.abs(phi.reduce((sum, [, v]) => sum + v * v, 0) - 1) < 1e-12); }
  assert.equal(new Set(vectors.map(v => JSON.stringify(v))).size, 4);
  // Four sensor corners can receive independently signed values; the original
  // raw-feature linear action boundary cannot implement this XOR fixture.
  const dense = vectors.map(phi => { const row = Array(256).fill(0); for (const [i, v] of phi) row[i] = v; return row; });
  const signs = [1, -1, -1, 1], weights = Array(256).fill(0);
  for (let iteration = 0; iteration < 50; iteration++) for (let i = 0; i < 4; i++) {
    const value = dense[i].reduce((sum, v, j) => sum + v * weights[j], 0);
    if (value * signs[i] <= 0) dense[i].forEach((v, j) => { weights[j] += signs[i] * v; });
  }
  assert.ok(dense.every((row, i) => signs[i] * row.reduce((sum, v, j) => sum + v * weights[j], 0) > 0));
  const unchanged = tileFeatures(s, observations[0]);
  const other = [...observations[0]]; other[5] = .8; other[14] = 1; other[15] = -1;
  assert.deepEqual(tileFeatures(s, other), unchanged, 'Age/clock are not phase inputs');
});

test('sparse factual transitions preserve traces, memory pressure, replay and terminal zero bootstrap', () => {
  const s = createTileBody(1, 41), phi = [[3, 1]], nextPhi = [[5, 1]];
  learnTileTransition(s, {agentId: 1, tick: 1, duration: 8, phi, nextPhi, action: -1, reward: .1, terminal: false}, {replay: false});
  learnTileTransition(s, {agentId: 1, tick: 9, duration: 1, phi: nextPhi, nextPhi: [], action: 1, reward: .2, terminal: true}, {replay: false});
  assert.ok(Math.abs(s.weights[0][3] - (.005 + .05 * .2 * Math.exp(-1 / 256) * .9)) < 1e-12);
  assert.ok(s.eligibility.flat().every(v => v === 0));
  for (let i = 2; i < 200; i++) learnTileTransition(s, {agentId: 1, tick: i * 8 + 1, duration: 8, phi, nextPhi, action: i % 2 ? 1 : -1, reward: .001, terminal: false});
  assert.equal(s.recent.length, 16); assert.equal(s.older.length, 48); assert.equal(s.olderSeen, 184);
  assert.deepEqual(restoreTileBody(JSON.parse(JSON.stringify(s))), s);
  assert.throws(() => learnTileTransition(s, {agentId: 2, tick: 1601, duration: 8, phi, nextPhi, action: -1, reward: 0, terminal: false}));
});

test('tile experiments resume jointly and compare earlier/current/reset skills on common frozen bodies', () => {
  const run = new SarsaExperiment({...config, learnerProgram: 'tile-sarsa-v1'}); run.advance(700);
  const copy = SarsaExperiment.restore(run.checkpoint()); run.advance(1092); copy.advance(1092);
  assert.deepEqual(run.checkpoint(), copy.checkpoint());
  const before = run.checkpoint();
  const early = runSarsaProbe(run.atC, {family: 'A', version: 'A'}, 10001, 4);
  const current = runSarsaProbe(run.atC, {family: 'A', version: 'C'}, 10001, 4);
  assert.equal(early.startWorldSha256, current.startWorldSha256); assert.ok(current.learnedWeightsUnchanged);
  assert.deepEqual(run.checkpoint(), before);
  assert.ok(run.endpoint().incurredEnergy > 0 && Math.abs(run.endpoint().accountingResidual) < 1e-7);
});

test('default linear experiment remains exactly equal to its recorded original implementation', {skip: !existsSync(new URL('../evidence/sarsa-screen/20261024-fixed-expected-sarsa-v1/sources/learning/sarsa-experiment.mjs', import.meta.url))}, async () => {
  const archived = await import('../evidence/sarsa-screen/20261024-fixed-expected-sarsa-v1/sources/learning/sarsa-experiment.mjs');
  const original = new archived.SarsaExperiment(config), current = new SarsaExperiment(config);
  original.advance(1792); current.advance(1792);
  assert.deepEqual(current.checkpoint(), original.checkpoint());
});
