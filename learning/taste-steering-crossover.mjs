import assert from 'node:assert/strict';
import {billSarsaWork} from './sarsa-experiment.mjs';

export function installTasteSteeringCrossover(run,tasteAnchor,steeringAnchor){
  assert.ok(run.probe&&run.steeringLearner==='cue-shared');
  for(const anchor of [tasteAnchor,steeringAnchor]){
    assert.equal(anchor.kind,'odor-routed-world');assert.deepEqual(anchor.state.history,run.history);
    assert.deepEqual(anchor.state.founderIds,run.founderIds);assert.equal(anchor.state.steeringLearner,'cue-shared');
    assert.equal(anchor.state.cueTastePolicy,run.cueTastePolicy);
    assert.equal(anchor.state.cueTasteReplay??null,run.cueTasteReplay??null);
    assert.equal(anchor.state.steeringProjection??null,run.steeringProjection??null);assert.equal(anchor.state.steeringProtection??null,run.steeringProtection??null);
  }
  for(const fly of run.world.flies){
    const state=run.learners[fly.id],taste=tasteAnchor.state.learners[fly.id],steering=steeringAnchor.state.learners[fly.id];
    assert.ok(tasteAnchor.world.world.flies.some(body=>body.id===fly.id));assert.ok(steeringAnchor.world.world.flies.some(body=>body.id===fly.id));
    assert.equal(taste.agentId,fly.id);assert.equal(steering.steering.agentId,fly.id);
    assert.ok(!state.acquisition&&!state.steering.acquisition&&state.steering.pending===null);
    assert.equal(taste.taste.weights.length,11);assert.equal(steering.steering.weights.flat().length,16);assert.equal(steering.steering.contextWeights.flat(2).length,272);
    state.taste.weights=structuredClone(taste.taste.weights);state.steering.weights=structuredClone(steering.steering.weights);state.steering.contextWeights=structuredClone(steering.steering.contextWeights);
    let operations=299;
    if(state.cueTaste){
      assert.equal(taste.cueTaste.weights.length,11);assert.equal(taste.cueTaste.residuals.length,16);
      state.cueTaste.weights=structuredClone(taste.cueTaste.weights);state.cueTaste.residuals=structuredClone(taste.cueTaste.residuals);operations+=27;
    }
    state.work.scalarOperations+=operations;state.charge.storageBytes=0;billSarsaWork(state,run.pricing);
  }
}
