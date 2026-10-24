import test from 'node:test';
import assert from 'node:assert/strict';
import {World,INPUTS,OUTPUTS} from '../engine.mjs';
import {createEpisodicMemory,rememberEpisodic,inspectEpisodic,chooseEpisodic,restoreEpisodicMemory} from '../learning/episodic.mjs';
import {compactControllerView} from '../platform/controller-adapter.mjs';

test('pooled prior replaces unsupported zero with local evidence and shrinks supported action estimates with declared weights',()=>{
  const features=Array(17).fill(0),memory=createEpisodicMemory({priorStrength:2},73);
  const empty=inspectEpisodic(memory,features);assert.equal(empty.negative.estimate,0);assert.equal(empty.positive.estimate,0);
  rememberEpisodic(memory,features,-1,-.8);
  const one=inspectEpisodic(memory,features);assert.ok(Math.abs(one.negative.estimate+.8)<1e-12);assert.equal(one.positive.estimate,-.8);assert.equal(one.positive.rawEstimate,0);assert.equal(one.positive.supportWeight,0);
  let capture;chooseEpisodic(memory,features,{capture:d=>{capture=d;}});assert.equal(capture.reason,'tie');assert.equal(capture.retrieval.negative.estimate,capture.retrieval.positive.estimate);
  rememberEpisodic(memory,features,1,.4);
  const before=structuredClone(memory),both=inspectEpisodic(memory,features),prior=(-.8+.4)/2;
  assert.deepEqual(memory,before);assert.equal(both.negative.priorEstimate,prior);assert.equal(both.positive.priorEstimate,prior);
  assert.equal(both.negative.supportWeight,1);assert.equal(both.positive.supportWeight,1);
  assert.equal(both.negative.estimate,(-.8+2*prior)/3);assert.equal(both.positive.estimate,(.4+2*prior)/3);
  assert.equal(chooseEpisodic(memory,features),1);assert.deepEqual(restoreEpisodicMemory(memory),memory);
});

test('a shared pooled mean preserves supported action ranking and exact equal-estimate ties',()=>{
  const features=Array(17).fill(0),memory=createEpisodicMemory({priorStrength:4},73);
  for(let i=0;i<8;i++)rememberEpisodic(memory,features,-1,-.5);
  rememberEpisodic(memory,features,1,-.5);
  let recall=inspectEpisodic(memory,features);assert.equal(recall.negative.estimate,recall.positive.estimate);
  memory.records.at(-1).reward=.2;recall=inspectEpisodic(memory,features);
  assert.equal(Math.sign(recall.positive.estimate-recall.negative.estimate),Math.sign(recall.positive.rawEstimate-recall.negative.rawEstimate));
  memory.records.at(-1).reward=-.9;recall=inspectEpisodic(memory,features);
  assert.equal(Math.sign(recall.positive.estimate-recall.negative.estimate),Math.sign(recall.positive.rawEstimate-recall.negative.rawEstimate));
});

test('pooled prior retains numeric support across very old memories, returns finite empty estimates, and rejects invalid settings',()=>{
  const features=Array(17).fill(0),memory=createEpisodicMemory({priorStrength:4,recencyHalfLife:1},73);
  rememberEpisodic(memory,features,-1,-.25);rememberEpisodic(memory,features,1,.5);memory.seen=1_000_000;
  const recall=inspectEpisodic(memory,features);assert.equal(recall.positive.supportWeight,1);assert.ok(Math.abs(recall.negative.supportWeight-.5)<1e-9);
  assert.ok(recall.negative.estimate<recall.positive.estimate);assert.ok(Number.isFinite(recall.negative.estimate));
  for(const priorStrength of [-1,17,NaN,Infinity,null]){assert.throws(()=>createEpisodicMemory({priorStrength}),/priorStrength/);assert.throws(()=>new World({controller:'episodic-actor',episodicParameters:{priorStrength}}),/priorStrength/);}
  for(const parameters of [{priorStrength:1,reserveRisk:true,returnMode:'td',decisionTicks:8,creditTicks:8},{priorStrength:1,actuator:'joint',returnMode:'td',decisionTicks:8,creditTicks:8}])assert.throws(()=>new World({controller:'episodic-actor',episodicParameters:parameters}),/Pooled prior/);
});

test('disabled prior preserves complete legacy bytes and action RNG streams',()=>{
  const config={seed:73,founders:4,controller:'episodic-actor',reproduction:false,episodicParameters:{actuator:'move',returnMode:'td',decisionTicks:8,creditTicks:8,discount:.99,moveMode:'levels'}};
  const a=new World(config),b=new World({...config,episodicParameters:{...config.episodicParameters,priorStrength:0}});
  a.advance(800);b.advance(800);assert.deepEqual(a.checkpoint(),b.checkpoint());
  assert.equal(Object.hasOwn(a.config.episodicParameters,'priorStrength'),false);
  assert.equal(Object.hasOwn(a.flies[0].brain.episodic.memory.config,'priorStrength'),false);
});

test('prior acquisition, energy charges, inspection and exact checkpoints remain consistent; children start empty',()=>{
  const world=new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false,ecology:'relocation',episodicParameters:{actuator:'move',returnMode:'td',discount:.99,decisionTicks:8,creditTicks:8,moveMode:'levels',priorStrength:2}});world.advance(237);
  const restored=World.restore(JSON.parse(JSON.stringify(world.checkpoint())));world.advance(400);restored.advance(400);assert.deepEqual(restored.checkpoint(),world.checkpoint());
  const fly=world.flies[0],s=fly.brain.episodic,view=compactControllerView(world.inspect(fly.id),{inputs:INPUTS,outputs:OUTPUTS});
  assert.ok(Math.abs(world.metrics().accountingError)<1e-7);assert.equal(view.episodic.priorStrength,2);assert.equal(s.lastDecision.priorStrength,2);
  assert.ok(s.lookupRecordsThisStep<=2*s.memory.config.capacity);assert.equal(s.memory.records.length,Math.min(s.memory.seen,s.memory.config.capacity));assert.ok(s.memory.records.every(row=>row.target.kind==='td'));
  const child=world.makeFly(fly.genome,[fly.id],1,0,[],100,100,30);assert.equal(child.brain.episodic.memory.records.length,0);assert.equal(child.brain.episodic.memory.seen,0);assert.equal(child.brain.episodic.memory.config.priorStrength,2);
  for(const mutate of [c=>{c.world.flies[0].brain.episodic.memory.config.priorStrength=3;},c=>{c.world.flies[0].brain.episodic.lastDecision.retrieval.negative.priorWeight=3;},c=>{delete c.world.flies[0].brain.episodic.lastDecision.priorStrength;},c=>{c.world.flies[0].brain.episodic.lastDecision.retrieval.positive.estimate=1;}]){const invalid=world.checkpoint();mutate(invalid);assert.throws(()=>World.restore(invalid),/prior|configuration/);}
});
