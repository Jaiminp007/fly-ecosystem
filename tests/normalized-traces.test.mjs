import test from 'node:test';
import assert from 'node:assert/strict';
import {World,RNG,inherit,INPUTS,OUTPUTS} from '../engine.mjs';
import {actorParameters,observeActor,createActorBrain} from '../learning/trace-actor.mjs';
import {compactControllerView} from '../platform/controller-adapter.mjs';

test('normalized traces retain changes in sustained inputs and follow the declared exponential average',()=>{
  const parameters=actorParameters({traceNormalization:1,traceRetention:.99}),world=new World({founders:2,controller:'trace-actor',actorParameters:parameters}),fly=world.flies[0],brain=createActorBrain(fly.genome,73),input=Array(17).fill(0);input[1]=.5;
  for(let i=0;i<100;i++)observeActor(fly.genome,brain,input,parameters);
  for(const kind of ['fast','slow']){const node=fly.genome.nodes.find(n=>n.memory===kind&&n.channel===1),retention=kind==='fast'?.8:parameters.traceRetention,expected=.5*(1-retention**100),copy=structuredClone(brain);assert.ok(Math.abs(copy.activity[node.id]-expected)<1e-12);assert.ok(copy.activity[node.id]<.5);const old=copy.activity[node.id];input[1]=.25;observeActor(fly.genome,copy,input,parameters);assert.ok(Math.abs(copy.activity[node.id]-(retention*old+(1-retention)*.25))<1e-12);input[1]=.5;}
});

test('normalized trace identity, weights and acquired state survive exact checkpoints and offspring inheritance',()=>{
  const world=new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false,ecology:'relocation',actorParameters:{traceNormalization:1},episodicParameters:{actuator:'move',returnMode:'td',decisionTicks:8,creditTicks:8,discount:.99,moveMode:'levels'}});world.advance(901);const restored=World.restore(JSON.parse(JSON.stringify(world.checkpoint())));world.advance(300);restored.advance(300);assert.deepEqual(world.checkpoint(),restored.checkpoint());assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
  const parent=world.flies[0];let next=world.nextNode;const genome=inherit(parent.genome,parent.genome,new RNG(37),()=>next++,true).genome,child=world.makeFly(genome,[parent.id],1,0,[],100,100,30);assert.equal(genome.actor.traceNormalization,1);assert.equal(child.brain.actor.traceNormalization,1);assert.ok(Object.values(child.brain.activity).every(x=>x===0));assert.ok(child.brain.plastic.every(x=>x===0));assert.equal(child.brain.episodic.memory.seen,0);
  assert.equal(compactControllerView(world.inspect(parent.id),{inputs:INPUTS,outputs:OUTPUTS}).controller.traceNormalization,1);
  for(const mutate of [c=>{delete c.world.config.actorParameters.traceNormalization;},c=>{delete c.world.flies[0].genome.actor.traceNormalization;},c=>{delete c.world.flies[0].brain.actor.traceNormalization;},c=>{const f=c.world.flies[0],node=f.genome.nodes.find(n=>n.memory==='slow');f.genome.edges.find(e=>e.to===node.id&&e.from===node.channel).w=1;}]){const invalid=world.checkpoint();mutate(invalid);assert.throws(()=>World.restore(invalid),/trace normalization|memory connections/);}
});

test('explicitly disabled normalization is byte-identical to the legacy controller; invalid settings are rejected',()=>{
  const config={seed:73,founders:4,controller:'trace-actor',reproduction:false},a=new World(config),b=new World({...config,actorParameters:{traceNormalization:0}});a.advance(400);b.advance(400);assert.deepEqual(a.checkpoint(),b.checkpoint());
  for(const traceNormalization of [-1,.5,2,true,null,NaN])assert.throws(()=>actorParameters({traceNormalization}),/traceNormalization/);
});
