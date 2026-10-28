import assert from 'node:assert/strict';
import {tickFeatures,tickNetwork} from './tick-actor-critic.mjs';
import {cueObservation} from './cue-foraging.mjs';

const versions=['initial','A','B','C','final'];
const tv=(left,right) => left.reduce((sum,v,index) => sum+Math.abs(v-right[index]),0)/2;
export function diagnosePolicyHistory(history) {
  const before=JSON.stringify(history), work={scalarOperations: 0};
  assert.deepEqual(Object.keys(history.models),versions);
  for (const weights of Object.values(history.models)) assert.deepEqual(Object.keys(weights).map(Number).sort((a,b)=>a-b),history.founderIds);
  const parameterChanges=versions.map(version => {
    const groups={hidden: {l1: 0,max: 0},policyHeads: {l1: 0,max: 0},valueHead: {l1: 0,max: 0}};
    for (const id of history.founderIds) for (let index=0; index<161; index++) {
      const change=Math.abs(history.models[version][id][index]-history.models.initial[id][index]);
      const group=groups[index<136 ? 'hidden' : index<156 ? 'policyHeads' : 'valueHead'];
      group.l1+=change; group.max=Math.max(group.max,change);
    }
    return {version,groups};
  });
  const rows=[];
  for (const [contextIndex,context] of history.contexts.entries()) {
    assert.ok(history.founderIds.includes(context.agentId));
    assert.deepEqual(cueObservation(context.raw,context.sourceCue),context.observation);
    const pool=history.codebook[context.phase==='return-A' ? 'A' : context.phase];
    const stimuli=[...pool.map(v => ({cueId: v.id,bits: v.bits,valence: v.valence})),{cueId: 0,bits: [0,0,0,0],valence: 0}];
    const initial=history.models.initial[context.agentId];
    for (const version of versions) {
      const weights=history.models[version][context.agentId],predictions=[];
      for (const stimulus of stimuli) {
        const inputs=tickFeatures({work},context.raw,cueObservation(context.raw,stimulus.bits));
        const predict=w => tickNetwork(w,inputs,work);
        const base=predict(initial),current=predict(weights);
        const hiddenReset=predict([...initial.slice(0,136),...weights.slice(136)]);
        const headsReset=predict([...weights.slice(0,136),...initial.slice(136,156),...weights.slice(156)]);
        const valueReset=predict([...weights.slice(0,156),...initial.slice(156)]);
        assert.ok(tv(headsReset.probabilities,base.probabilities)<1e-15,'Initial zero input heads must remove learned policy effects');
        assert.deepEqual(valueReset.probabilities,current.probabilities,'Value head cannot affect inference policy');
        predictions.push({cueId: stimulus.cueId,valence: stimulus.valence,probabilities: current.probabilities,value: current.value,
          totalVariationFromInitial: tv(current.probabilities,base.probabilities),hiddenResetPolicyChange: tv(current.probabilities,hiddenReset.probabilities),
          headsResetToInitialDifference: tv(headsReset.probabilities,base.probabilities),valueResetPolicyChange: tv(valueReset.probabilities,current.probabilities)});
      }
      const mean=(label,indices) => predictions.filter(v=>v.valence===label).reduce((n,v)=>n+indices.reduce((s,index)=>s+v.probabilities[index],0),0)/2;
      rows.push({contextIndex,version,predictions,acceptAssociation: mean(1,[0,2])-mean(-1,[0,2]),
        stationaryAssociation: mean(1,[2,3])-mean(-1,[2,3])});
    }
  }
  assert.equal(JSON.stringify(history),before,'Observer evaluation modified source models or contexts');
  return {seed: history.seed,parameterChanges,rows,observerScalarOperations: work.scalarOperations};
}
export function diagnosePolicyRecord(input) {
  assert.equal(input.schema,1); assert.equal(input.kind,'tick-policy-diagnosis-input');
  return {schema: 1,kind: 'tick-policy-diagnosis-output',protocolSha256: input.protocolSha256,resultsSha256: input.resultsSha256,
    histories: input.histories.map(diagnosePolicyHistory),
    scope: 'Observer-only fixed-context weight/cue substitutions; not embodied rewards, learned-skill qualification, independent causal failure identification or a new candidate.'};
}
