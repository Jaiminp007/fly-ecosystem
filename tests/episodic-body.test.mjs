import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {episodicBodyParameters,episodicEnergyCost} from '../learning/episodic-actor.mjs';
import {episodicActorStep} from '../learning/episodic-actor.mjs';
import {compactControllerView} from '../platform/controller-adapter.mjs';
import {INPUTS,OUTPUTS} from '../engine.mjs';
import {rememberEpisodic} from '../learning/episodic.mjs';

test('episodic body initialization preserves matched founders and uses a distinct model label',()=>{
 const a=new World({seed:73,founders:4,controller:'trace-actor'}),b=new World({seed:73,founders:4,controller:'episodic-actor'});
 const physical=world=>world.flies.map(({brain,...fly})=>fly);
 assert.deepEqual(physical(a),physical(b));assert.equal(b.modelId(),'compact-episodic-actor-v6');
 assert.throws(()=>episodicBodyParameters({creditTicks:1000}),/creditTicks/);
 assert.throws(()=>new World({episodicParameters:{capacity:64}}),/require episodic/);
});

test('credit windows store only rewards following their chosen action and end at the next aligned decision',()=>{
 const world=new World({seed:73,founders:2,controller:'episodic-actor',episodicParameters:{decisionTicks:4,creditTicks:4,discount:.5}}),fly=world.flies[0],p=world.config.episodicParameters;
 const step=reward=>episodicActorStep(fly.genome,fly.brain,Array(17).fill(0),reward,true,world.config.actorParameters,p);
 step(1);const chosen=fly.brain.episodic.choice;
 assert.equal(fly.brain.episodic.memory.seen,0);
 for(const reward of [.1,.2,.3])step(reward);
 assert.equal(fly.brain.episodic.memory.seen,0);step(.4);
 const state=fly.brain.episodic,record=state.memory.records[0];
 assert.equal(record.action,chosen);assert.ok(Math.abs(record.reward-(.1+.5*.2+.25*.3+.125*.4)/(1+.5+.25+.125))<1e-12);
 assert.equal(state.pending.length,1);assert.equal(state.pending[0].elapsed,0);assert.equal(state.lastDecision.step,5);
});

test('controller inspection exposes saved decision-time retrieval without changing checkpoint state',()=>{
 const world=new World({seed:73,founders:2,controller:'episodic-actor',reproduction:false});world.advance(101);
 const saved=world.checkpoint(),fly=world.flies[0],view=compactControllerView(world.inspect(fly.id),{inputs:INPUTS,outputs:OUTPUTS});
 assert.deepEqual(view.episodic.lastDecision,fly.brain.episodic.lastDecision);assert.ok(view.episodic.lastDecision.retrieval.seen>0);
 view.episodic.lastDecision.features[0]=999;assert.deepEqual(world.checkpoint(),saved);
 const invalid=structuredClone(saved);invalid.world.flies[0].brain.episodic.lastDecision.step+=100;assert.throws(()=>World.restore(invalid),/episodic decision/);
 const legacy=structuredClone(saved);for(const fly of legacy.world.flies)delete fly.brain.episodic.lastDecision;
 const restored=World.restore(legacy);restored.advance(4);assert.ok(restored.flies[0].brain.episodic.lastDecision);
});
test('episodic steering learns bounded actual outcomes, accounts energy and restores exact continued behavior',()=>{
 const a=new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false});a.advance(237);
 const b=World.restore(JSON.parse(JSON.stringify(a.checkpoint())));
 a.advance(300);b.advance(300);assert.deepEqual(a.checkpoint(),b.checkpoint());
 assert.ok(Math.abs(a.metrics().accountingError)<1e-7);
 for(const fly of a.flies){const state=fly.brain.episodic;assert.ok(state.memory.seen>0);assert.ok(state.memory.records.length<=a.config.episodicParameters.capacity);assert.ok(episodicEnergyCost(fly.brain,a.config.episodicParameters,.1)>0);assert.equal(fly.brain.actor.steps,state.steps);assert.ok(state.memory.records.every(record=>record.features.length===17&&[-1,1].includes(record.action)&&Math.abs(record.reward)<=1));}
});
test('learning-disabled body controls acquire no neural or episodic state',()=>{
 const world=new World({seed:73,founders:4,controller:'episodic-actor',learning:false,reproduction:false});world.advance(400);
 for(const fly of world.flies){assert.equal(fly.brain.episodic.memory.seen,0);assert.equal(fly.brain.episodic.pending.length,0);assert.ok(fly.brain.plastic.every(value=>value===0));}
});
test('children start with fresh episodic memory and malformed/unlabelled checkpoints are rejected',()=>{
 const world=new World({seed:73,founders:2,controller:'episodic-actor',reproduction:false});world.advance(100);
 const parent=world.flies[0],child=world.makeFly(parent.genome,world.flies.map(fly=>fly.id),1,0,[],100,100,30);
 assert.ok(parent.brain.episodic.memory.seen>0);assert.equal(child.brain.episodic.memory.seen,0);assert.equal(child.brain.episodic.pending.length,0);assert.ok(child.brain.plastic.every(value=>value===0));
 const invalid=world.checkpoint();invalid.world.flies[0].brain.episodic.pending[0].elapsed=1000;assert.throws(()=>World.restore(invalid),/credit queue/);
 const wrong=world.checkpoint();wrong.model='compact-trace-actor-v5';wrong.world.config.controller='trace-actor';delete wrong.world.config.episodicParameters;assert.throws(()=>World.restore(wrong),/Unlabelled/);
});

test('speed memory executes bounded movement corrections with fixed steering and preserves exact continuation',()=>{
 const world=new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false,episodicParameters:{actuator:'move',moveGain:2,decisionTicks:8,creditTicks:8}});world.advance(237);
 const restored=World.restore(JSON.parse(JSON.stringify(world.checkpoint())));world.advance(200);restored.advance(200);assert.deepEqual(world.checkpoint(),restored.checkpoint());
 assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
 for(const fly of world.flies){
  const state=fly.brain.episodic;assert.ok(state.memory.seen>0);assert.equal(state.actuator,'move');assert.equal(state.lastDecision.actuator,'move');assert.equal(fly.lastActions[1],state.choice);assert.equal(fly.brain.activity[18],fly.lastActions[1]);
  fly.genome.edges.forEach((edge,index)=>{if([17,18].includes(edge.to))assert.equal(fly.brain.plastic[index],0);});
  const view=compactControllerView(world.inspect(fly.id),{inputs:INPUTS,outputs:OUTPUTS});assert.equal(view.episodic.actuator,'move');assert.equal(view.episodic.turnCorrection,0);assert.equal(view.episodic.correction,state.lastCorrection);
 }
 const wrong=world.checkpoint();wrong.world.config.episodicParameters.actuator='turn';assert.throws(()=>World.restore(wrong),/actuator/);
 assert.throws(()=>episodicBodyParameters({actuator:'eat'}),/actuator/);assert.throws(()=>episodicBodyParameters({moveGain:3}),/moveGain/);assert.throws(()=>episodicBodyParameters({memoryLearning:0}),/memoryLearning/);
});

test('neural and episodic acquisition can be ablated independently without changing inherited founders',()=>{
 const create=parameters=>new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false,episodicParameters:{actuator:'move',...parameters}});
 const memoryOff=create({memoryLearning:false}),neuralOff=create({neuralLearning:false});
 assert.deepEqual(memoryOff.flies.map(({brain,...fly})=>fly),neuralOff.flies.map(({brain,...fly})=>fly));
 memoryOff.advance(100);neuralOff.advance(100);
 assert.ok(memoryOff.flies.some(fly=>fly.brain.plastic.some(value=>value!==0)));
 for(const fly of memoryOff.flies){assert.equal(fly.brain.episodic.memory.seen,0);assert.equal(fly.brain.episodic.pending.length,0);}
 for(const fly of neuralOff.flies){assert.ok(fly.brain.episodic.memory.seen>0);assert.ok(fly.brain.plastic.every(value=>value===0));}
 const legacy=new World({seed:73,founders:2,controller:'episodic-actor'});legacy.advance(73);const saved=legacy.checkpoint();
 for(const key of ['actuator','moveGain','memoryLearning','neuralLearning','returnMode','moveMode','slowSpeed','fastSpeed'])delete saved.world.config.episodicParameters[key];
 for(const fly of saved.world.flies){delete fly.brain.episodic.actuator;delete fly.brain.episodic.returnMode;delete fly.brain.episodic.moveMode;delete fly.brain.episodic.lastDecision.actuator;delete fly.brain.episodic.lastDecision.returnMode;delete fly.brain.episodic.lastDecision.moveMode;}
 const copy=World.restore(saved);copy.advance(100);legacy.advance(100);
 assert.deepEqual(copy.flies.map(fly=>fly.lastActions),legacy.flies.map(fly=>fly.lastActions));assert.deepEqual(copy.metrics(),legacy.metrics());
});

test('value targets separate observed transitions from the next-state value and charge both retrievals',()=>{
 const world=new World({seed:73,founders:2,controller:'episodic-actor',episodicParameters:{returnMode:'td',discount:.5,decisionTicks:2,creditTicks:2,featureMode:'current',neuralLearning:false}}),fly=world.flies[0],p=world.config.episodicParameters;
 const features=Array(17).fill(0);features[16]=1;
 for(const [action,value]of [[-1,.25],[1,.5]])rememberEpisodic(fly.brain.episodic.memory,features,action,value,{kind:'td',observed:value,estimatedFuture:0,discountPower:.5,horizon:1,terminal:false});
 const step=reward=>episodicActorStep(fly.genome,fly.brain,features,reward,true,world.config.actorParameters,p);
 step(.9);const action=fly.brain.episodic.choice;step(.2);assert.equal(fly.brain.episodic.memory.seen,2);step(.4);
 const state=fly.brain.episodic,update=state.lastUpdate;
 assert.equal(update.action,action);assert.equal(update.step,3);
 assert.ok(Math.abs(update.target.observed-.2)<1e-12);assert.ok(Math.abs(update.target.estimatedFuture-.125)<1e-12);assert.ok(Math.abs(update.value-.325)<1e-12);
 assert.equal(update.target.horizon,2);assert.equal(update.target.discountPower,.25);assert.equal(update.target.terminal,false);
 assert.equal(state.lookupRecordsThisStep,5);assert.equal(state.memory.seen,3);assert.deepEqual(state.memory.records[2].target,update.target);
 assert.throws(()=>episodicBodyParameters({returnMode:'td'}),/aligned/);assert.throws(()=>episodicBodyParameters({returnMode:'td',decisionTicks:4,creditTicks:4,discount:1}),/discount/);
});

test('value-learning worlds continue exactly and reject unlabelled or inconsistent target values',()=>{
 const world=new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false,episodicParameters:{actuator:'move',returnMode:'td',discount:.99,decisionTicks:8,creditTicks:8}});world.advance(237);
 const restored=World.restore(JSON.parse(JSON.stringify(world.checkpoint())));world.advance(300);restored.advance(300);assert.deepEqual(world.checkpoint(),restored.checkpoint());assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
 for(const fly of world.flies){assert.ok(fly.brain.episodic.memory.records.length>0);assert.ok(fly.brain.episodic.memory.records.every(record=>record.target.kind==='td'&&Math.abs(record.reward)<=1));}
 const invalid=world.checkpoint();invalid.world.flies[0].brain.episodic.memory.records[0].target.observed=2;assert.throws(()=>World.restore(invalid),/value target/);
 const wrong=world.checkpoint();wrong.world.config.episodicParameters.returnMode='mean';assert.throws(()=>World.restore(wrong));
 const missing=world.checkpoint();delete missing.world.flies[0].brain.episodic.memory.records[0].target;assert.throws(()=>World.restore(missing),/return mode/);
 const badUpdate=world.checkpoint();badUpdate.world.flies[0].brain.episodic.lastUpdate.value=1;assert.throws(()=>World.restore(badUpdate),/value target/);
});

test('death records a final transition with no estimated future and does not transfer acquired targets',()=>{
 const world=new World({seed:73,founders:2,controller:'episodic-actor',reproduction:false,episodicParameters:{actuator:'move',returnMode:'td',discount:.99,decisionTicks:8,creditTicks:8}});world.advance(3);
 const founders=[...world.flies];for(const fly of founders)fly.age=fly.genome.traits.lifespan;world.step();assert.equal(world.flies.length,0);assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
 for(const fly of founders){const state=fly.brain.episodic;assert.equal(state.pending.length,0);assert.equal(state.lastUpdate.target.terminal,true);assert.equal(state.lastUpdate.target.estimatedFuture,0);assert.equal(state.lastUpdate.target.horizon,4);assert.equal(state.memory.records.at(-1).target.terminal,true);}
 const parent=founders[0],child=world.makeFly(parent.genome,[parent.id],1,0,[],100,100,30);assert.equal(child.brain.episodic.memory.seen,0);assert.equal(child.brain.episodic.lastUpdate,undefined);
});

test('cruising choices change executed motor levels while preserving founders, accounting and exact continuation',()=>{
 const config={seed:73,founders:4,controller:'episodic-actor',reproduction:false,episodicParameters:{actuator:'move',moveMode:'levels',slowSpeed:.2,fastSpeed:.6,decisionTicks:8,creditTicks:8}};
 const world=new World(config),control=new World({...config,episodicParameters:{...config.episodicParameters,memoryLearning:false}});
 assert.deepEqual(world.flies.map(({brain,...fly})=>fly),control.flies.map(({brain,...fly})=>fly));
 const choices=new Set();for(let tick=0;tick<80;tick++){world.step();for(const fly of world.flies){choices.add(Math.round((fly.lastActions[1]+1)*50));assert.equal(fly.brain.activity[18],fly.lastActions[1]);}}
 assert.deepEqual([...choices].sort((a,b)=>a-b),[20,60]);
 const restored=World.restore(world.checkpoint());world.advance(200);restored.advance(200);assert.deepEqual(world.checkpoint(),restored.checkpoint());assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
 const view=compactControllerView(world.inspect(world.flies[0].id),{inputs:INPUTS,outputs:OUTPUTS});assert.equal(view.episodic.moveMode,'levels');assert.deepEqual(view.episodic.speedLevels,[.2,.6]);
 const wrong=world.checkpoint();wrong.world.config.episodicParameters.fastSpeed=.7;assert.throws(()=>World.restore(wrong),/movement mode/);
 assert.throws(()=>episodicBodyParameters({moveMode:'levels'}),/movement mode/);assert.throws(()=>episodicBodyParameters({slowSpeed:.6,fastSpeed:.2}),/speed levels/);assert.throws(()=>episodicBodyParameters({fastSpeed:2}),/speed levels/);
});
