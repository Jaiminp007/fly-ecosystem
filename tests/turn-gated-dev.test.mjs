// TURN-GATE fixtures (G5 gate). Zero bank worlds: synthetic emit streams +
// synthetic rows only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {collectTurnChoice,scoreTurnGate} from '../scripts/turn-gated-dev.mjs';

test('collector joins per-tick cue+action+intake and labels cues',()=>{
  const c=collectTurnChoice();
  for(let t=0;t<8;t++){
    c.emit({type:'decision',own:{tick:t,agentId:1,cue:[2,0,-2,0],contactPresent:true},action:t%2?3:1});
    c.emit({type:'physical',agentId:1,tick:t,beneficialEaten:1,harmfulEaten:4});
  }
  for(let t=0;t<8;t++){
    c.emit({type:'decision',own:{tick:t,agentId:2,cue:[0,2,0,-2],contactPresent:true},action:t%2});
    c.emit({type:'physical',agentId:2,tick:t,beneficialEaten:5,harmfulEaten:0});
  }
  const s=c.summarize();
  assert.equal(s.decisions,16);
  assert.equal(s.joinRate,1);
  assert.equal(s.cues['2,0,-2,0'].label,'harmful');
  assert.equal(s.cues['0,2,0,-2'].label,'beneficial');
  assert.equal(s.cues['2,0,-2,0'].turn,8);
  assert.equal(s.cues['0,2,0,-2'].turn,4);
});

test('collector tolerates partial streams without crashing',()=>{
  const c=collectTurnChoice();
  c.emit({type:'decision',own:{tick:0,agentId:1,cue:[1,1,1,1],contactPresent:true},action:3});
  c.emit({type:'decision',own:{tick:1,agentId:9},action:0});
  c.emit({type:'physical',agentId:2,tick:1,beneficialEaten:1,harmfulEaten:0});
  const s=c.summarize();
  assert.equal(s.decisions,2);
  assert.ok(s.joinRate<1);
});

const mkRow=(tag,seed,turnPairs,joinRate=1)=>({tag,history:{seed},
  summary:{joinRate,
    cues:Object.fromEntries(turnPairs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});

test('scorer GO when candidate turns on harmful and unlearned stays flat',()=>{
  const rows=[];
  for(let h=0;h<6;h++){
    rows.push(mkRow('candidate',399001+h,[['h',true],['b',false]]));
    rows.push(mkRow('unlearned',399001+h,[['h',true,1],['b',false,1]]));
  }
  const v=scoreTurnGate(rows);
  assert.equal(v.g1,true);
  assert.equal(v.g2a,6);
  assert.equal(v.g2b,6);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-A-GO');
});

test('scorer NOGO when candidate does not turn (null control-like)',()=>{
  const rows=[];
  for(let h=0;h<6;h++){
    rows.push(mkRow('candidate',399011+h,[['h',false],['b',false]]));
    rows.push(mkRow('unlearned',399011+h,[['h',false],['b',false]]));
  }
  const v=scoreTurnGate(rows);
  assert.equal(v.go,false);
  assert.equal(v.verdict,'PHASE-A-NOGO');
});

test('scorer INVALID on join failure',()=>{
  const rows=[];
  for(let h=0;h<6;h++){
    const r=mkRow('candidate',399021+h,[['h',true],['b',false]]);
    if(h===0)r.summary.joinRate=0.5;
    rows.push(r);
    rows.push(mkRow('unlearned',399021+h,[['h',false],['b',false]]));
  }
  const v=scoreTurnGate(rows);
  assert.equal(v.go,false);
  assert.equal(v.verdict,'INVALID');
});
