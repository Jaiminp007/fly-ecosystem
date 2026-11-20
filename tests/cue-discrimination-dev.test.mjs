// CUE-DISCRIMINATE fixture tests (G4 gate, part of it). Zero bank worlds:
// synthetic emit streams + synthetic rows only. Union-excluded via tests/
// token scan (389xxx seeds).
import test from 'node:test';
import assert from 'node:assert/strict';
import {collectCueChoice,scoreCue} from '../scripts/cue-discrimination-dev.mjs';

test('collector joins decision+physical on (tick,agentId) and labels cues',()=>{
  const c=collectCueChoice();
  // agent 1 contacts harmful cue [1,0,-1,0], pauses (action 2), eats harmful 3.
  for(let t=0;t<10;t++){
    c.emit({type:'decision',own:{tick:t,agentId:1,cue:[1,0,-1,0],contactPresent:true},action:t%2?2:2});
    c.emit({type:'physical',agentId:1,tick:t,beneficialEaten:0,harmfulEaten:3});
  }
  // agent 2 contacts beneficial cue [0,1,0,-1], cruises (action 0), eats beneficial 5.
  for(let t=0;t<10;t++){
    c.emit({type:'decision',own:{tick:t,agentId:2,cue:[0,1,0,-1],contactPresent:true},action:0});
    c.emit({type:'physical',agentId:2,tick:t,beneficialEaten:5,harmfulEaten:0});
  }
  const s=c.summarize();
  assert.equal(s.decisions,20);
  assert.equal(s.joinRate,1);
  assert.ok(Math.abs(s.harmShare-30/80)<1e-12);
  assert.equal(s.cues['1,0,-1,0'].label,'harmful');
  assert.equal(s.cues['0,1,0,-1'].label,'beneficial');
  assert.equal(s.cues['1,0,-1,0'].pause,10);
  assert.equal(s.cues['0,1,0,-1'].pause,0);
});

test('collector handles pauses, turns, non-contact and blocks',()=>{
  const c=collectCueChoice();
  c.emit({type:'decision',own:{tick:5,agentId:7,cue:[1,1,1,1],contactPresent:true},action:3});
  c.emit({type:'physical',agentId:7,tick:5,beneficialEaten:1,harmfulEaten:1});
  c.emit({type:'decision',own:{tick:600,agentId:7,cue:[0,0,0,0],contactPresent:false},action:0});
  c.emit({type:'physical',agentId:7,tick:600,beneficialEaten:2,harmfulEaten:0});
  c.emit({type:'decision',own:{tick:600,agentId:8},action:1}); // no physical follows
  const s=c.summarize();
  assert.equal(s.decisions,3);
  assert.ok(Math.abs(s.joinRate-2/3)<1e-12);
  assert.equal(s.cues['1,1,1,1'].turn,1);
  assert.equal(s.blocks[0].tot,2); // tick 5 in block 0
  assert.equal(s.blocks[1].tot,2); // tick 600 in block 1
});

const mkRow=(tag,seed,{join=1,harm=0.1,blocks=null,cues=null}={})=>({
  tag,history:{seed},
  summary:{joinRate:join,harmShare:harm,
    blocks:blocks??[{harm:1,tot:10},{harm:1,tot:10},{harm:1,tot:10},{harm:1,tot:10}],
    cues:cues??{'h':{contact:10,pause:8,turn:0,beneficial:1,harmful:9,label:'harmful'},
                'b':{contact:10,pause:1,turn:0,beneficial:9,harmful:1,label:'beneficial'}}}});

test('scorer GO: gap + conditioned pause on >=4/6 histories (room via candMean)',()=>{
  const rows=[];
  for(let h=0;h<6;h++){
    rows.push(mkRow('candidate',390001+h,{harm:0.3})); // gap .2>=.15; room via mean .3>=.25
    rows.push(mkRow('unlearned',390001+h,{harm:0.5}));
    rows.push(mkRow('frozen',390001+h,{harm:0.3}));
    rows.push(mkRow('reset',390001+h,{harm:0.4}));
  }
  const v=scoreCue(rows);
  assert.equal(v.verdict,'V1B-GATED');
});

test('scorer INVALID on join-rate breach',()=>{
  const rows=[];
  for(let h=0;h<6;h++){
    rows.push(mkRow('candidate',390011+h,{join:h===0?0.5:1}));
    rows.push(mkRow('unlearned',390011+h,{}));
  }
  assert.equal(scoreCue(rows).verdict,'INVALID-INSTRUMENT');
});

test('scorer NOGO when gap or conditioning fails',()=>{
  const rows=[];
  for(let h=0;h<6;h++){ // identical arms: no gap
    rows.push(mkRow('candidate',390021+h,{harm:0.3}));
    rows.push(mkRow('unlearned',390021+h,{harm:0.3}));
  }
  const v=scoreCue(rows);
  assert.equal(v.verdict,'PHASE-A-NOGO');
});
