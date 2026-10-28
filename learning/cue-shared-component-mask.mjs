import assert from 'node:assert/strict';

export function applyCueSharedComponentMask(state,mode){
  assert.ok(['full','shared-only','residual-only','native'].includes(mode));
  assert.ok(!state.dead&&state.steering&&!state.steering.dead&&!state.steering.acquisition&&state.steering.pending===null);
  assert.equal(state.steering.contextWeights.length,17);
  const target=mode==='shared-only'?state.steering.contextWeights[0]:state.steering.weights;
  for(const row of target)for(let index=0;index<row.length;index++)row[index]=mode==='shared-only'||mode==='residual-only'?0:row[index];
  state.work.scalarOperations+=16;state.charge.storageBytes=0;
}
