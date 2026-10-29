import assert from 'node:assert/strict';

const validCue = cue => Array.isArray(cue) && cue.length === 4 &&
  (Array.from(cue).every(v => v === 0) || Array.from(cue).every(v => v === -1 || v === 1));

// An isolated, metered credit adapter. It neither queries the world nor learns
// hidden valence; a future wrapper must supply lawful, physically billed sensors.
export function createStationaryTasteCredit(agentId, {maskedCue=false}={}) {
  assert.ok(Number.isSafeInteger(agentId) && agentId > 0);
  assert.equal(typeof maskedCue,'boolean');
  return {schema:2, agentId, maskedCue, tick:0, pending:null, dead:false, scalarOperations:0};
}

export function beginStationaryTasteAction(state, {agentId, tick, action, cue, contactPresent}) {
  assert.equal(agentId, state.agentId);
  assert.ok(!state.dead && state.pending === null);
  assert.equal(tick, state.tick + 1);
  assert.ok(Number.isInteger(action) && action >= 0 && action < 4);
  assert.ok(validCue(cue) && typeof contactPresent === 'boolean');
  assert.ok(!contactPresent || state.maskedCue || cue.every(v => v === -1 || v === 1));
  assert.ok(!state.maskedCue || cue.every(v=>v===0));
  state.pending = {tick, action, cue:[...cue], contactPresent};
}

export function finishStationaryTasteAction(state, {agentId, tick, lastFood, terminal}) {
  assert.equal(agentId, state.agentId);
  assert.ok(!state.dead && state.pending !== null);
  assert.equal(tick, state.pending.tick);
  assert.ok(Number.isFinite(lastFood) && lastFood >= -1 && lastFood <= 1);
  assert.equal(typeof terminal, 'boolean');
  const pending = state.pending;
  // Charge the action and both outcome comparisons on every completion, including
  // controls, absent contacts, neutral sensations and final terminal work.
  const stationaryAccept = pending.action === 2, positive = lastFood > 0, negative = lastFood < 0;
  assert.ok(Number.isSafeInteger(state.scalarOperations) && state.scalarOperations >= 0 && Number.isSafeInteger(state.scalarOperations+3));
  state.scalarOperations += 3;
  const example = stationaryAccept && pending.contactPresent && (positive || negative)
    ? {agentId, tick, cue:[...pending.cue], signedIntake:lastFood, outcomeSign:positive ? 1 : -1, terminal}
    : null;
  state.tick = tick;
  state.pending = null;
  state.dead = terminal;
  return example;
}
