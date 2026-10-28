import assert from 'node:assert/strict';

export function createFactualHorizon(agentId,horizon){
  assert.ok(Number.isSafeInteger(agentId)&&agentId>0&&Number.isSafeInteger(horizon)&&horizon>0);
  return {agentId,horizon,pending:[],lastTick:null,dead:false};
}
export function observeFactualDecision(state,decision){
  assert.equal(decision.agentId,state.agentId);assert.ok(!state.dead&&Number.isSafeInteger(decision.tick)&&Number.isFinite(decision.energy));
  if(state.lastTick!==null)assert.equal(decision.tick,state.lastTick+1);
  const ready=[];
  while(state.pending.length&&decision.tick-state.pending[0].tick>=state.horizon){
    const earlier=state.pending.shift();assert.equal(decision.tick-earlier.tick,state.horizon);
    ready.push({prior:earlier,target:(decision.energy-earlier.energy)/120,terminal:false});
  }
  state.pending.push(structuredClone(decision));state.lastTick=decision.tick;return ready;
}
export function terminateFactualHorizon(state,own){
  assert.equal(own.agentId,state.agentId);assert.ok(!state.dead&&own.tick===state.lastTick&&Number.isFinite(own.energy));
  const ready=state.pending.map(prior=>({prior,target:(own.energy-prior.energy)/120,terminal:true}));
  state.pending=[];state.dead=true;return ready;
}
export function censorFactualHorizon(state){const count=state.pending.length;state.pending=[];return count;}
