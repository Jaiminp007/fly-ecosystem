// Bounded online learner with executable algorithm choices. No World import.
// Migration replays only the learner's own retained factual experiences.
const clip = x => Math.max(-1, Math.min(1, x));
export const INITIAL_KERNEL_PROGRAM = Object.freeze({kernel: 'linear', update: 'gradient'});
export const KERNEL_PROGRAM_NAMES = Object.freeze(['linear', 'rbf', 'laplacian', 'quadratic', 'sum', 'product']);
export function validateKernelProgram(program) {
  if (!program || Object.keys(program).sort().join(',') !== 'kernel,update' || !KERNEL_PROGRAM_NAMES.includes(program.kernel) || !['gradient', 'ridge'].includes(program.update)) throw Error('Invalid kernel learner program');
}
function inputs(state, x) {
  if (!Array.isArray(x) || x.length !== state.dimensions || x.some(v => !Number.isFinite(v) || Math.abs(v) > 1)) throw Error('Invalid kernel learner inputs');
}
export function kernelValue(program, x, y) {
  // Preserve the two previously evaluated kernels exactly. New alternatives
  // are fixed positive-semidefinite compositions, not fitted answer tables.
  if (program.kernel === 'linear') return x.reduce((sum, v, i) => sum + v * y[i], 0);
  if (program.kernel === 'rbf') return Math.exp(-x.reduce((sum, v, i) => sum + (v - y[i]) ** 2, 0));
  if (program.kernel === 'laplacian') return Math.exp(-x.reduce((sum, v, i) => sum + Math.abs(v - y[i]), 0));
  const dot = x.reduce((sum, v, i) => sum + v * y[i], 0) / x.length;
  if (program.kernel === 'quadratic') return ((1 + dot) / 2) ** 2;
  const rbf = Math.exp(-x.reduce((sum, v, i) => sum + (v - y[i]) ** 2, 0));
  return program.kernel === 'sum' ? (rbf + dot) / 2 : rbf * (1 + dot) / 2;
}
export function createKernelLearner(dimensions, program = INITIAL_KERNEL_PROGRAM, capacity = 256) {
  validateKernelProgram(program);
  if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > 128 || !Number.isInteger(capacity) || capacity < 16 || capacity > 256) throw Error('Invalid kernel learner bounds');
  return {schema: 1, kind: 'bounded-kernel-algorithm', dimensions, capacity, program: structuredClone(program), regularization: .1, stepSize: .2, seen: 0, records: [], coefficients: [], inverse: [], work: {kernelCoordinateProducts: 0, matrixProducts: 0, updates: 0}};
}
function kernel(state, x, y) { state.work.kernelCoordinateProducts += state.dimensions; return kernelValue(state.program, x, y); }
function predictRaw(state, x, charge) {
  inputs(state, x);
  return state.records.reduce((sum, record, i) => sum + state.coefficients[i] * (charge ? kernel(state, record.input, x) : kernelValue(state.program, record.input, x)), 0);
}
export function predictKernel(state, x) { return clip(predictRaw(state, x, false)); }

export function updateKernel(state, x, target) {
  inputs(state, x);
  if (!Number.isFinite(target) || Math.abs(target) > 1) throw Error('Invalid kernel learner target');
  const predicted = clip(predictRaw(state, x, true));
  if (state.records.length === state.capacity) {
    state.records.shift(); state.coefficients.shift();
    if (state.program.update === 'ridge') {
      const old = state.inverse, pivot = old[0][0];
      if (!(pivot > 0)) throw Error('Invalid inverse downdate pivot');
      state.inverse = old.slice(1).map((row, i) => row.slice(1).map((value, j) => value - old[i + 1][0] * old[0][j + 1] / pivot));
      state.work.matrixProducts += state.inverse.length ** 2;
    }
  }
  const n = state.records.length;
  if (state.program.update === 'ridge') {
    const k = state.records.map(record => kernel(state, record.input, x));
    const v = state.inverse.map(row => row.reduce((sum, value, j) => sum + value * k[j], 0));
    const denominator = kernel(state, x, x) + state.regularization - k.reduce((sum, value, j) => sum + value * v[j], 0);
    if (!Number.isFinite(denominator) || denominator < 1e-9) throw Error('Unstable kernel inverse update');
    state.inverse = state.inverse.map((row, i) => [...row.map((value, j) => value + v[i] * v[j] / denominator), v[i] === 0 ? 0 : -v[i] / denominator]);
    state.inverse.push([...v.map(value => value === 0 ? 0 : -value / denominator), 1 / denominator]);
    state.records.push({input: x.map(v => v === 0 ? 0 : v), target: target === 0 ? 0 : target, experience: state.seen + 1});
    state.coefficients = state.inverse.map(row => row.reduce((sum, value, j) => sum + value * state.records[j].target, 0));
    state.work.matrixProducts += 2 * n * n + (n + 1) ** 2;
  } else {
    const coefficient = state.stepSize * (target - predicted) / Math.max(1, kernel(state, x, x));
    state.records.push({input: x.map(v => v === 0 ? 0 : v), target: target === 0 ? 0 : target, experience: state.seen + 1}); state.coefficients.push(coefficient === 0 ? 0 : coefficient);
  }
  state.seen++; state.work.updates++;
  if (state.coefficients.some(v => !Number.isFinite(v))) throw Error('Nonfinite kernel coefficient');
  return {prediction: predicted, squaredError: (target - predicted) ** 2};
}

export function migrateKernel(state, program) {
  validateKernelProgram(program);
  const migrated = createKernelLearner(state.dimensions, program, state.capacity);
  for (const record of state.records) updateKernel(migrated, record.input, record.target);
  // The migration preserves observed experience IDs and lifetime counts, but
  // optimizer state is reconstructed from retained facts under the new rule.
  migrated.records.forEach((record, i) => { record.experience = state.records[i].experience; });
  migrated.seen = state.seen;
  return migrated;
}

export function restoreKernelLearner(value) {
  if (value?.schema !== 1 || value.kind !== 'bounded-kernel-algorithm' || !Number.isSafeInteger(value.seen) || value.seen < 0) throw Error('Invalid kernel checkpoint');
  const expected = createKernelLearner(value.dimensions, value.program, value.capacity);
  if (value.regularization !== expected.regularization || value.stepSize !== expected.stepSize || !Array.isArray(value.records) || value.records.length !== Math.min(value.seen, value.capacity)) throw Error('Invalid kernel configuration/state identity');
  for (const [i, record] of value.records.entries()) {
    inputs(value, record.input);
    if (!Number.isFinite(record.target) || Math.abs(record.target) > 1 || record.experience !== value.seen - value.records.length + i + 1) throw Error('Invalid kernel factual record');
  }
  const n = value.records.length;
  if (!Array.isArray(value.coefficients) || value.coefficients.length !== n || value.coefficients.some(v => !Number.isFinite(v) || Math.abs(v) > n / value.regularization + 1)) throw Error('Invalid kernel coefficients');
  if (!Array.isArray(value.inverse) || value.inverse.length !== (value.program.update === 'ridge' ? n : 0)) throw Error('Kernel optimizer identity mismatch');
  for (const [i, row] of value.inverse.entries()) {
    if (!Array.isArray(row) || row.length !== n || row.some((v, j) => !Number.isFinite(v) || Math.abs(v) > 1 / value.regularization + 1e-5 || Math.abs(v - value.inverse[j]?.[i]) > 1e-6) || row[i] <= 0) throw Error('Invalid kernel inverse');
    const expectedCoefficient = row.reduce((sum, v, j) => sum + v * value.records[j].target, 0);
    if (Math.abs(expectedCoefficient - value.coefficients[i]) > 1e-6) throw Error('Inconsistent kernel target coefficients');
  }
  if (value.program.update === 'ridge') {
    const gram = value.records.map((a, i) => value.records.map((b, j) => kernelValue(value.program, a.input, b.input) + (i === j ? value.regularization : 0)));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      let product = 0; for (let k = 0; k < n; k++) product += value.inverse[i][k] * gram[k][j];
      if (Math.abs(product - +(i === j)) > 1e-5) throw Error('Kernel inverse does not match retained experience');
    }
  }
  if (!value.work || Object.keys(value.work).sort().join(',') !== 'kernelCoordinateProducts,matrixProducts,updates' || Object.values(value.work).some(v => !Number.isSafeInteger(v) || v < 0)) throw Error('Invalid kernel work counters');
  return structuredClone(value);
}
