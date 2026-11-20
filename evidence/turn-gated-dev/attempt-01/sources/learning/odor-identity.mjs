export const ODOR_IDENTITY_SCALAR_OPERATIONS = Object.freeze({odor: 21, neutral: 6});

export function odorIdentityCode(signs) {
  if (!Array.isArray(signs) || signs.length !== 4) throw new TypeError('Expected four odor signs');
  if (Array.from(signs).every(sign => sign === 0)) return Array(16).fill(0);
  if (!Array.from(signs).every(sign => sign === -1 || sign === 1)) {
    throw new TypeError('Expected four binary signs or the all-zero neutral cue');
  }
  const features = Array(16).fill(0);
  features[0] = 1 / 4;
  for (let index = 0; index < 4; index++) {
    const offset = 1 << index;
    for (let subset = 0; subset < offset; subset++) features[offset + subset] = features[subset] * signs[index];
  }
  return features;
}

export function odorIdentityFeatures(state, observation) {
  if (!Array.isArray(observation) || observation.length !== 17 || !Array.from(observation).every(Number.isFinite)) {
    throw new TypeError('Expected a finite 17-coordinate cueObservation array');
  }
  const neutral = observation[0] === 0 && [1,2,3].every(index => observation[index] === .5);
  if (!neutral && !((observation[0] === -1 || observation[0] === 1) &&
      [1,2,3].every(index => observation[index] === 0 || observation[index] === 1))) {
    throw new TypeError('Expected an exact binary or neutral cueObservation encoding');
  }
  const signs = [observation[0], 2 * observation[1] - 1, 2 * observation[2] - 1, 2 * observation[3] - 1];
  const features = odorIdentityCode(signs);
  const operations = ODOR_IDENTITY_SCALAR_OPERATIONS[signs[0] === 0 ? 'neutral' : 'odor'];
  if (!Number.isSafeInteger(state?.work?.scalarOperations) || state.work.scalarOperations < 0 ||
      !Number.isSafeInteger(state.work.scalarOperations + operations)) {
    throw new TypeError('Expected a nonnegative safe scalarOperations counter with room for the charge');
  }
  state.work.scalarOperations += operations;
  return features;
}
