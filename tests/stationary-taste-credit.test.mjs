import test from 'node:test';
import assert from 'node:assert/strict';
import {createStationaryTasteCredit, beginStationaryTasteAction, finishStationaryTasteAction} from '../learning/stationary-taste-credit.mjs';

const begin = (state, options={}) => beginStationaryTasteAction(state, {agentId:state.agentId,tick:state.tick+1,action:2,cue:[1,-1,1,-1],contactPresent:true,...options});
const finish = (state, options={}) => finishStationaryTasteAction(state, {agentId:state.agentId,tick:state.tick+1,lastFood:.03,terminal:false,...options});

test('stationary credit retains the action cue, signed own outcome and final experience exactly once', () => {
  const s=createStationaryTasteCredit(1), cue=[1,-1,1,-1];begin(s,{cue});cue[0]=-1;
  assert.deepEqual(finish(s),{agentId:1,tick:1,cue:[1,-1,1,-1],signedIntake:.03,outcomeSign:1,terminal:false});
  begin(s,{cue:[-1,1,-1,1]});
  assert.deepEqual(finish(s,{lastFood:-.02,terminal:true}),{agentId:1,tick:2,cue:[-1,1,-1,1],signedIntake:-.02,outcomeSign:-1,terminal:true});
  assert.equal(s.scalarOperations,6);assert.equal(s.dead,true);assert.equal(s.pending,null);
  assert.throws(()=>begin(s));assert.throws(()=>finish(s));
});

test('movement, refusal, distant fallback and zero sensation provide no taste labels but pay processing work', () => {
  const s=createStationaryTasteCredit(2);
  for (const action of [0,1,3]) {begin(s,{action});assert.equal(finish(s),null);}
  begin(s,{contactPresent:false});assert.equal(finish(s),null);
  begin(s);assert.equal(finish(s,{lastFood:0}),null);
  assert.equal(s.scalarOperations,15);
});

test('credit rejects foreign identities, skipped/double actions, invalid sensors and fabricated contact cues', () => {
  const s=createStationaryTasteCredit(3);
  for (const options of [{agentId:4},{tick:2},{action:4},{cue:[0,0,0,0]},{cue:[1,1,1,.5]},{cue:Array(4)}]) assert.throws(()=>begin(s,options));
  assert.equal(s.pending,null);begin(s);assert.throws(()=>begin(s));
  for (const options of [{agentId:4},{tick:2},{lastFood:NaN},{lastFood:1.1},{terminal:0}]) assert.throws(()=>finish(s,options));
  assert.equal(s.scalarOperations,0);assert.ok(s.pending);finish(s);assert.throws(()=>finish(s));
});

test('an explicit identity-blind adapter admits only masked cues and retains no hidden odor identity',()=>{
  const s=createStationaryTasteCredit(4,{maskedCue:true});assert.throws(()=>begin(s));
  begin(s,{cue:[0,0,0,0]});assert.deepEqual(finish(s)?.cue,[0,0,0,0]);assert.equal(s.scalarOperations,3);
});
