import test from 'node:test';
import assert from 'node:assert/strict';
import {createOdorRoutedTasteBody,chooseOdorRoutedTaste,observeOdorRoutedTaste} from '../learning/odor-routed-taste.mjs';

function own(tick,cue=[1,-1,1,-1]){return {agentId:1,tick,energy:65,raw:Array(17).fill(0),cue,odorPresent:cue[0]!==0,contactPresent:cue[0]!==0,contactHomogeneous:true};}
test('matched taste modes use the same draw and charge while crediting actual actions',()=>{
  const sample=createOdorRoutedTasteBody(1,5),threshold=structuredClone(sample);sample.taste.rngState=threshold.taste.rngState=0x87654321;
  const settings={fixedMove:-1,requireHomogeneousContact:true};const sampled=chooseOdorRoutedTaste(sample,own(1),{...settings,tasteDecisionMode:'sample'}),greedy=chooseOdorRoutedTaste(threshold,own(1),{...settings,tasteDecisionMode:'threshold'});
  assert.equal(sampled.accept,false);assert.equal(greedy.accept,true);assert.equal(sampled.tasteEstimate,greedy.tasteEstimate);assert.equal(greedy.feedProbability,1);
  assert.equal(sample.taste.rngState,threshold.taste.rngState);assert.equal(sample.work.scalarOperations,threshold.work.scalarOperations);
  assert.equal(sample.credit.pending.action,3);assert.equal(threshold.credit.pending.action,2);
  observeOdorRoutedTaste(sample,{agentId:1,tick:1,energy:65,lastFood:0,terminal:false});observeOdorRoutedTaste(threshold,{agentId:1,tick:1,energy:65.1,lastFood:.1,terminal:false});
  assert.equal(sample.tasteExamples,0);assert.equal(threshold.tasteExamples,1);
});
test('odor-free choices always accept and mode validation rejects unknown rules',()=>{
  for(const tasteDecisionMode of ['sample','threshold']){const state=createOdorRoutedTasteBody(1,5),choice=chooseOdorRoutedTaste(state,own(1,[0,0,0,0]),{fixedMove:1,tasteDecisionMode});assert.equal(choice.accept,true);assert.equal(choice.feedProbability,1);}
  assert.throws(()=>chooseOdorRoutedTaste(createOdorRoutedTasteBody(1,5),own(1),{tasteDecisionMode:'oracle'}));
});
