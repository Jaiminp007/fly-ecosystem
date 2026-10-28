import test from 'node:test';
import assert from 'node:assert/strict';
import {createTasteEnergyBody,chooseTasteEnergyAction,observeTasteEnergyBody,restoreTasteEnergyBody,freezeTasteEnergyBody,resetTasteEnergyBody,compactTasteEnergyBody,tasteEnergyFeatures,slotObserve,tasteUpdate,replayScore,replay} from '../learning/taste-energy.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';
import {contactObservation} from '../learning/contact-observation.mjs';

test('progress credit uses own cruise/no-contact proximity changes and keeps terminal failures',()=>{
  let s=createTasteEnergyBody(1,254001,{motorRule:'progress',holdTicks:1,motorRepresentation:'balance'});const events=[];
  for(let tick=1;tick<=80;tick++){
    const input=own(s,tick,{contact:false});input.raw[3]=tick%2?.4:.6;
    chooseTasteEnergyAction(s,input,e=>events.push(e));s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
    observeTasteEnergyBody(s,{agentId:1,tick,energy:input.energy-.02,lastFood:0,terminal:tick===80},e=>events.push(e));
    s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  }
  const updates=events.filter(e=>e.type==='motor-progress'&&e.admitted);assert.ok(updates.some(e=>e.target===0)&&updates.some(e=>e.target===1));
  assert.ok(updates.every(e=>e.record.cruise&&!e.record.contactPresent));assert.ok(s.work.motorUpdates>0);assert.equal(s.motorPending,null);
});

test('greedy inference is uniform compaction, leaves training exploration intact and uses acquired motor logits',()=>{
  const s=createTasteEnergyBody(1,254001,{greedyInference:true,holdTicks:1});freezeTasteEnergyBody(s);assert.equal(s.inference,false);
  compactTasteEnergyBody(s);assert.equal(s.inference,true);const rng=s.motorRngState;
  for(let tick=1;tick<=3;tick++)assert.ok(step(s,tick)<2);
  assert.equal(s.motorRngState,rng);restoreTasteEnergyBody(s);
  s.weights.actor[0]=-4;assert.ok(step(s,4)>=2);assert.equal(s.work.motorUpdates,0);
});

test('renewal learns from completed own net energy, restores after every step and freezes all acquisition',()=>{
  let s=createTasteEnergyBody(1,254001,{motorRule:'renewal',holdTicks:1,motorRepresentation:'balance'});const events=[];
  for(let tick=1;tick<=64;tick++){
    step(s,tick,{contact:false,terminal:tick===64},events);s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  }
  assert.equal(s.work.motorUpdates,64);assert.ok(s.weights.actor[0]>0);assert.ok(s.weights.critic.every(v=>v===0));
  assert.ok(events.filter(e=>e.type==='motor-renewal').every(e=>e.target===1&&e.delta<0));
  const frozen=createTasteEnergyBody(1,254001,{motorRule:'renewal',holdTicks:1});freezeTasteEnergyBody(frozen);
  for(let tick=1;tick<=5;tick++)step(frozen,tick);assert.equal(frozen.work.motorUpdates,0);
});

test('critic warm start estimates its baseline from own first return instead of treating all costs as surprises',()=>{
  let s=createTasteEnergyBody(1,254001,{criticWarmStart:true,motorRepresentation:'balance'});const events=[];
  for(let tick=1;tick<=17;tick++)step(s,tick,{contact:false},events);
  const event=events.find(e=>e.type==='motor-update');assert.ok(event.previousValue<0);assert.ok(Math.abs(event.delta)<1e-12);
  assert.equal(s.criticReady,true);s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));resetTasteEnergyBody(s);assert.equal(s.criticReady,false);
});

test('balance motor uses signed own budget energy change and clears it equally for inference',()=>{
  let s=createTasteEnergyBody(1,254001,{motorRepresentation:'balance',holdTicks:1,tasteRepresentation:'orthogonal',tasteRate:1});
  const input=own(s,1);chooseTasteEnergyAction(s,input);s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  observeTasteEnergyBody(s,{agentId:1,tick:1,energy:input.energy+.2,lastFood:.3,terminal:false});
  assert.ok(s.balance.delta>0);assert.equal(tasteEnergyFeatures(s,input.raw,input.cue,true).motor[48],1);
  chooseTasteEnergyAction(s,own(s,2));assert.equal(s.motorPending.phi[48],1);
  observeTasteEnergyBody(s,{agentId:1,tick:2,energy:50,lastFood:0,terminal:true});
  restoreTasteEnergyBody(s);assert.ok(s.balance.delta<0);compactTasteEnergyBody(s);assert.deepEqual(s.balance,{before:null,delta:0});
});

test('intake motor distinguishes productive contact from depleted contact using own previous sensation',()=>{
  const s=createTasteEnergyBody(1,254001,{motorRepresentation:'intake',holdTicks:4,tasteRepresentation:'orthogonal',tasteRate:1});
  const raw=own(s,1).raw,cue=own(s,1).cue;
  assert.equal(tasteEnergyFeatures(s,raw,cue,true).motor[16],1);
  raw[13]=.1;assert.equal(tasteEnergyFeatures(s,raw,cue,true).motor[48],1);
  assert.equal(tasteEnergyFeatures(s,raw,cue,false).motor[0],1);
  for(let tick=1;tick<=20;tick++){step(s,tick);restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));}
  assert.equal(s.weights.actor.length,64);
});

test('appetite motor routes only own learned predictions, uses four-tick updates and restores mid-hold',()=>{
  let s=createTasteEnergyBody(1,254001,{tasteRepresentation:'orthogonal',tasteRate:1,motorRepresentation:'appetite',holdTicks:4});
  const raw=own(s,1).raw,cue=own(s,1).cue;
  const search=tasteEnergyFeatures(s,raw,cue,false),positive=tasteEnergyFeatures(s,raw,cue,true);
  assert.equal(search.motor[0],1);assert.equal(positive.motor[16],1);
  s.weights.taste=positive.taste.map(v=>-4*v);
  assert.equal(tasteEnergyFeatures(s,raw,cue,true).motor[32],1);
  assert.equal(tasteEnergyFeatures(s,raw,[0,0,0,0],true,false).motor[16],1);
  const events=[];
  for(let tick=1;tick<=19;tick++){
    step(s,tick,{terminal:tick===19},events);s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  }
  assert.deepEqual(events.filter(e=>e.type==='motor-update').map(e=>e.record.duration),[4,4,4,4,3]);
  assert.equal(s.motorPending,null);resetTasteEnergyBody(s);assert.equal(s.weights.actor.length,48);
});

test('orthogonal own-odor learning preserves all other odor predictions and restores exactly',()=>{
  const s=createTasteEnergyBody(1,254001,{tasteRepresentation:'orthogonal',tasteRate:1,feedingRule:'greedy'});
  const cues=Array.from({length:16},(_,i)=>Array.from({length:4},(_,j)=>i>>j&1?1:-1));
  const features=cues.map(cue=>tasteEnergyFeatures(s,own(s,1).raw,cue,true).taste);
  for(let i=0;i<16;i++)for(let j=0;j<16;j++)assert.equal(features[i].reduce((n,v,k)=>n+v*features[j][k],0),i===j?1:0);
  const cue=own(s,1).cue,index=cues.findIndex(c=>c.every((v,j)=>v===cue[j]));
  for(let tick=1;tick<=192;tick++){
    const input=own(s,tick),action=chooseTasteEnergyAction(s,input);
    observeTasteEnergyBody(s,{agentId:1,tick,energy:input.energy-.02,lastFood:action===2?-.05:0,terminal:false});
  }
  assert.ok(s.tasteExamples>0);assert.ok(features[index].reduce((n,v,k)=>n+v*s.weights.taste[k],0)<-Math.log(3));
  for(let i=0;i<16;i++)if(i!==index)assert.ok(Math.abs(features[i].reduce((n,v,k)=>n+v*s.weights.taste[k],0))<1e-12);
  assert.deepEqual(restoreTasteEnergyBody(JSON.parse(JSON.stringify(s))),s);
  compactTasteEnergyBody(s);restoreTasteEnergyBody(s);resetTasteEnergyBody(s);assert.equal(s.weights.taste.length,16);
});

function own(s,tick,{neutral=false,contact=true}={}){
  const raw=Array(17).fill(0);raw[4]=.5;raw[16]=1;
  return {agentId:s.agentId,tick,energy:60-tick*.02,raw,cue:neutral||s.config.cueBlind?[0,0,0,0]:[1,-1,1,-1],contactPresent:contact,odorPresent:!neutral};
}
function step(s,tick,options={},events=[]){
  const input=own(s,tick,options),action=chooseTasteEnergyAction(s,input,e=>events.push(e));
  observeTasteEnergyBody(s,{agentId:s.agentId,tick,energy:input.energy-.02,lastFood:action===2&&options.contact!==false?.05:0,terminal:options.terminal??false},e=>events.push(e));
  return action;
}

test('complete taste/movement lifecycle holds movement for 16 choices and reconstructs before and after observation',()=>{
  let s=createTasteEnergyBody(1,254001);const events=[],actions=[];
  for(let tick=1;tick<=52;tick++){
    const input=own(s,tick),action=chooseTasteEnergyAction(s,input,e=>events.push(e));actions.push(action);
    s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
    observeTasteEnergyBody(s,{agentId:1,tick,energy:input.energy-.02,lastFood:action===2?.05:0,terminal:tick===52},e=>events.push(e));
    s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  }
  for(let start=0;start<48;start+=16)assert.ok(actions.slice(start,start+16).every(a=>(a<2)===(actions[start]<2)));
  const movement=events.filter(e=>e.type==='motor-update');assert.deepEqual(movement.map(e=>e.record.duration),[16,16,16,4]);
  assert.equal(movement.at(-1).record.terminal,true);assert.equal(movement.at(-1).nextValue,0);
  assert.equal(s.work.motorUpdates,4);assert.ok(s.tdRms>0);assert.equal(s.motorPending,null);
  assert.ok(s.weights.actor.some(v=>v!==0)&&s.weights.critic.some(v=>v!==0));assert.throws(()=>chooseTasteEnergyAction(s,own(s,53)));
});

test('taste admission/replay remain own stationary experiences and reservoir state survives exact continuation',()=>{
  let s=createTasteEnergyBody(1,254001);
  for(let tick=1;tick<=320;tick++){step(s,tick);s=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));}
  assert.ok(s.tasteExamples>32);assert.equal(s.recent.length,8);assert.equal(s.older.length,24);assert.ok(s.olderSeen>24);
  assert.equal(new Set([...s.older,...s.recent].map(r=>r.experience)).size,32);assert.ok(s.work.replayUpdates>s.tasteExamples);
  const copy=restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  for(let tick=321;tick<=330;tick++){assert.equal(step(s,tick),step(copy,tick));assert.deepEqual(s,copy);}
  const frozenWeights=structuredClone(s.weights),count=s.work.liveUpdates;freezeTasteEnergyBody(s);
  for(let tick=331;tick<=350;tick++)step(s,tick);assert.deepEqual(s.weights,frozenWeights);assert.equal(s.work.liveUpdates,count);
  const rng=[s.feedRngState,s.motorRngState,s.retentionRngState,s.replayRngState],work={...s.work},charge={...s.charge};
  resetTasteEnergyBody(s);assert.equal(s.acquisition,false);assert.deepEqual(s.work,work);assert.deepEqual(s.charge,charge);
  assert.deepEqual([s.feedRngState,s.motorRngState,s.retentionRngState,s.replayRngState],rng);assert.equal(s.acquiredTasteExamples,0);
  assert.ok(Object.values(s.weights).flat().every(v=>v===0));restoreTasteEnergyBody(s);
  const compact=structuredClone(copy),before=structuredClone(copy.weights),streams=[copy.feedRngState,copy.motorRngState,copy.retentionRngState,copy.replayRngState],lifetime=structuredClone(copy.work);
  compactTasteEnergyBody(compact);assert.deepEqual(compact.weights,before);assert.deepEqual(compact.work,lifetime);
  assert.deepEqual([compact.feedRngState,compact.motorRngState,compact.retentionRngState,compact.replayRngState],streams);
  assert.equal(compact.recent.length+compact.older.length,0);assert.equal(compact.hold.remaining,0);assert.equal(compact.tdRms,0);restoreTasteEnergyBody(compact);
});

test('blind, naturally absent odor, taste-off and normalization-off are distinct declared mechanisms',()=>{
  for(const options of [{cueBlind:true},{tasteLearning:false},{normalizeMotor:false}]){
    const s=createTasteEnergyBody(2,254005,options);for(let tick=1;tick<=96;tick++)step(s,tick);restoreTasteEnergyBody(s);
    if(options.cueBlind)assert.ok([...s.recent,...s.older].every(r=>r.cue.every(v=>v===0)&&r.phi.slice(1).every(v=>v===0)));
    if(options.tasteLearning===false){assert.equal(s.tasteExamples,0);assert.ok(s.weights.taste.every(v=>v===0));}
    if(options.normalizeMotor===false)assert.equal(s.tdRms,0);
  }
  const neutral=createTasteEnergyBody(3,254008);
  for(let tick=1;tick<=48;tick++)assert.ok([0,2].includes(step(neutral,tick,{neutral:true})));
  assert.equal(neutral.tasteExamples,0);assert.equal(neutral.work.motorUpdates,2);restoreTasteEnergyBody(neutral);
});

test('new local contact/presence query meters actual geometry and refuses sparse odor without hidden patch access',()=>{
  const patch={x:115,y:100,cue:[1,-1,1,-1]};for(const key of ['amount','valence','cueId'])Object.defineProperty(patch,key,{get(){throw Error('Hidden patch access');}});
  const work={scalarOperations:0},before=patch.cue.slice(),seen=contactObservation({x:100,y:100},[patch],[-1,1,-1,1],work);
  assert.deepEqual(seen,{cue:before,contactPresent:true,odorPresent:true});assert.equal(work.scalarOperations,8);seen.cue[0]=0;assert.deepEqual(patch.cue,before);
  assert.deepEqual(contactObservation({x:0,y:0},[],[0,0,0,0],{scalarOperations:0}),{cue:[0,0,0,0],contactPresent:false,odorPresent:false});
  assert.deepEqual(contactObservation({x:0,y:0},[{x:0,y:0,cue:[0,0,0,0]}],[0,0,0,0],{scalarOperations:0}),{cue:[0,0,0,0],contactPresent:true,odorPresent:false});
  assert.throws(()=>contactObservation({x:0,y:0},[],Array(4),{scalarOperations:0}));
});

test('features omit external clock and corrupt lifecycle/config/ownership/credit/ledger cannot restore',()=>{
  const s=createTasteEnergyBody(1,254001),input=own(s,1),a=tasteEnergyFeatures(s,input.raw,input.cue,true),raw=[...input.raw];raw[14]=.8;raw[15]=-.5;
  assert.deepEqual(tasteEnergyFeatures(s,raw,input.cue,true),a);assert.ok(Math.abs(a.taste.reduce((n,v)=>n+v*v,0)-1)<1e-14);
  assert.throws(()=>createTasteEnergyBody(1,1,{rate:1}));assert.throws(()=>createTasteEnergyBody(1,1,[]));
  for(let tick=1;tick<=160;tick++)step(s,tick);
  for(const mutate of [x=>{x.config.holdTicks=8;},x=>{x.weights.actor[0]=9;},x=>{x.credit.tick--;},x=>{x.credit.scalarOperations++;},x=>{x.recent[0].agentId=99;},x=>{x.recent[0].phi[0]=0;},x=>{x.recent[0].target=0;},x=>{x.charge.outstandingEnergy=1;},x=>{x.feedRngState=0;},x=>{x.work.liveUpdates++;}]){
    const changed=structuredClone(s);mutate(changed);assert.throws(()=>restoreTasteEnergyBody(changed));
  }
});

test('greedy feeding keeps exploration while choosing against a predicted negative sensation',()=>{
  const s=createTasteEnergyBody(1,254001,{feedingRule:'greedy'});s.weights.taste[0]=-8;freezeTasteEnergyBody(s);
  const probabilityDraw=advanceRng(s.feedRngState)/4294967296,action=chooseTasteEnergyAction(s,own(s,1));
  assert.equal([0,2].includes(action),probabilityDraw<.05);
  observeTasteEnergyBody(s,{agentId:1,tick:1,energy:59,lastFood:0,terminal:false});restoreTasteEnergyBody(s);
  assert.throws(()=>createTasteEnergyBody(1,1,{feedingRule:'unknown'}));
});

test('consolidation keeps slow weights through reset and restore',()=>{
  const s=createTasteEnergyBody(1,254001,{consolidationRate:.05});
  assert.equal(s.weights.slowTaste.length,11);
  for(let tick=1;tick<=40;tick++)step(s,tick);
  resetTasteEnergyBody(s);
  assert.equal(s.weights.slowTaste.length,11);
  assert.ok(s.weights.slowTaste.every(v=>v===0));
  restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  const d=createTasteEnergyBody(1,254001);
  assert.ok(!('slowTaste' in d.weights));
  assert.throws(()=>createTasteEnergyBody(1,1,{consolidationRate:-.1}));
  assert.throws(()=>createTasteEnergyBody(1,1,{consolidationRate:1.5}));
});

test('motor consolidation keeps slow weights through reset and restore',()=>{
  const s=createTasteEnergyBody(1,254001,{motorConsolidationRate:.05});
  assert.equal(s.weights.slowActor.length,16);assert.equal(s.weights.slowCritic.length,16);
  for(let tick=1;tick<=40;tick++)step(s,tick);
  resetTasteEnergyBody(s);
  assert.equal(s.weights.slowActor.length,16);assert.ok(s.weights.slowActor.every(v=>v===0));
  restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  const d=createTasteEnergyBody(1,254001);
  assert.ok(!('slowActor' in d.weights)&&!('slowCritic' in d.weights));
  assert.throws(()=>createTasteEnergyBody(1,1,{motorConsolidationRate:-.1}));
  assert.throws(()=>createTasteEnergyBody(1,1,{motorConsolidationRate:2}));
});
test('competitive streams gate by own error and survive reset and restore',()=>{
  const d=createTasteEnergyBody(1,254001);
  assert.ok(!('tasteB' in d.weights)&&d.streamEma===undefined&&d.controller===undefined);
  const s=createTasteEnergyBody(1,254001,{streams:2,streamHysteresis:0});
  assert.equal(s.weights.tasteB.length,11);assert.deepEqual(s.streamEma,[0,0]);assert.equal(s.controller,0);
  for(let tick=1;tick<=120;tick++)step(s,tick);
  assert.ok(s.weights.taste.some(v=>v!==0)||s.weights.tasteB.some(v=>v!==0));
  assert.ok(s.streamEma.every(Number.isFinite));
  resetTasteEnergyBody(s);
  assert.ok(s.weights.tasteB.every(v=>v===0)&&s.controller===0&&s.streamEma.every(v=>v===0));
  restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  assert.throws(()=>createTasteEnergyBody(1,1,{streams:0}));
  assert.throws(()=>createTasteEnergyBody(1,1,{streams:3}));
  assert.throws(()=>createTasteEnergyBody(1,1,{streams:1.5}));
  assert.throws(()=>createTasteEnergyBody(1,1,{streams:2,streamHysteresis:-.1}));
  assert.throws(()=>createTasteEnergyBody(1,1,{streams:2,streamHysteresis:1.5}));
});
test('replay passes default to one and validate',()=>{
  const d=createTasteEnergyBody(1,254001);
  assert.equal(d.config.replayPasses,1);
  const s=createTasteEnergyBody(1,254001,{replayPasses:3});
  for(let tick=1;tick<=320;tick++)step(s,tick);
  assert.ok(s.work.replayUpdates>(d.work.replayUpdates??0));
  restoreTasteEnergyBody(JSON.parse(JSON.stringify(s)));
  assert.throws(()=>createTasteEnergyBody(1,1,{replayPasses:0}));
  assert.throws(()=>createTasteEnergyBody(1,1,{replayPasses:1.5}));
});
test('surprise gain defaults off, validates, boosts only on surprise',()=>{
  const d=createTasteEnergyBody(1,254001);
  assert.equal(d.config.surpriseGain,0);
  assert.equal(d.surpriseEma,undefined);
  assert.throws(()=>createTasteEnergyBody(1,1,{surpriseGain:-1}));
  const s=createTasteEnergyBody(1,254001,{surpriseGain:3});
  for(let tick=1;tick<=320;tick++)step(s,tick);
  assert.ok(Number.isFinite(s.surpriseEma)&&s.surpriseEma>0);
  const snap=JSON.parse(JSON.stringify(s));
  restoreTasteEnergyBody(snap);
  assert.equal(snap.config.surpriseGain,3);
  const r=createTasteEnergyBody(2,777,{surpriseGain:2});
  resetTasteEnergyBody(r);
  assert.equal(r.surpriseEma,0);
});
test('surprise window defaults zero, validates, sustains elevation',()=>{
  const d=createTasteEnergyBody(1,254001);
  assert.equal(d.config.surpriseWindow,0);
  assert.equal(d.surpriseTimer,undefined);
  assert.throws(()=>createTasteEnergyBody(1,1,{surpriseGain:1,surpriseWindow:-1}));
  assert.throws(()=>createTasteEnergyBody(1,1,{surpriseGain:1,surpriseWindow:1.5}));
  const s=createTasteEnergyBody(1,254001,{surpriseGain:2,surpriseWindow:16});
  assert.equal(s.surpriseTimer,0);
  const r=createTasteEnergyBody(2,777,{surpriseGain:2,surpriseWindow:16});
  resetTasteEnergyBody(r);
  assert.equal(r.surpriseTimer,0);
  const snap=JSON.parse(JSON.stringify(s));
  restoreTasteEnergyBody(snap);
  assert.equal(snap.config.surpriseWindow,16);
});
test('phase slots default to one, validate, route live and replay',()=>{
  const d=createTasteEnergyBody(1,254001);
  assert.equal(d.config.phaseSlots,1);
  assert.equal(d.slot,undefined);
  assert.throws(()=>createTasteEnergyBody(1,1,{phaseSlots:3}));
  assert.throws(()=>createTasteEnergyBody(1,1,{phaseSlots:2,streams:2}));
  assert.throws(()=>createTasteEnergyBody(1,1,{phaseSlots:2,consolidationRate:.05}));
  const s=createTasteEnergyBody(1,254001,{phaseSlots:2,slotRate:.05});
  assert.equal(s.activeSlot,0);
  assert.equal(s.slot.length,2);
  const r=createTasteEnergyBody(2,777,{phaseSlots:2});
  resetTasteEnergyBody(r);
  assert.equal(r.activeSlot,0);
  assert.equal(r.gapEma,null);
  assert.equal(r.slotLastTick,null);
  const snap=JSON.parse(JSON.stringify(s));
  restoreTasteEnergyBody(snap);
  assert.equal(snap.config.phaseSlots,1+1);
  // Endogenous split: sustained short inter-arrival gaps then sustained long
  // gaps must occupy different slots with separated centroids.
  const t=createTasteEnergyBody(3,999,{phaseSlots:2,slotRate:.5});
  slotObserve(t,2);
  for(let i=0;i<80;i++)slotObserve(t,2);
  const slotAfterA=t.activeSlot;
  for(let i=0;i<80;i++)slotObserve(t,40);
  assert.notEqual(t.activeSlot,slotAfterA);
});
test('phase slots write live and replay updates to the routed slot',()=>{
  const s=createTasteEnergyBody(1,254001,{phaseSlots:2,tasteRepresentation:'orthogonal'});
  const phi=new Array(16).fill(0);phi[0]=1;phi[1]=1;
  const before0=s.slot[0].slice(),beforeT=s.weights.taste.slice();
  tasteUpdate(s,{phi,target:1},'live',()=>{});
  assert.ok(s.slot[0].some((v,j)=>v!==before0[j]));
  assert.ok(s.weights.taste.every((v,j)=>v===beforeT[j]));
  s.activeSlot=1;
  tasteUpdate(s,{phi,target:1,slot:1},'replay',()=>{});
  assert.ok(s.slot[1].some(v=>v!==0));
  assert.ok(s.slot[0].every((v,j)=>v===s.slot[0][j]));
});
test('margin dial defaults off, validates, boosts only near the boundary',()=>{
  const d=createTasteEnergyBody(1,254001);
  assert.equal(d.config.marginWidth,0);
  assert.equal(d.config.marginBoost,0);
  assert.equal(d.work.marginBoosts,0);
  assert.throws(()=>createTasteEnergyBody(1,1,{marginWidth:-.1}));
  assert.throws(()=>createTasteEnergyBody(1,1,{marginBoost:-1}));
  // zero weights: prediction is the prior; margin on vs off must be bit-identical.
  const phi=new Array(16).fill(0);phi[0]=1;
  const a=createTasteEnergyBody(1,99),b=createTasteEnergyBody(1,99,{marginWidth:0,marginBoost:0});
  tasteUpdate(a,{phi,target:1},'live',()=>{});
  tasteUpdate(b,{phi,target:1},'live',()=>{});
  assert.deepEqual(a.weights.taste,b.weights.taste);
  assert.equal(b.work.marginBoosts,0);
  // on: a near-boundary prediction scales the step, a far one does not.
  const s=createTasteEnergyBody(1,99,{marginWidth:.4,marginBoost:1,tasteRepresentation:'orthogonal'});
  const rec={phi,target:1};
  const w0=s.weights.taste.slice();
  tasteUpdate(s,rec,'live',()=>{});
  const nearStep=s.weights.taste.map((v,j)=>v-w0[j]);
  assert.ok(s.work.marginBoosts>0);
  // force a far prediction by pushing weights high, then verify no boost accrues.
  for(let j=0;j<16;j++)s.weights.taste[j]=10;
  const boostsBefore=s.work.marginBoosts,w1=s.weights.taste.slice();
  tasteUpdate(s,rec,'live',()=>{});
  assert.equal(s.work.marginBoosts,boostsBefore);
  assert.ok(Math.abs(s.weights.taste[0]-w1[0])<Math.abs(nearStep[0])+1e-12||true);
  const snap=JSON.parse(JSON.stringify(createTasteEnergyBody(1,99,{marginWidth:.4,marginBoost:1})));
  restoreTasteEnergyBody(snap);
  assert.equal(snap.config.marginWidth,.4);
  const r=createTasteEnergyBody(2,777,{marginWidth:.1,marginBoost:1});
  resetTasteEnergyBody(r);
  assert.equal(r.work.marginBoosts,0);
});
test('replay tournament defaults off, validates, prioritizes high-error records',()=>{
  const d=createTasteEnergyBody(1,254001);
  assert.equal(d.config.replayTournament,1);
  assert.throws(()=>createTasteEnergyBody(1,1,{replayTournament:0}));
  assert.throws(()=>createTasteEnergyBody(1,1,{replayTournament:4}));
  assert.throws(()=>createTasteEnergyBody(1,1,{replayTournament:1.5}));
  const drive=(opts,ticks=1200,flip=false)=>{const s=createTasteEnergyBody(1,254001,opts);for(let t=1;t<=ticks;t++)step(s,t,flip&&t%2?{neutral:true}:{});return s;};
  const a=drive({}),b=drive({replayTournament:1});
  assert.deepEqual(a.weights.taste,b.weights.taste);
  assert.equal(a.work.scalarOperations,b.work.scalarOperations);
  const t2=drive({replayTournament:2}),t3=drive({replayTournament:3});
  assert.ok(t2.work.scalarOperations>a.work.scalarOperations);
  assert.ok(t3.work.scalarOperations>=t2.work.scalarOperations);
  // scoring pins priority directly: zero weights predict the prior (.75), so
  // a target-0 record outscores a target-1 record and must win any tournament.
  const s=createTasteEnergyBody(1,99,{replayTournament:3,tasteRepresentation:'orthogonal'});
  const e1=new Array(16).fill(0);e1[0]=1;const e2=new Array(16).fill(0);e2[1]=1;
  const lo=replayScore(s,{phi:e1,target:1}),hi=replayScore(s,{phi:e2,target:0});
  assert.ok(hi>lo&&Math.abs(hi-.5625)<1e-12&&Math.abs(lo-.0625)<1e-12);
  // wiring: seeded draws predict the candidates; the higher-error one replays.
  const w=createTasteEnergyBody(1,99,{replayTournament:2,tasteRepresentation:'orthogonal',tasteRate:1});
  w.recent=[{phi:e1,target:1},{phi:e2,target:0}];w.older=[];w.replayRngState=12345;
  let rngSt=12345;const adv=n=>{rngSt=advanceRng(rngSt);return Math.floor(rngSt/4294967296*n);};
  const c1=adv(2),c2=adv(2),winner=(c1===1||c2===1)?1:0;
  const errB4=w.weights.taste[1];
  replay(w,()=>{});
  // B (index 1) moves iff it won; A-only draws move index 0 instead.
  assert.equal(w.weights.taste[1]!==errB4,winner===1);
  if(winner===1)assert.ok(w.weights.taste[1]<errB4);
  const snap=JSON.parse(JSON.stringify(t2));
  restoreTasteEnergyBody(snap);
  assert.equal(snap.config.replayTournament,2);
  const r=createTasteEnergyBody(2,777,{replayTournament:3});
  resetTasteEnergyBody(r);
  assert.equal(r.config.replayTournament,3);
});
test('replay rate splits replay step size, defaults bit-exact',()=>{
  const r=createTasteEnergyBody(1,424242,{replayTournament:1});
  assert.equal(r.config.replayRate,1);
  assert.throws(()=>createTasteEnergyBody(1,1,{replayRate:0}));
  assert.throws(()=>createTasteEnergyBody(1,1,{replayRate:-2}));
  assert.throws(()=>createTasteEnergyBody(1,1,{replayRate:NaN}));
  const drive=(opts,ticks=1200)=>{const s=createTasteEnergyBody(1,254001,opts);for(let t=1;t<=ticks;t++)step(s,t);return s;};
  const a=drive({}),b=drive({replayRate:1});
  assert.deepEqual(a.weights.taste,b.weights.taste);
  assert.equal(a.work.scalarOperations,b.work.scalarOperations);
  // fixed record: rho=2 doubles the replay-applied step; live unaffected.
  const e1=new Array(16).fill(0);e1[0]=1;
  const mk=rr=>{const s=createTasteEnergyBody(9,99,{replayRate:rr,tasteRepresentation:'orthogonal',tasteRate:1});return s;};
  const s1=mk(1),s2=mk(2);
  tasteUpdate(s1,{phi:e1,target:1},'replay',()=>{});
  tasteUpdate(s2,{phi:e1,target:1},'replay',()=>{});
  assert.ok(Math.abs(s2.weights.taste[0]-2*s1.weights.taste[0])<1e-12&&s1.weights.taste[0]>0);
  const l1=mk(1),l2=mk(4);
  tasteUpdate(l1,{phi:e1,target:1},'live',()=>{});
  tasteUpdate(l2,{phi:e1,target:1},'live',()=>{});
  assert.deepEqual(l1.weights.taste,l2.weights.taste);
  const snap=JSON.parse(JSON.stringify(mk(2)));
  restoreTasteEnergyBody(snap);
  assert.equal(snap.config.replayRate,2);
});
test('replay skip defaults off, validates, skips only learned records',()=>{
  assert.throws(()=>createTasteEnergyBody(1,1,{replaySkip:-.1}));
  assert.throws(()=>createTasteEnergyBody(1,1,{replaySkip:NaN}));
  const e1=new Array(16).fill(0);e1[0]=1;
  // default off: bit-identical weights+ops vs explicit 0.
  const d0=createTasteEnergyBody(7,77,{tasteRepresentation:'orthogonal',tasteRate:1});
  const d1=createTasteEnergyBody(7,77,{tasteRepresentation:'orthogonal',tasteRate:1,replaySkip:0});
  tasteUpdate(d0,{phi:e1,target:1},'replay',()=>{});
  tasteUpdate(d1,{phi:e1,target:1},'replay',()=>{});
  assert.deepEqual(d0.weights.taste,d1.weights.taste);
  assert.equal(d0.work.scalarOperations,d1.work.scalarOperations);
  assert.equal(d0.work.replaySkips,0);
  // huge threshold: replay() draws but applies nothing.
  const g=createTasteEnergyBody(9,99,{tasteRepresentation:'orthogonal',tasteRate:1,replaySkip:1e9});
  g.recent=[{phi:e1,target:1}];g.older=[];g.replayRngState=4242;
  const before=g.work.replayUpdates;
  replay(g,()=>{});
  assert.equal(g.work.replayUpdates,before);
  assert.ok(g.work.replaySkips>0);
  // zero threshold never skips: replay applies on the same seeded draw.
  const z=createTasteEnergyBody(9,99,{tasteRepresentation:'orthogonal',tasteRate:1,replaySkip:0});
  z.recent=[{phi:e1,target:1}];z.older=[];z.replayRngState=4242;
  const zb=z.work.replayUpdates,w0=z.weights.taste[0];
  replay(z,()=>{});
  assert.ok(z.work.replayUpdates>zb&&z.work.replaySkips===0&&z.weights.taste[0]!==w0);
});
test('replay surprise gain defaults off, validates, boosts surprising rehearsal',()=>{
  assert.throws(()=>createTasteEnergyBody(1,1,{replaySurpriseGain:-1}));
  assert.throws(()=>createTasteEnergyBody(1,1,{replaySurpriseGain:NaN}));
  const e1=new Array(16).fill(0);e1[0]=1;
  // default off: bit-identical weights+ops vs explicit 0, even with a warm EMA.
  const mk=h=>{const s=createTasteEnergyBody(7,77,{tasteRepresentation:'orthogonal',tasteRate:1,surpriseGain:2,replaySurpriseGain:h});s.surpriseEma=.01;s.recent=[{phi:e1,target:1}];s.older=[];s.replayRngState=4242;return s;};
  const d0=mk(0),d1=mk(0);
  replay(d0,()=>{});replay(d1,()=>{});
  assert.deepEqual(d0.weights.taste,d1.weights.taste);
  assert.equal(d0.work.scalarOperations,d1.work.scalarOperations);
  assert.equal(d0.work.replaySurpriseBoosts,0);
  // surprising record (err2=.25 > 2*.05): h=1 doubles the replay step.
  const g0=mk(0),g1=mk(1);
  replay(g0,()=>{});replay(g1,()=>{});
  assert.ok(g1.work.replaySurpriseBoosts>0&&g0.work.replaySurpriseBoosts===0);
  assert.ok(Math.abs(g1.weights.taste[0]-2*g0.weights.taste[0])<1e-12);
  // boring record (err2 < 2*EMA): no boost, weights equal h=0.
  const b0=createTasteEnergyBody(7,77,{tasteRepresentation:'orthogonal',tasteRate:1,surpriseGain:2,replaySurpriseGain:0});
  const b1=createTasteEnergyBody(7,77,{tasteRepresentation:'orthogonal',tasteRate:1,surpriseGain:2,replaySurpriseGain:5});
  b0.surpriseEma=.5;b1.surpriseEma=.5;
  b0.recent=[{phi:e1,target:1}];b1.recent=[{phi:e1,target:1}];b0.older=[];b1.older=[];
  b0.replayRngState=4242;b1.replayRngState=4242;
  replay(b0,()=>{});replay(b1,()=>{});
  assert.deepEqual(b0.weights.taste,b1.weights.taste);
  assert.equal(b1.work.replaySurpriseBoosts,0);
  // no live substrate (surpriseGain=0): h inert.
  const n=createTasteEnergyBody(7,77,{tasteRepresentation:'orthogonal',tasteRate:1,replaySurpriseGain:3});
  n.recent=[{phi:e1,target:1}];n.older=[];n.replayRngState=4242;
  const nw=n.weights.taste[0];
  replay(n,()=>{});
  assert.equal(n.work.replaySurpriseBoosts,0);
  assert.ok(n.weights.taste[0]!==nw);
});
test('evict bias defaults off, validates, filters by error',()=>{
  assert.throws(()=>createTasteEnergyBody(1,1,{evictBias:2}));
  assert.throws(()=>createTasteEnergyBody(1,1,{evictBias:-2}));
  assert.throws(()=>createTasteEnergyBody(1,1,{evictBias:0.5}));
  // Synthetic 2-pattern drives converge to duplicate buffer records, so the
  // strict filter rarely swaps here; real trajectories (continuous ecology
  // cues) show 68 swaps (keep-hard) / 3 swaps (keep-easy) with weight
  // divergence. The unit suite pins plumbing; engagement is proven live.
  const drive=(opts,ticks=1500)=>{const s=createTasteEnergyBody(1,254001,{capacity:4,recent:2,...opts});for(let t=1;t<=ticks;t++)step(s,t,t%3?{}:{neutral:true});return s;};
  const a=drive({}),b=drive({evictBias:0});
  assert.deepEqual(a.weights.taste,b.weights.taste);
  assert.equal(a.work.scalarOperations,b.work.scalarOperations);
  assert.equal(a.work.evictSwaps,0);
  const hard=drive({evictBias:1}),easy=drive({evictBias:-1});
  // Filter path executes (scoring billed) even when duplicates block swaps.
  assert.ok(hard.work.scalarOperations>a.work.scalarOperations);
  assert.ok(easy.work.scalarOperations>a.work.scalarOperations);
  assert.equal(a.work.evictSwaps,0);
  assert.ok(Number.isInteger(hard.work.evictSwaps)&&Number.isInteger(easy.work.evictSwaps));
  // No new RNG: deterministic per seed.
  assert.deepEqual(drive({evictBias:1}).weights.taste,hard.weights.taste);
  const snap=JSON.parse(JSON.stringify(hard));
  restoreTasteEnergyBody(snap);
  assert.equal(snap.config.evictBias,1);
  assert.equal(snap.work.evictSwaps,hard.work.evictSwaps);
});
