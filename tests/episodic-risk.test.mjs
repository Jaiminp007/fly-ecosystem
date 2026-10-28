import test from 'node:test';
import assert from 'node:assert/strict';
import {World,INPUTS,OUTPUTS} from '../engine.mjs';
import {episodicActorStep,episodicEnergyCost,episodicBodyParameters} from '../learning/episodic-actor.mjs';
import {rememberEpisodic,chooseEpisodic,inspectEpisodic,validateEpisodicRisk} from '../learning/episodic.mjs';
import {compactControllerView} from '../platform/controller-adapter.mjs';

const parameters={actuator:'move',moveMode:'levels',returnMode:'td',discount:.5,decisionTicks:2,creditTicks:2,featureMode:'current',neuralLearning:false,reserveRisk:true,reserveThreshold:.25,riskWeight:.5};
const label=(value,observed=value/2)=>({kind:'reserve-deficit',threshold:.25,value,observed,estimatedFuture:value-observed,discountPower:.5,horizon:1,terminal:false});
test('reserve targets align observed sensor energy with actual actions and bootstrap both heads from the same greedy action',()=>{
 const world=new World({seed:73,founders:2,controller:'episodic-actor',episodicParameters:parameters}),fly=world.flies[0],p=world.config.episodicParameters,state=fly.brain.episodic,features=Array(17).fill(0);features[16]=1;
 for(const[action,value,risk]of [[-1,.2,.1],[1,.4,.9]])rememberEpisodic(state.memory,features,action,value,{kind:'td',observed:value,estimatedFuture:0,discountPower:.5,horizon:1,terminal:false},label(risk));
 assert.equal(chooseEpisodic(state.memory,features),1);assert.equal(chooseEpisodic(state.memory,features,{reserveRisk:true,riskWeight:.5}),-1);
 const before=structuredClone(state.memory),scores=inspectEpisodic(state.memory,features,{reserveRisk:true,riskWeight:.5});assert.deepEqual(state.memory,before);assert.equal(scores.negative.riskEstimate,.1);assert.ok(Math.abs(scores.positive.score+.05)<1e-12);
 const step=(reward,energy)=>{const inputs=[...features];inputs[4]=energy;episodicActorStep(fly.genome,fly.brain,inputs,reward,true,world.config.actorParameters,p);};
 step(.9,.5);step(.2,.125);assert.equal(state.memory.seen,2);step(.4,0);
 assert.ok(Math.abs(state.lastUpdate.target.observed-.2)<1e-12);assert.ok(Math.abs(state.lastUpdate.target.estimatedFuture-.05)<1e-12);
 assert.ok(Math.abs(state.lastUpdate.risk.observed-.5)<1e-12);assert.ok(Math.abs(state.lastUpdate.risk.estimatedFuture-.025)<1e-12);assert.ok(Math.abs(state.lastUpdate.risk.value-.525)<1e-12);
 assert.deepEqual(state.memory.records.at(-1).risk,state.lastUpdate.risk);
 assert.equal(episodicEnergyCost(fly.brain,p,.1),2*episodicEnergyCost(fly.brain,{...p,reserveRisk:false},.1));
});

test('risk worlds retain exact checkpoint behavior, matched founders and charged ablations without leaking risk labels',()=>{
 const config={seed:73,founders:4,controller:'episodic-actor',reproduction:false,mutation:false,ecology:'relocation',episodicParameters:{...parameters,discount:.99,decisionTicks:8,creditTicks:8}},world=new World(config),off=new World({...config,episodicParameters:{...config.episodicParameters,riskLearning:false}}),zero=new World({...config,episodicParameters:{...config.episodicParameters,riskWeight:0}});
 assert.deepEqual(world.flies.map(({brain,...f})=>f),off.flies.map(({brain,...f})=>f));
 world.advance(237);const copy=World.restore(world.checkpoint());world.advance(300);copy.advance(300);assert.deepEqual(copy.checkpoint(),world.checkpoint());assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
 off.advance(300);zero.advance(300);
 // Learning labels without using them must have exactly the same behavior as
 // the equally charged no-risk-learning ablation.
 assert.deepEqual(zero.metrics(),off.metrics());
 assert.ok(off.flies.every(f=>f.brain.episodic.memory.records.every(r=>r.risk===undefined)));
 assert.ok(zero.flies.every(f=>f.brain.episodic.memory.records.every(r=>r.risk)));
 const bad=world.checkpoint();bad.world.flies[0].brain.episodic.memory.records[0].risk.value=2;assert.throws(()=>World.restore(bad),/reserve-risk/);
 const missing=world.checkpoint();delete missing.world.flies[0].brain.episodic.memory.records[0].risk;assert.throws(()=>World.restore(missing),/target mode/);
 const wrong=world.checkpoint();wrong.world.config.episodicParameters.riskWeight=.2;assert.throws(()=>World.restore(wrong),/configuration mismatch/);
 const view=compactControllerView(world.inspect(world.flies[0].id),{inputs:INPUTS,outputs:OUTPUTS});assert.deepEqual(view.episodic.lastUpdate.risk,world.flies[0].brain.episodic.lastUpdate.risk);
 assert.throws(()=>episodicBodyParameters({reserveRisk:true}),/aligned TD/);assert.throws(()=>episodicBodyParameters({riskWeight:3}),/riskWeight/);
});

test('terminal reserve risk uses the observed final transition and an explicitly unsafe absorbing state, without inheritance',()=>{
 const world=new World({seed:73,founders:2,controller:'episodic-actor',reproduction:false,episodicParameters:parameters});world.advance(1);const founders=[...world.flies];for(const f of founders)f.age=f.genome.traits.lifespan;world.step();
 assert.equal(world.flies.length,0);assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
 for(const f of founders){const u=f.brain.episodic.lastUpdate;assert.equal(u.target.terminal,true);assert.equal(u.target.estimatedFuture,0);assert.equal(u.risk.terminal,true);assert.equal(u.risk.estimatedFuture,u.risk.discountPower);assert.equal(f.brain.episodic.pending.length,0);validateEpisodicRisk(u.risk);const invalid=structuredClone(u.risk);invalid.estimatedFuture=0;assert.throws(()=>validateEpisodicRisk(invalid),/reserve-risk/);}
 const parent=founders[0],child=world.makeFly(parent.genome,[parent.id],1,0,[],100,100,30);assert.equal(child.brain.episodic.memory.seen,0);assert.equal(child.brain.episodic.lastUpdate,undefined);
});
