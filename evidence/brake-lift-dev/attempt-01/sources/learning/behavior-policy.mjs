// Read-only reconstruction of the binary epsilon-greedy sampler. Reported
// probabilities are nominal algorithm probabilities, not a causal guarantee
// conditional on the complete deterministic pseudorandom-generator state.
const uint32 = x => Number.isInteger(x) && x > 0 && x <= 0xffffffff;
function advance(value) { let x = value; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return x >>> 0; }

export function nominalBinaryPolicy(decision, exploration) {
  if (!Number.isFinite(exploration) || exploration < 0 || exploration > 1 || ![-1, 1].includes(decision?.choice) || !['exploration', 'tie', 'retrieval'].includes(decision.reason)) throw Error('Invalid binary policy observation');
  const negative = decision.retrieval?.negative, positive = decision.retrieval?.positive;
  const a = negative?.score ?? negative?.estimate, b = positive?.score ?? positive?.estimate;
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw Error('Missing decision-time policy scores');
  const greedyPositive = b === a ? .5 : +(b > a), fast = exploration / 2 + (1 - exploration) * greedyPositive, slow = 1 - fast;
  if (decision.reason === 'tie' && b !== a || decision.reason === 'retrieval' && (b === a || decision.choice !== (b > a ? 1 : -1)) || decision.reason === 'exploration' && exploration === 0 || decision.reason === 'retrieval' && exploration === 1) throw Error('Inconsistent decision-time policy reason');
  const chosenProbability = decision.choice > 0 ? fast : slow;
  if (!(chosenProbability > 0)) throw Error('Observed zero-probability choice');
  return {schema: 1, kind: 'nominal-binary-epsilon-greedy', exploration, slow, fast, chosenProbability, greedyPositive, randomized: decision.reason === 'exploration' || decision.reason === 'tie', explicitExploration: decision.reason === 'exploration', reason: decision.reason};
}

export function verifyBinaryPolicyDraws(beforeRng, afterRng, decision, exploration) {
  if (!uint32(beforeRng) || !uint32(afterRng)) throw Error('Invalid binary policy RNG state');
  const policy = nominalBinaryPolicy(decision, exploration), first = advance(beforeRng), second = advance(first), explorationDraw = first / 4294967296, choiceDraw = second / 4294967296;
  const reason = explorationDraw < exploration ? 'exploration' : policy.greedyPositive === .5 ? 'tie' : 'retrieval';
  const choice = reason === 'retrieval' ? (policy.greedyPositive > .5 ? 1 : -1) : choiceDraw < .5 ? -1 : 1;
  if (afterRng !== second || reason !== decision.reason || choice !== decision.choice) throw Error('Binary policy draw replay mismatch');
  return {policy, beforeRng, afterRng, explorationDraw, choiceDraw, exactDrawReplay: true};
}
