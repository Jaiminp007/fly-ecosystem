import assert from 'node:assert/strict';
import {installTasteSteeringCrossover} from './taste-steering-crossover.mjs';
import {billSarsaWork} from './sarsa-experiment.mjs';

export function installLearnedRetentionCrossover(run,tasteAnchor,steeringAnchor,gateAnchor){
  assert.equal(run.contactBandit,'learned');assert.equal(gateAnchor.kind,'odor-routed-world');assert.deepEqual(gateAnchor.state.history,run.history);assert.deepEqual(gateAnchor.state.founderIds,run.founderIds);assert.equal(gateAnchor.state.contactBandit,'learned');
  installTasteSteeringCrossover(run,tasteAnchor,steeringAnchor);
  for(const fly of run.world.flies){const state=run.learners[fly.id],source=gateAnchor.state.learners[fly.id];assert.ok(gateAnchor.world.world.flies.some(body=>body.id===fly.id));assert.equal(source.agentId,fly.id);assert.ok(state.contactBandit&&!state.contactBandit.acquisition&&state.contactBandit.pending===null);assert.equal(source.contactBandit.weights.length,2);assert.ok(source.contactBandit.weights.every(weights=>weights.length===7));state.contactBandit.weights=structuredClone(source.contactBandit.weights);state.work.scalarOperations+=14;state.charge.storageBytes=0;billSarsaWork(state,run.pricing);}
}
