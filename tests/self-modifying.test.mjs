import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_PROGRAM, EDITS, compileProgram, validateProgram, createProgramLearner, predictProgram, updateProgram, restoreProgramLearner, createModifier, proposeProgram, creditProposal, promoteProgram, restoreModifier} from '../learning/self-modifying.mjs';
import {outcomeExample, pairedSignFlip, scoreProgram, comparePrograms} from '../learning/self-modifying-tasks.mjs';

test('the initial expression reproduces normalized gradient updates and protected execution stays finite', () => {
  const state = createProgramLearner(2), input = [1, .5];
  updateProgram(state, input, .75);
  assert.deepEqual(state.weights, [.2 * .75 / 1.25, .2 * .75 * .5 / 1.25]);
  assert.equal(compileProgram(['div', 4, 0])({}), .5);
  assert.throws(() => validateProgram(['fetch', 'gradient']), /instruction/);
  assert.throws(() => validateProgram(['mul', NaN, 'gradient']), /constant/);
  let deep = 'gradient'; for (let i = 0; i < 12; i++) deep = ['sqrt', deep];
  assert.throws(() => validateProgram(deep), /bounds/);
});

test('acquired weights learn an unknown association; checkpoint continuation and reset differ', () => {
  const state = createProgramLearner(2);
  for (let i = 0; i < 40; i++) updateProgram(state, [1, i % 2 ? 1 : -1], i % 2 ? -.6 : .6);
  assert.ok(predictProgram(state, [1, 1]) < -.55);
  assert.equal(predictProgram(createProgramLearner(2), [1, 1]), 0);
  const restored = restoreProgramLearner(JSON.parse(JSON.stringify(state)));
  for (let i = 0; i < 20; i++) { updateProgram(state, [1, -1], .6); updateProgram(restored, [1, -1], .6); }
  assert.deepEqual(restored, state);
  const bad = structuredClone(state); bad.secondMoment[0] = -1;
  assert.throws(() => restoreProgramLearner(bad), /secondMoment/);
});

test('promotion replaces the proposer learning rule only in the self-applying arm', () => {
  const next = ['mul', .5, INITIAL_PROGRAM];
  for (const selfApply of [true, false]) {
    const modifier = createModifier(17, {selfApply});
    const proposal = proposeProgram(modifier); creditProposal(modifier, proposal, .1);
    promoteProgram(modifier, next, 'fresh-bank-0');
    assert.deepEqual(modifier.preferences.program, selfApply ? next : INITIAL_PROGRAM);
    const restored = restoreModifier(JSON.parse(JSON.stringify(modifier)));
    for (let i = 0; i < 16; i++) {
      const a = proposeProgram(modifier), b = proposeProgram(restored);
      assert.deepEqual(a, b); assert.ok(EDITS.includes(a.edit));
      creditProposal(modifier, a, .02); creditProposal(restored, b, .02);
    }
    assert.deepEqual(restored, modifier);
    const corrupted = structuredClone(modifier); corrupted.preferences.program = 'gradient';
    assert.throws(() => restoreModifier(corrupted), /identity/);
    const alteredLineage = structuredClone(modifier); alteredLineage.promotions[0].before = 'weight';
    assert.throws(() => restoreModifier(alteredLineage), /lineage/);
  }
});

test('retention evaluation is read-only and uses matched seed units', () => {
  const worlds = [];
  for (const seed of [31, 32]) for (const environment of ['fixed', 'relocation']) {
    const windows = [];
    for (const agentId of [1, 2]) for (let i = 0; i < 32; i++) {
      const observation = Array(17).fill(0); observation[1] = i % 2 ? 1 : -1;
      windows.push({agentId, tick: i * 8 + 1, choice: i % 2 ? 1 : -1, observation, rewards: Array(8).fill((i % 2 ? -.5 : .5) * (seed % 2 ? 1 : -1))});
    }
    worlds.push({seed, environment, windows});
  }
  const before = JSON.stringify(worlds), a = scoreProgram(INITIAL_PROGRAM, worlds, {splitTick: 128});
  assert.equal(JSON.stringify(worlds), before);
  assert.ok(a.rows.every(row => row.aAfter < row.aReset && row.bAfter < row.bReset));
  assert.equal(comparePrograms(a, structuredClone(a), .05).passed, false);
  assert.throws(() => comparePrograms(a, {...a, rows: [...a.rows].reverse()}, .05), /Unmatched/);
  assert.equal(outcomeExample(worlds[0].windows[0]).input.length, 20);
  assert.equal(pairedSignFlip([1, 1, 1, 1]).pOneSided, 1 / 16);
  assert.equal(pairedSignFlip([0, 0]).pOneSided, 1);
});
