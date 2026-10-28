import test from 'node:test';
import assert from 'node:assert/strict';
import {createEpisodicMemory,chooseEpisodic,rememberEpisodic,restoreEpisodicMemory,inspectEpisodic,episodicFeatures} from '../learning/episodic.mjs';
import {installProjectionBasis} from '../learning/projection-actor.mjs';
import {World} from '../engine.mjs';
import {evaluateContext,evaluateContextSeed} from '../learning/context-tasks.mjs';

test('recent recall adapts to reversed outcomes while preserving an absent context and exact continuation',()=>{
 const a=Array(17).fill(0),b=Array(17).fill(0);a[1]=1;b[2]=1;
 const memory=createEpisodicMemory({capacity:64,replacement:'hybrid',recencyHalfLife:8},73);
 for(let i=0;i<256;i++)rememberEpisodic(memory,a,i%2?1:-1,i%2?1:-1);
 assert.equal(chooseEpisodic(memory,a),1);
 for(let i=0;i<128;i++)rememberEpisodic(memory,b,i%2?1:-1,i%2?-1:1);
 assert.equal(chooseEpisodic(memory,a),1);assert.equal(chooseEpisodic(memory,b),-1);
 for(let i=0;i<64;i++)rememberEpisodic(memory,a,i%2?1:-1,i%2?-1:1);
 assert.equal(chooseEpisodic(memory,a),-1);assert.equal(chooseEpisodic(memory,b),-1);
 assert.equal(memory.records.length,64);assert.deepEqual(memory.records.slice(0,16).map(r=>r.experience),Array.from({length:16},(_,i)=>memory.seen-15+i));
 assert.ok(memory.records.slice(16).some(r=>r.experience<=256));
 const copy=restoreEpisodicMemory(structuredClone(memory));
 for(let i=0;i<100;i++)for(const m of [memory,copy]){const action=chooseEpisodic(m,b,{sample:true});rememberEpisodic(m,b,action,-action);}
 assert.deepEqual(copy,memory);
 const broken=structuredClone(memory);broken.records[0].experience=1;assert.throws(()=>restoreEpisodicMemory(broken),/partition/);
 const missing=structuredClone(memory);delete missing.records[0].experience;assert.throws(()=>restoreEpisodicMemory(missing),/experience IDs/);
 assert.throws(()=>createEpisodicMemory({recencyHalfLife:-1}),/recencyHalfLife/);
 assert.throws(()=>createEpisodicMemory({recencyHalfLife:1e-300}),/recencyHalfLife/);
});

test('hybrid moving-body memory restores a partition in progress and charges bounded storage and recalls',()=>{
 const world=new World({seed:73,founders:4,controller:'episodic-actor',reproduction:false,ecology:'relocation',episodicParameters:{actuator:'move',moveMode:'levels',decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99,capacity:32,replacement:'hybrid',recencyHalfLife:16}});
 world.advance(333);const restored=World.restore(world.checkpoint());world.advance(211);restored.advance(211);assert.deepEqual(restored.checkpoint(),world.checkpoint());assert.ok(Math.abs(world.metrics().accountingError)<1e-6);
 for(const fly of world.flies){assert.equal(fly.brain.episodic.memory.records.length,32);assert.ok(fly.brain.episodic.lookupRecordsThisStep<=64);}
 const legacy=new World({seed:73,founders:2,controller:'episodic-actor',reproduction:false});legacy.advance(73);const saved=legacy.checkpoint();delete saved.world.config.episodicParameters.recencyHalfLife;for(const f of saved.world.flies)delete f.brain.episodic.memory.config.recencyHalfLife;
 const old=World.restore(saved);old.advance(40);legacy.advance(40);
 assert.deepEqual(old.flies.map(f=>({x:f.x,y:f.y,energy:f.energy,actions:f.lastActions})),legacy.flies.map(f=>({x:f.x,y:f.y,energy:f.energy,actions:f.lastActions})));
});

test('episodic memory stores only actual action/reward observations, stays bounded, and continues exactly after restore',()=>{
 const memory=createEpisodicMemory({capacity:16},73),features=Array(17).fill(0);features[1]=1;
 for(let i=0;i<40;i++){const action=chooseEpisodic(memory,features,{sample:true});rememberEpisodic(memory,features,action,action===-1?1:-1);}
 assert.equal(memory.records.length,16);assert.equal(memory.seen,40);assert.equal(chooseEpisodic(memory,features),-1);
 assert.deepEqual(Object.keys(memory.records[0]).sort(),['action','experience','features','reward']);
 const restored=restoreEpisodicMemory(JSON.parse(JSON.stringify(memory)));
 for(let i=0;i<100;i++)for(const copy of [memory,restored]){const action=chooseEpisodic(copy,features,{sample:true});rememberEpisodic(copy,features,action,action===-1?1:-1);}
 assert.deepEqual(restored,memory);
 const broken=structuredClone(memory);broken.rngState=0;assert.throws(()=>restoreEpisodicMemory(broken),/checkpoint/);
 assert.throws(()=>createEpisodicMemory({capacity:100000}),/configuration/);
});

test('local retrieval ignores nuisance clocks and mates while preserving delayed context-task behavior',()=>{
 const world=new World({seed:73,controller:'episodic-actor',episodicParameters:{featureMode:'local'},founders:2});world.advance(32);
 const fly=world.flies[0],before=episodicFeatures(fly.genome,fly.brain,'local'),brain=structuredClone(fly.brain);
 for(const channel of [4,5,6,7,8,9,14,15,16]){brain.activity[channel]=.9;for(const node of fly.genome.nodes.filter(node=>node.channel===channel))brain.activity[node.id]=-.9;}
 assert.deepEqual(episodicFeatures(fly.genome,brain,'local'),before);
 assert.notDeepEqual(episodicFeatures(fly.genome,brain,'mixed'),episodicFeatures(fly.genome,fly.brain,'mixed'));
 const parameters={traceRetention:.9920990378910495};
 const local=evaluateContextSeed(9171,parameters,undefined,{featureMode:'local'}),mixed=evaluateContextSeed(9171,parameters,undefined,{featureMode:'mixed'});
 assert.deepEqual(local.arms,mixed.arms);
 const restored=World.restore(world.checkpoint());world.advance(40);restored.advance(40);assert.deepEqual(restored.checkpoint(),world.checkpoint());
});
test('nonlinear feature installation is deterministic, leaves the donor unchanged and adds the declared topology',()=>{
 const donor=new World({controller:'trace-actor',founders:2}).flies[0].genome,saved=structuredClone(donor);
 const a=installProjectionBasis(donor,{count:8,seed:31}),b=installProjectionBasis(donor,{count:8,seed:31});
 assert.deepEqual(a,b);assert.deepEqual(donor,saved);assert.equal(a.nodes.length,donor.nodes.length+8);
 assert.equal(a.edges.length,donor.edges.length+8*(17+5));assert.throws(()=>installProjectionBasis(donor,{count:65}),/count/);
});
test('context benchmark is balanced and episodic outcomes depend on stored experience and remembered context',()=>{
 const report=evaluateContext([9171,9172],{learningScale:2,traceRetention:.994},undefined,{capacity:64});
 for(const row of report.rows){assert.equal(row.arms.frozen.afterMixed.combined,.5);assert.equal(row.arms.reset.afterMixed.combined,.5);assert.equal(row.arms.memoryReset.afterMixed.combined,.5);assert.ok(row.arms.learned.afterMixed.combined>.8);assert.ok(row.arms.learned.afterB.a>.8);assert.ok(row.arms.contextReset.afterMixed.combined<.65);assert.equal(row.arms.learned.storedExperiences,64);}
 assert.equal(report.protocol.cueTicks,1);
});
test('retrieval inspection and decision capture preserve all actions and learning outcomes',()=>{
 const a=evaluateContextSeed(9171,{traceRetention:.994},undefined,{capacity:64});
 const b=evaluateContextSeed(9171,{traceRetention:.994},undefined,{capacity:64},{captureLimit:8});
 assert.deepEqual(a.arms,b.arms);assert.equal(b.decisions.length,8);assert.ok(b.checkpoint.memory.records.some(record=>record.experience<=256));
 const memory=structuredClone(b.checkpoint.memory),before=structuredClone(memory);inspectEpisodic(memory,b.decisions[0].features);assert.deepEqual(memory,before);
});

test('decision snapshots preserve exploration and tie RNG streams and expose the actual retrieved records',()=>{
 const a=createEpisodicMemory({capacity:16},73),b=structuredClone(a),features=Array(17).fill(0);features[1]=1;
 const reasons=new Set();
 for(let i=0;i<160;i++){
  const expected=inspectEpisodic(b,features);let captured;
  const left=chooseEpisodic(a,features,{sample:true,randomTies:true}),right=chooseEpisodic(b,features,{sample:true,randomTies:true,capture:decision=>{captured=decision;}});
  assert.equal(right,left);assert.equal(captured.choice,right);assert.deepEqual(captured.retrieval,expected);reasons.add(captured.reason);
  for(const memory of [a,b])rememberEpisodic(memory,features,right,right===-1?1:-1);
  assert.deepEqual(a,b);
 }
 assert.ok(reasons.has('exploration'));assert.ok(reasons.has('retrieval'));
 let tied;chooseEpisodic(createEpisodicMemory(),features,{capture:decision=>{tied=decision;}});assert.equal(tied.reason,'tie');
});
