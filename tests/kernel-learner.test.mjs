import test from 'node:test';
import assert from 'node:assert/strict';
import {createKernelLearner, updateKernel, predictKernel, restoreKernelLearner, migrateKernel} from '../learning/kernel-learner.mjs';
import {createProgramLearner, updateProgram, predictProgram} from '../learning/self-modifying.mjs';

test('dual linear-gradient updates reproduce the existing normalized learner before any memory eviction', () => {
  const a = createKernelLearner(3), b = createProgramLearner(3);
  for (let i = 0; i < 40; i++) {
    const x = [1, Math.sin(i), Math.cos(i)], y = .3 * x[1] - .2 * x[2];
    assert.ok(Math.abs(predictKernel(a, x) - predictProgram(b, x)) < 1e-12);
    updateKernel(a, x, y); updateProgram(b, x, y);
  }
});

test('ridge inverse updates match an analytic fit and survive FIFO inverse downdates', () => {
  const s = createKernelLearner(1, {kernel: 'linear', update: 'ridge'}, 16);
  let yy = 0, xx = 0;
  const rows = [];
  for (let i = 0; i < 28; i++) {
    const x = .2 + i / 40, y = .4 * x;
    rows.push({x, y}); if (rows.length > s.capacity) rows.shift();
    updateKernel(s, [x], y);
    yy = rows.reduce((sum, r) => sum + r.x * r.y, 0); xx = rows.reduce((sum, r) => sum + r.x * r.x, 0);
    assert.ok(Math.abs(predictKernel(s, [.5]) - .5 * yy / (.1 + xx)) < 1e-10);
  }
  const restored = restoreKernelLearner(JSON.parse(JSON.stringify(s)));
  updateKernel(s, [.4], -.3); updateKernel(restored, [.4], -.3);
  assert.deepEqual(restored, s);
  const bad = structuredClone(s); bad.inverse[0][0] += .01;
  bad.coefficients[0] = bad.inverse[0].reduce((sum, x, i) => sum + x * bad.records[i].target, 0);
  assert.throws(() => restoreKernelLearner(bad), /retained experience/);
});

test('nonlinear kernel learns an unknown context interaction; migration uses only retained own facts', () => {
  const old = createKernelLearner(2);
  for (let i = 0; i < 24; i++) { const x = [i % 2 ? .9 : -.9, i % 4 < 2 ? .9 : -.9]; updateKernel(old, x, x[0] * x[1]); }
  const before = JSON.stringify(old), next = migrateKernel(old, {kernel: 'rbf', update: 'ridge'});
  assert.equal(JSON.stringify(old), before); assert.equal(next.seen, old.seen);
  assert.deepEqual(next.records, old.records);
  for (const x of [[.9, .9], [-.9, -.9], [.9, -.9], [-.9, .9]]) assert.ok(Math.abs(predictKernel(next, x) - x[0] * x[1]) < .03);
  const checkpoint = restoreKernelLearner(JSON.parse(JSON.stringify(next)));
  updateKernel(next, [.8, -.8], -.6); updateKernel(checkpoint, [.8, -.8], -.6);
  assert.deepEqual(next, checkpoint);
  assert.throws(() => updateKernel(next, [NaN, 1], .1), /inputs/);
  const mislabeled = structuredClone(next); mislabeled.program.update = 'gradient';
  assert.throws(() => restoreKernelLearner(mislabeled), /identity/);
});

test('signed-zero sensory values have a canonical, exactly restorable JSON checkpoint', () => {
  for (const kernel of ['linear', 'rbf']) for (const update of ['gradient', 'ridge']) {
    const state = createKernelLearner(3, {kernel, update});
    updateKernel(state, [1, -0, 0], -0); updateKernel(state, [0, 1, -0], .2); updateKernel(state, [-1, 0, -0], .2);
    const restored = restoreKernelLearner(JSON.parse(JSON.stringify(state)));
    assert.deepEqual(restored, state);
    updateKernel(state, [1, 0, -0], .3); updateKernel(restored, [1, 0, -0], .3);
    assert.deepEqual(restored, state);
  }
});
