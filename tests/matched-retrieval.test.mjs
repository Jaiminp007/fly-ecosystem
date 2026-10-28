import test from 'node:test';
import assert from 'node:assert/strict';
import {matchedRetrieval} from '../learning/matched-retrieval.mjs';
import {createEpisodicMemory,rememberEpisodic,inspectEpisodic} from '../learning/episodic.mjs';
const feature=x=>[x,...Array(16).fill(0)];

test('matching can change a context-confounded supported ranking using only past records',()=>{
  const memory=createEpisodicMemory({neighbors:8,bandwidth:.25,maxDistance:.6});
  for(const [x,action,reward]of [[0,-1,0],[.5,-1,1],[.05,1,.1],[-.5,1,-.9]])rememberEpisodic(memory,feature(x),action,reward);
  const query=feature(0),retrieval=inspectEpisodic(memory,query),before=structuredClone(retrieval),matched=matchedRetrieval(query,retrieval);
  assert.ok(retrieval.positive.estimate<retrieval.negative.estimate);assert.ok(matched.advantage>0);
  assert.equal(matched.pairComparisons,4);assert.equal(matched.additionalRecordReads,8);assert.deepEqual(retrieval,before);
  assert.ok(matched.pairs.some(pair=>pair.pairDistance<.1));assert.ok(matched.pairs.every(pair=>pair.pairDistance<=.6));
});

test('no common context produces explicit unavailability without fabricating a return',()=>{
  const row=(x,action,index)=>({features:feature(x),action,reward:action,index});
  const query=feature(0),none=matchedRetrieval(query,{negative:{neighbors:[]},positive:{neighbors:[row(0,1,0)]}});
  assert.equal(none.available,false);assert.equal(none.advantage,null);assert.equal(none.pairComparisons,0);
  const far=matchedRetrieval(query,{negative:{neighbors:[row(-1,-1,0)]},positive:{neighbors:[row(1,1,1)]}});
  assert.equal(far.available,false);assert.equal(far.pairComparisons,1);assert.equal(far.additionalRecordReads,2);
});

test('shared log-weight offset avoids numeric underflow and rejects malformed data',()=>{
  const row=(x,action,index)=>({features:feature(x),action,reward:action*.25,index});
  const query=feature(1),retrieval={negative:{neighbors:[row(-1,-1,0)]},positive:{neighbors:[row(-1,1,1)]}},result=matchedRetrieval(query,retrieval,{bandwidth:.05});
  assert.equal(result.advantage,.5);assert.equal(result.pairs[0].weight,1);assert.equal(result.meanPairDistance,0);
  assert.throws(()=>matchedRetrieval([],retrieval),/features/);assert.throws(()=>matchedRetrieval(query,retrieval,{bandwidth:0}),/geometry/);
  const bad=structuredClone(retrieval);bad.positive.neighbors[0].action=-1;assert.throws(()=>matchedRetrieval(query,bad),/outcome/);
});
