import test from 'node:test';
import assert from 'node:assert/strict';
import {contactCue} from '../learning/contact-cue.mjs';
const positive=[1,-1,1,-1],negative=[-1,1,-1,1];
test('contact cue includes low/empty local patches and never reads hidden valence, amount or identity',()=>{
  const local={x:100,y:100,cue:positive};
  for(const key of ['valence','amount','cueId'])Object.defineProperty(local,key,{get(){throw Error(`Forbidden ${key}`);}});
  const work={scalarOperations:0},patches=[local,{x:130,y:100,cue:negative}],output=contactCue({x:100,y:100},patches,negative,work);
  assert.deepEqual(output,positive);assert.equal(work.scalarOperations,13);
  output[0]=0;assert.deepEqual(local.cue,positive);
});
test('local geometry, radius, fallback and deterministic tie rules are explicit and metered',()=>{
  const patches=[{x:115,y:100,cue:positive},{x:85,y:100,cue:negative},{x:115.00001,y:100,cue:negative}];
  const before=structuredClone(patches),work={scalarOperations:0};
  assert.deepEqual(contactCue({x:100,y:100},patches,[0,0,0,0],work),positive);assert.equal(work.scalarOperations,20);
  assert.deepEqual(patches,before);
  const distant={scalarOperations:0};assert.deepEqual(contactCue({x:500,y:500},patches,negative,distant),negative);assert.equal(distant.scalarOperations,18);
  assert.deepEqual(contactCue({x:0,y:0},[],[0,0,0,0],{scalarOperations:0}),[0,0,0,0]);
});
test('malformed coordinates, odor and work counters are refused',()=>{
  for(const args of [[{x:NaN,y:0},[],positive,{scalarOperations:0}],
    [{x:0,y:0},[{x:0,y:0,cue:[1,0,1,0]}],positive,{scalarOperations:0}],
    [{x:0,y:0},[],positive,{scalarOperations:-1}]])assert.throws(()=>contactCue(...args));
});
