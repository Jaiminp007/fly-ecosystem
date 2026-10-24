import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {episodicActorStep,episodicBodyParameters} from '../learning/episodic-actor.mjs';
import {episodicFeatures,rememberEpisodic} from '../learning/episodic.mjs';
import {evaluateContextSeed} from '../learning/context-tasks.mjs';

test('navigation retrieval excludes clocks, age and mating while retaining observable energy and an amplitude anchor',()=>{
 const w=new World({seed:73,founders:2,controller:'episodic-actor',episodicParameters:{featureMode:'navigation'}});w.advance(40);const f=w.flies[0],before=episodicFeatures(f.genome,f.brain,'navigation'),brain=structuredClone(f.brain);
 for(const channel of [5,6,7,8,9,14,15]){brain.activity[channel]=.9;for(const node of f.genome.nodes.filter(n=>n.channel===channel))brain.activity[node.id]=-.9;}
 assert.deepEqual(episodicFeatures(f.genome,brain,'navigation'),before);
 const local=episodicFeatures(f.genome,brain,'local');brain.activity[4]=.1;assert.notDeepEqual(episodicFeatures(f.genome,brain,'navigation'),before);brain.activity[16]=.2;assert.deepEqual(episodicFeatures(f.genome,brain,'local'),local);
 const values={traceRetention:.9920990378910495},a=evaluateContextSeed(9171,values,undefined,{featureMode:'navigation'}),b=evaluateContextSeed(9171,values,undefined,{featureMode:'mixed'});assert.deepEqual(a.arms,b.arms);
});

test('expected targets weight the configured exploratory actions and preserve explicit target provenance',()=>{
 const w=new World({seed:73,founders:2,controller:'episodic-actor',episodicParameters:{returnMode:'td',bootstrapMode:'expected',discount:.5,decisionTicks:2,creditTicks:2,featureMode:'current',exploration:.2,neuralLearning:false}}),f=w.flies[0],state=f.brain.episodic,p=w.config.episodicParameters,features=Array(17).fill(0);features[16]=1;
 for(const[action,value]of [[-1,.2],[1,.4]])rememberEpisodic(state.memory,features,action,value,{kind:'td',observed:value,estimatedFuture:0,discountPower:.5,horizon:1,terminal:false,bootstrapMode:'expected',exploration:.2});
 const step=r=>episodicActorStep(f.genome,f.brain,features,r,true,w.config.actorParameters,p);step(.9);step(.2);step(.4);
 assert.ok(Math.abs(state.lastUpdate.target.observed-.2)<1e-12);assert.ok(Math.abs(state.lastUpdate.target.estimatedFuture-.095)<1e-12);assert.ok(Math.abs(state.lastUpdate.value-.295)<1e-12);assert.equal(state.lastUpdate.target.bootstrapMode,'expected');assert.equal(state.lastUpdate.target.exploration,.2);assert.equal(state.lookupRecordsThisStep,5);
 assert.throws(()=>episodicBodyParameters({bootstrapMode:'expected'}),/requires TD/);assert.throws(()=>episodicBodyParameters({bootstrapMode:'unknown'}),/bootstrap mode/);
});

test('expected risk and reward use one policy distribution, and contextual value worlds restore exactly',()=>{
 const values={actuator:'move',moveMode:'levels',returnMode:'td',bootstrapMode:'expected',discount:.5,decisionTicks:2,creditTicks:2,featureMode:'current',exploration:.2,neuralLearning:false,reserveRisk:true,reserveThreshold:.25,riskWeight:.5},w=new World({seed:73,founders:2,controller:'episodic-actor',episodicParameters:values}),f=w.flies[0],state=f.brain.episodic,p=w.config.episodicParameters,features=Array(17).fill(0);features[16]=1;
 for(const[action,value,risk]of [[-1,.2,.1],[1,.4,.9]])rememberEpisodic(state.memory,features,action,value,{kind:'td',observed:value,estimatedFuture:0,discountPower:.5,horizon:1,terminal:false,bootstrapMode:'expected',exploration:.2},{kind:'reserve-deficit',threshold:.25,value:risk,observed:risk/2,estimatedFuture:risk/2,discountPower:.5,horizon:1,terminal:false});
 const step=(r,e)=>{const inputs=[...features];inputs[4]=e;episodicActorStep(f.genome,f.brain,inputs,r,true,w.config.actorParameters,p);};step(.9,.5);step(.2,.125);step(.4,0);
 assert.ok(Math.abs(state.lastUpdate.target.estimatedFuture-.055)<1e-12);assert.ok(Math.abs(state.lastUpdate.risk.estimatedFuture-.045)<1e-12);
 const world=new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false,ecology:'relocation',episodicParameters:{...values,featureMode:'navigation',discount:.99,decisionTicks:8,creditTicks:8}});world.advance(237);const restored=World.restore(world.checkpoint());world.advance(300);restored.advance(300);assert.deepEqual(world.checkpoint(),restored.checkpoint());assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
 const wrong=world.checkpoint();wrong.world.config.episodicParameters.bootstrapMode='greedy';assert.throws(()=>World.restore(wrong),/bootstrap state/);
 const bad=world.checkpoint();delete bad.world.flies[0].brain.episodic.memory.records[0].target.bootstrapMode;assert.throws(()=>World.restore(bad),/bootstrap/);
 const mismatch=world.checkpoint();mismatch.world.config.episodicParameters.featureMode='mixed';assert.throws(()=>World.restore(mismatch),/feature state/);
 for(const agent of world.flies)agent.age=agent.genome.traits.lifespan;const before=[...world.flies];world.step();for(const agent of before){assert.equal(agent.brain.episodic.lastUpdate.target.estimatedFuture,0);assert.equal(agent.brain.episodic.lastUpdate.target.bootstrapMode,'expected');}
});
