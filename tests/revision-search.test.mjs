import test from 'node:test';
import assert from 'node:assert/strict';
import {createKernelLearner, updateKernel, restoreKernelLearner, KERNEL_PROGRAM_NAMES} from '../learning/kernel-learner.mjs';
import {SEARCH_PROGRAMS, SEARCH_INCUMBENT, createRevisionSession, stepRevisionSearch, restoreRevisionSession, proposalFeatures, programId} from '../learning/revision-search.mjs';

test('composed kernels retain positive inverse consistency through bounded memory eviction', () => {
  for (const kernel of KERNEL_PROGRAM_NAMES) {
    const state = createKernelLearner(2, {kernel, update: 'ridge'}, 16);
    for (let i = 0; i < 24; i++) updateKernel(state, [Math.sin(i), Math.cos(i)], Math.sin(i) * Math.cos(i) * .5);
    assert.deepEqual(restoreKernelLearner(JSON.parse(JSON.stringify(state))), state);
  }
});

function setup() {
  const context = [1, -.2, .3, .4, .5, .1, 0, 0], learner = createKernelLearner(16);
  for (const [i, program] of SEARCH_PROGRAMS.entries()) updateKernel(learner, proposalFeatures(context, program), Math.sin(i) * .3);
  const baseline = {program: SEARCH_INCUMBENT, rows: [], a: 1, b: 1, aBefore: 1.2, resetA: 2, resetB: 2};
  const validation = program => ({program, rows: [], a: .8, b: .7, aBefore: 1.2, resetA: 2, resetB: 2});
  return {context, learner, baseline, validation};
}

test('proposal model controls budgeted evaluations; all arms continue exactly from a checkpoint', () => {
  const {context, learner, baseline, validation} = setup();
  for (const arm of ['self', 'fixed', 'reset', 'random', 'static']) {
    const session = createRevisionSession(learner, arm, context, baseline, 1783);
    let calls = 0; const evaluate = program => { calls++; return validation(program); };
    stepRevisionSearch(session, evaluate);
    const restored = restoreRevisionSession(JSON.parse(JSON.stringify(session)));
    while (session.queries.length < session.budget) { stepRevisionSearch(session, evaluate); stepRevisionSearch(restored, validation); }
    assert.equal(calls, session.budget); assert.deepEqual(restored, session);
    assert.equal(new Set(session.queries.map(q => programId(q.program))).size, session.budget);
    assert.ok(session.queries.some(q => programId(q.program) === programId(session.selected)));
    assert.throws(() => stepRevisionSearch(session, evaluate), /budget exhausted/);
    const bad = structuredClone(session); bad.learner.program.update = 'ridge';
    assert.throws(() => restoreRevisionSession(bad), /identity/);
  }
});

test('final-score fields are rejected at the proposal feedback boundary', () => {
  const {context, learner, baseline, validation} = setup(), session = createRevisionSession(learner, 'self', context, baseline, 61);
  assert.throws(() => stepRevisionSearch(session, program => ({...validation(program), finalScore: 0})), /validation response/);
  assert.equal(session.queries.length, 0);
  assert.equal(session.learner.seen, learner.seen);
});
