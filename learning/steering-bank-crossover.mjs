import assert from 'node:assert/strict';
import {billSarsaWork} from './sarsa-experiment.mjs';

export function installSteeringBankCrossover(run,sharedAnchor,bankAnchor){
  assert.ok(run.probe&&run.transfer&&run.steeringLearner==='cue-shared');
  for(const anchor of [sharedAnchor,bankAnchor]){
    assert.equal(anchor.kind,'odor-routed-world');assert.deepEqual(anchor.state.history,run.history);assert.deepEqual(anchor.state.founderIds,run.founderIds);
    assert.equal(anchor.state.steeringLearner,'cue-shared');assert.equal(anchor.state.steeringProjection,run.steeringProjection);assert.equal(anchor.state.cueTastePolicy,run.cueTastePolicy);
  }
  for(const fly of run.world.flies){
    const state=run.learners[fly.id],shared=sharedAnchor.state.learners[fly.id],bank=bankAnchor.state.learners[fly.id];
    assert.ok(sharedAnchor.world.world.flies.some(body=>body.id===fly.id)&&bankAnchor.world.world.flies.some(body=>body.id===fly.id));
    assert.equal(shared.steering.agentId,fly.id);assert.equal(bank.steering.agentId,fly.id);assert.ok(!state.acquisition&&!state.steering.acquisition&&state.steering.pending===null);
    assert.equal(shared.steering.weights.flat().length,16);assert.equal(state.steering.contextWeights.flat(2).length,272);assert.equal(bank.steering.contextWeights[0].flat().length,16);
    state.steering.weights=structuredClone(shared.steering.weights);state.steering.contextWeights=structuredClone(state.steering.contextWeights);state.steering.contextWeights[0]=structuredClone(bank.steering.contextWeights[0]);
    state.work.scalarOperations+=304;state.charge.storageBytes=0;billSarsaWork(state,run.pricing);
  }
}
