import test from 'node:test';
import assert from 'node:assert/strict';
import {World,RNG,inherit,INPUTS} from '../engine.mjs';
import {actorParameters,installActorGenome,createActorBrain,observeActor,actActor,learnActor} from '../learning/trace-actor.mjs';
import {evaluateSeeds,TASK_STAGES} from '../learning/tasks.mjs';

test('actor feedback increases the probability of a rewarded sampled choice; disabled learning preserves weights',()=>{
 const original=new World({founders:2}).flies[0].genome,g=installActorGenome(original,{scaffold:false}),a=createActorBrain(g,17),b=structuredClone(a);
 const input=Array(INPUTS.length).fill(0);input[1]=1;
 observeActor(g,a,input);observeActor(g,b,input);
 const action=actActor(g,a,{mode:'binary',channels:[0]})[0];actActor(g,b,{mode:'binary',channels:[0]});
 learnActor(g,a,1,true);learnActor(g,b,1,false);
 actActor(g,a,{mode:'binary',sample:false});
 assert.ok(a.actor.lastMeans[0]*action>0);assert.ok(b.plastic.every(value=>value===0));
});

test('trace actor continuation, stochastic exploration and learning survive exact checkpoints',()=>{
 const a=new World({controller:'trace-actor',founders:6,seed:73});a.advance(120);
 const b=World.restore(JSON.parse(JSON.stringify(a.checkpoint())));a.advance(120);b.advance(120);
 assert.deepEqual(a.checkpoint(),b.checkpoint());assert.ok(Math.abs(a.metrics().accountingError)<1e-6);
 const brokenMemory=a.checkpoint();brokenMemory.world.flies[0].genome.edges[0].w=.5;assert.throws(()=>World.restore(brokenMemory),/memory connections/);
 const invalid=a.checkpoint();invalid.world.flies[0].brain.actor.rngState=0;assert.throws(()=>World.restore(invalid),/actor state/);
});

test('actor descendants preserve controller identity and memory topology while acquired state starts fresh',()=>{
 const world=new World({controller:'trace-actor',founders:2,seed:37}),parent=world.flies[0];
 let genome=parent.genome,innovation=world.nextNode;const rng=new RNG(19);
 for(let i=0;i<80;i++)genome=inherit(genome,genome,rng,()=>innovation++,true).genome;
 assert.equal(genome.actor.version,1);assert.equal(genome.nodes.filter(node=>node.memory).length,INPUTS.length*2);
 const brain=createActorBrain(genome,71);assert.ok(brain.plastic.every(value=>value===0));assert.ok(Object.values(brain.activity).every(value=>value===0));
 assert.throws(()=>actorParameters({traceRetention:1.01}),/Invalid actor parameter/);
 assert.throws(()=>new World({controller:'trace-actor',actorParameters:{arbitraryCode:'no'}}),/Unknown actor parameter/);
});

test('unknown cue associations generalize across delays and collapse under acquired-state or cue-memory resets',()=>{
 const result=evaluateSeeds(Array.from({length:10},(_,i)=>400+i),TASK_STAGES[1]);
 assert.ok(result.summary.learned.mean>.85);
 assert.ok(result.summary.learnedMinusfrozen.ci95[0]>.2);
 assert.ok(result.summary.learnedMinusreset.ci95[0]>.2);
 assert.ok(result.summary['learnedMinusmemory-reset'].ci95[0]>.2);
});

test('motor plasticity routing changes selected readouts while preserving inherited outputs',()=>{
 const base=new World({founders:2}).flies[0].genome,g=installActorGenome(base,{scaffold:false}),brain=createActorBrain(g,73),params=actorParameters({plasticOutputs:1});
 observeActor(g,brain,Array(INPUTS.length).fill(.5),params);actActor(g,brain,{parameters:params});learnActor(g,brain,1,true,params);
 assert.ok(g.edges.some((edge,i)=>edge.to===17&&brain.plastic[i]!==0));
 assert.ok(g.edges.every((edge,i)=>edge.to<18||edge.to>=22||brain.plastic[i]===0));
 assert.throws(()=>actorParameters({plasticOutputs:1.5}),/Invalid actor parameter/);
 assert.throws(()=>actorParameters({plasticOutputs:32}),/Invalid actor parameter/);
});
