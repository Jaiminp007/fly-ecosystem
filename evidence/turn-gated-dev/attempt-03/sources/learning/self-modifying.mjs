// Offline, bounded program synthesis. World does not import this module.
// The same executable update expression learns outcome forecasts AND the
// modifier's edit preferences. A promotion replaces that expression in both.
// This is self-application inside a fixed grammar/evaluator, not general RSI.
const INPUTS = new Set(['gradient', 'momentum', 'rms', 'norm', 'visits', 'weight']);
const BINARY = new Set(['add', 'sub', 'mul', 'div']);
const UNARY = new Set(['sign', 'sqrt', 'abs']);
const clip = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const EDITS = Object.freeze(['halve', 'double', 'normalize', 'rms', 'momentum', 'decay', 'sign', 'anneal']);
export const INITIAL_PROGRAM = Object.freeze(['div', ['mul', .2, 'gradient'], 'norm']);

export function validateProgram(program) {
  let count = 0;
  function visit(node, depth) {
    if (++count > 63 || depth > 9) throw Error('Update program exceeds bounds');
    if (typeof node === 'number') {
      if (!Number.isFinite(node) || Math.abs(node) > 4) throw Error('Invalid update constant');
      return;
    }
    if (typeof node === 'string' && INPUTS.has(node)) return;
    if (!Array.isArray(node) || !(BINARY.has(node[0]) && node.length === 3 || UNARY.has(node[0]) && node.length === 2)) throw Error('Invalid update instruction');
    for (const child of node.slice(1)) visit(child, depth + 1);
  }
  visit(program, 0);
  return count;
}

export function compileProgram(program) {
  validateProgram(program);
  function compile(node) {
    if (typeof node === 'number') return () => node;
    if (typeof node === 'string') return registers => registers[node];
    const a = compile(node[1]), b = node.length === 3 ? compile(node[2]) : null;
    return registers => {
      const x = a(registers), y = b?.(registers);
      const value = node[0] === 'add' ? x + y : node[0] === 'sub' ? x - y : node[0] === 'mul' ? x * y : node[0] === 'div' ? x / Math.max(.01, Math.abs(y)) : node[0] === 'sign' ? Math.sign(x) : node[0] === 'sqrt' ? Math.sqrt(Math.abs(x)) : Math.abs(x);
      return clip(value, -100, 100);
    };
  }
  const fn = compile(program);
  return registers => clip(fn(registers), -.5, .5);
}

export function createProgramLearner(dimensions, program = INITIAL_PROGRAM) {
  if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > 128) throw Error('Invalid learner dimensions');
  validateProgram(program);
  return {schema: 1, kind: 'bounded-update-program', program: structuredClone(program), steps: 0, weights: Array(dimensions).fill(0), momentum: Array(dimensions).fill(0), secondMoment: Array(dimensions).fill(0)};
}

function vector(state, input) {
  if (!Array.isArray(input) || input.length !== state.weights.length || input.some(x => !Number.isFinite(x) || Math.abs(x) > 1)) throw Error('Invalid program learner input');
}

export function predictProgram(state, input) {
  vector(state, input);
  return clip(state.weights.reduce((sum, w, i) => sum + w * input[i], 0), -1, 1);
}

export function updateProgram(state, input, target, compiled = compileProgram(state.program)) {
  if (!Number.isFinite(target) || Math.abs(target) > 1) throw Error('Invalid program learner target');
  const prediction = predictProgram(state, input), error = target - prediction;
  const norm = Math.max(1, input.reduce((sum, x) => sum + x * x, 0));
  for (let i = 0; i < input.length; i++) {
    const gradient = error * input[i];
    state.momentum[i] = .9 * state.momentum[i] + .1 * gradient;
    state.secondMoment[i] = .99 * state.secondMoment[i] + .01 * gradient * gradient;
    const delta = compiled({gradient, momentum: state.momentum[i], rms: Math.sqrt(state.secondMoment[i]) + .01, norm, visits: Math.sqrt(state.steps + 1), weight: state.weights[i]});
    state.weights[i] = clip(state.weights[i] + delta, -4, 4);
  }
  state.steps++;
  return {prediction, squaredError: error * error};
}

export function restoreProgramLearner(value) {
  if (value?.schema !== 1 || value.kind !== 'bounded-update-program' || !Number.isSafeInteger(value.steps) || value.steps < 0) throw Error('Invalid program learner state');
  validateProgram(value.program);
  if (!Array.isArray(value.weights) || value.weights.length < 1 || value.weights.length > 128) throw Error('Invalid program learner weights');
  for (const [key, bound] of [['weights', 4], ['momentum', 2], ['secondMoment', 4]]) {
    if (!Array.isArray(value[key]) || value[key].length !== value.weights.length || value[key].some(x => !Number.isFinite(x) || Math.abs(x) > bound || key === 'secondMoment' && x < 0)) throw Error('Invalid program learner ' + key);
  }
  return structuredClone(value);
}

function next(state) {
  let x = state.rngState;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rngState = x >>> 0;
  return state.rngState / 4294967296;
}

export function createModifier(seed, {selfApply = true} = {}) {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff || typeof selfApply !== 'boolean') throw Error('Invalid modifier configuration');
  return {schema: 1, kind: 'self-applicable-program-modifier', selfApply, rngState: seed, program: structuredClone(INITIAL_PROGRAM), preferences: createProgramLearner(EDITS.length), proposals: 0, promotions: []};
}

// Edit a randomly selected subtree. Every edit is generated by this fixed
// interpreter; labels and evaluation files cannot be read by an expression.
export function mutateProgram(program, edit, draw) {
  validateProgram(program);
  if (!EDITS.includes(edit) || !Number.isFinite(draw) || draw < 0 || draw >= 1) throw Error('Invalid program edit');
  const copy = structuredClone(program), paths = [];
  function collect(node, path) { paths.push(path); if (Array.isArray(node)) node.slice(1).forEach((child, i) => collect(child, [...path, i + 1])); }
  collect(copy, []);
  const path = paths[Math.floor(draw * paths.length)];
  let parent = null, node = copy;
  for (const i of path) { parent = node; node = node[i]; }
  const replacement = edit === 'halve' ? ['mul', .5, node] : edit === 'double' ? ['mul', 2, node] : edit === 'normalize' ? ['div', node, 'norm'] : edit === 'rms' ? ['div', node, 'rms'] : edit === 'momentum' ? ['add', node, ['mul', .1, 'momentum']] : edit === 'decay' ? ['sub', node, ['mul', .001, 'weight']] : edit === 'sign' ? ['sign', node] : ['div', node, 'visits'];
  const result = path.length ? (parent[path.at(-1)] = replacement, copy) : replacement;
  try { validateProgram(result); } catch { return structuredClone(program); }
  return result;
}

export function proposeProgram(modifier, incumbent = modifier.program) {
  const estimates = EDITS.map((_, i) => predictProgram(modifier.preferences, EDITS.map((_, j) => +(i === j))));
  const explore = next(modifier) < .4;
  // Probability matching with bounded logits; every structural edit keeps
  // support even after earlier failures. A fixed-program arm uses the same.
  const masses = estimates.map(x => Math.exp(clip(x * 8, -8, 8))), total = masses.reduce((a, b) => a + b, 0);
  let draw = next(modifier), index = 0;
  if (explore) index = Math.floor(draw * EDITS.length);
  else { draw *= total; while (index < EDITS.length - 1 && (draw -= masses[index]) >= 0) index++; }
  const edit = EDITS[index], program = mutateProgram(incumbent, edit, next(modifier));
  modifier.proposals++;
  return {ordinal: modifier.proposals, edit, program, parent: structuredClone(incumbent), preferenceProgram: structuredClone(modifier.preferences.program), estimates, explore};
}

export function creditProposal(modifier, proposal, observedImprovement) {
  if (!Number.isFinite(observedImprovement) || !EDITS.includes(proposal.edit)) throw Error('Invalid proposal outcome');
  const input = EDITS.map(edit => +(edit === proposal.edit));
  // Only development improvement is supplied, never acceptance/final labels.
  return updateProgram(modifier.preferences, input, clip(observedImprovement, -1, 1));
}

export function promoteProgram(modifier, program, evidenceId) {
  validateProgram(program);
  if (typeof evidenceId !== 'string' || !evidenceId || JSON.stringify(program) === JSON.stringify(modifier.program)) throw Error('Invalid program promotion');
  const before = structuredClone(modifier.program);
  modifier.program = structuredClone(program);
  if (modifier.selfApply) modifier.preferences.program = structuredClone(program);
  modifier.promotions.push({before, after: structuredClone(program), evidenceId, preferencesSelfApplied: modifier.selfApply, proposalOrdinal: modifier.proposals});
}

export function restoreModifier(value) {
  if (value?.schema !== 1 || value.kind !== 'self-applicable-program-modifier' || typeof value.selfApply !== 'boolean' || !Number.isInteger(value.rngState) || value.rngState < 1 || value.rngState > 0xffffffff || !Number.isSafeInteger(value.proposals) || value.proposals < 0 || !Array.isArray(value.promotions)) throw Error('Invalid modifier checkpoint');
  validateProgram(value.program);
  const preferences = restoreProgramLearner(value.preferences);
  if (preferences.weights.length !== EDITS.length || preferences.steps !== value.proposals || JSON.stringify(preferences.program) !== JSON.stringify(value.selfApply ? value.program : INITIAL_PROGRAM)) throw Error('Modifier program identity mismatch');
  let previous = INITIAL_PROGRAM;
  for (const p of value.promotions) {
    validateProgram(p.after);
    if (JSON.stringify(p.before) !== JSON.stringify(previous) || p.preferencesSelfApplied !== value.selfApply || !Number.isSafeInteger(p.proposalOrdinal) || p.proposalOrdinal < 1 || p.proposalOrdinal > value.proposals || typeof p.evidenceId !== 'string' || !p.evidenceId) throw Error('Invalid modifier lineage');
    previous = p.after;
  }
  if (JSON.stringify(previous) !== JSON.stringify(value.program)) throw Error('Invalid final modifier program');
  return structuredClone(value);
}
