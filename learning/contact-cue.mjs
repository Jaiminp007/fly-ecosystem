// Prospective observation component only. No engine/platform or learner imports
// this module. It does not reveal amount, valence, patch ID or a future outcome.
import assert from 'node:assert/strict';
const cue=value=>Array.isArray(value) && value.length===4 &&
  (value.every(v=>v===0) || value.every(v=>v===1 || v===-1));

export function contactCue(fly,patches,fallbackCue,work) {
  assert.ok(Number.isFinite(fly.x) && Number.isFinite(fly.y) && Array.isArray(patches) && cue(fallbackCue));
  assert.ok(Number.isSafeInteger(work.scalarOperations) && work.scalarOperations>=0);
  let nearest=Infinity,selected=fallbackCue;
  for (const patch of patches) {
    assert.ok(Number.isFinite(patch.x) && Number.isFinite(patch.y) && cue(patch.cue));
    const dx=patch.x-fly.x,dy=patch.y-fly.y,squared=dx*dx+dy*dy;
    work.scalarOperations+=6; // two subtracts, two products, sum, radius comparison
    if (squared<=225) {
      work.scalarOperations++; // nearest-distance comparison; first wins ties
      if (squared<nearest) {nearest=squared;selected=patch.cue;}
    }
  }
  assert.ok(Number.isSafeInteger(work.scalarOperations));
  return [...selected];
}
