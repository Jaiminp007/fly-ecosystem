import assert from 'node:assert/strict';
import {billSarsaWork} from './sarsa-experiment.mjs';

export function installTasteComponentCrossover(run,sharedAnchor,residualAnchor){
  assert.ok(run.probe&&run.cueTastePolicy==='shared-plus-cue');
  for(const anchor of [sharedAnchor,residualAnchor]){
    assert.equal(anchor.kind,'odor-routed-world');assert.deepEqual(anchor.state.history,run.history);assert.deepEqual(anchor.state.founderIds,run.founderIds);assert.equal(anchor.state.cueTastePolicy,run.cueTastePolicy);assert.equal(anchor.state.cueTasteReplay??null,run.cueTasteReplay??null);assert.equal(anchor.state.steeringProtection??null,run.steeringProtection??null);
  }
  for(const fly of run.world.flies){const state=run.learners[fly.id],shared=sharedAnchor.state.learners[fly.id],residual=residualAnchor.state.learners[fly.id];assert.ok(sharedAnchor.world.world.flies.some(body=>body.id===fly.id));assert.ok(residualAnchor.world.world.flies.some(body=>body.id===fly.id));assert.equal(shared.agentId,fly.id);assert.equal(residual.agentId,fly.id);assert.ok(!state.acquisition&&!state.steering.acquisition&&state.steering.pending===null);assert.equal(shared.cueTaste.weights.length,11);assert.equal(residual.cueTaste.residuals.length,16);state.cueTaste.weights=structuredClone(shared.cueTaste.weights);state.cueTaste.residuals=structuredClone(residual.cueTaste.residuals);state.work.scalarOperations+=27;state.charge.storageBytes=0;billSarsaWork(state,run.pricing);}
}
