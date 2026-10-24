import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {INPUTS,OUTPUTS} from '../engine.mjs';
import {compactControllerView} from '../platform/controller-adapter.mjs';
import {createEpisodicMemory,rememberEpisodic,restoreEpisodicMemory} from '../learning/episodic.mjs';
import {JOINT_ACTIONS,jointFeatures,chooseJoint,inspectJoint} from '../learning/joint-episodic.mjs';
import {episodicActorStep,episodicBodyParameters,episodicEnergyCost} from '../learning/episodic-actor.mjs';
import {evaluateContext} from '../learning/context-tasks.mjs';

const params={actuator:'joint',returnMode:'td',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,turnGain:.25,discount:.5,decisionTicks:2,creditTicks:2,featureMode:'current',neuralLearning:false};
const target=value=>({kind:'td',observed:value,estimatedFuture:0,discountPower:.5,horizon:1,terminal:false});
test('joint memory keeps actual speed/turn pairs separate, stays bounded and samples all four choices reproducibly',()=>{
 const m=createEpisodicMemory({capacity:16,dimensions:18},73),features=Array(17).fill(0);features[16]=1;
 for(const a of JOINT_ACTIONS)rememberEpisodic(m,jointFeatures(features,a.speed),a.turn,(a.id+1)/10,target((a.id+1)/10));
 const before=structuredClone(m),r=inspectJoint(m,features);assert.deepEqual(m,before);assert.equal(chooseJoint(m,features).id,3);assert.equal(m.rngState,before.rngState);
 for(const o of r.options){assert.equal(o.neighbors.length,1);assert.equal(o.neighbors[0].features[17],o.speed);assert.equal(o.neighbors[0].action,o.turn);}
 const copy=restoreEpisodicMemory(structuredClone(m)),choices=new Set();for(let i=0;i<300;i++){const a=chooseJoint(m,features,{sample:true}),b=chooseJoint(copy,features,{sample:true});assert.deepEqual(a,b);choices.add(a.id);for(const mem of [m,copy])rememberEpisodic(mem,jointFeatures(features,a.speed),a.turn,.1,target(.1));}
 assert.equal(choices.size,4);assert.equal(m.records.length,16);assert.deepEqual(m,copy);
});
test('joint credit labels the executed pair, charges both action-conditioned queries and freezes both neural motor updates',()=>{
 const w=new World({seed:73,founders:2,controller:'episodic-actor',episodicParameters:params}),f=w.flies[0],s=f.brain.episodic,p=w.config.episodicParameters,features=Array(17).fill(0);features[16]=1;
 for(const a of JOINT_ACTIONS)rememberEpisodic(s.memory,jointFeatures(features,a.speed),a.turn,(a.id+1)/10,target((a.id+1)/10));
 const step=r=>episodicActorStep(f.genome,f.brain,features,r,true,w.config.actorParameters,p);const first=step(.9),chosen=s.choice;assert.equal(first[1],2*(JOINT_ACTIONS[chosen].speed<0?p.slowSpeed:p.fastSpeed)-1);step(.2);step(.4);
 const stored=s.memory.records.at(-1);assert.equal(stored.features[17],JOINT_ACTIONS[chosen].speed);assert.equal(stored.action,JOINT_ACTIONS[chosen].turn);assert.ok(Math.abs(stored.reward-.3)<1e-12);assert.equal(s.lookupRecordsThisStep,18);assert.equal(episodicEnergyCost(f.brain,p,.1),s.memory.records.length*p.memoryEnergyPerRecordSecond*.1+18*p.lookupEnergyPerRecord);
 f.genome.edges.forEach((e,i)=>{if([17,18].includes(e.to))assert.equal(f.brain.plastic[i],0);});
 assert.throws(()=>episodicBodyParameters({...params,reserveRisk:true}),/Joint control/);assert.throws(()=>episodicBodyParameters({...params,maxDistance:2}),/Joint control/);
});
test('joint worlds preserve founders, energy and exact continuation, reject cross-model state, and do not inherit acquired memory',()=>{
 const config={seed:73,founders:4,controller:'episodic-actor',reproduction:false,mutation:false,ecology:'relocation',episodicParameters:{...params,discount:.99,decisionTicks:8,creditTicks:8,featureMode:'local',neuralLearning:true}},w=new World(config),reference=new World({...config,controller:'trace-actor',episodicParameters:undefined});
 assert.deepEqual(w.flies.map(({brain,...f})=>f),reference.flies.map(({brain,...f})=>f));assert.equal(w.modelId(),'compact-joint-episodic-v7');World.restore(w.checkpoint());w.advance(237);const copy=World.restore(w.checkpoint());w.advance(300);copy.advance(300);assert.deepEqual(copy.checkpoint(),w.checkpoint());assert.ok(Math.abs(w.metrics().accountingError)<1e-7);
 assert.ok(w.flies.some(f=>f.brain.plastic.some(v=>v!==0)));for(const f of w.flies)f.genome.edges.forEach((e,i)=>{if([17,18].includes(e.to))assert.equal(f.brain.plastic[i],0);});
 const saved=w.checkpoint(),view=compactControllerView(w.inspect(w.flies[0].id),{inputs:INPUTS,outputs:OUTPUTS});assert.equal(view.model,'compact-joint-episodic');assert.equal(view.episodic.lastDecision.retrieval.options.length,4);view.episodic.lastDecision.retrieval.options[0].neighbors.length=0;assert.deepEqual(w.checkpoint(),saved);
 const off=new World({...config,learning:false});off.advance(100);assert.ok(off.flies.every(f=>f.brain.episodic.memory.seen===0&&f.brain.episodic.pending.length===0));
 const wrong=w.checkpoint();wrong.model='compact-episodic-actor-v6';assert.throws(()=>World.restore(wrong),/Joint controller model/);
 const bad=w.checkpoint();bad.world.flies[0].brain.episodic.memory.records[0].features[17]=0;assert.throws(()=>World.restore(bad),/joint action tag/);
 const turn=w.checkpoint();turn.world.config.episodicParameters.turnGain=.1;assert.throws(()=>World.restore(turn),/joint actor state/);
 const founders=[...w.flies];for(const f of founders)f.age=f.genome.traits.lifespan;w.step();assert.equal(w.flies.length,0);for(const f of founders){assert.equal(f.brain.episodic.lastUpdate.target.terminal,true);assert.equal(f.brain.episodic.lastUpdate.target.estimatedFuture,0);assert.equal(f.brain.episodic.pending.length,0);}
 const child=w.makeFly(founders[0].genome,[founders[0].id],1,0,[],100,100,30);assert.equal(child.brain.episodic.memory.seen,0);assert.equal(child.brain.episodic.choice,null);
});
test('conflicting-context component actually exercises the four-choice memory domain and retained acquired records',()=>{
 const report=evaluateContext([9171,9172],{traceRetention:.994},undefined,{capacity:128,featureMode:'local',joint:true});assert.equal(report.protocol.actionCount,4);assert.equal(report.protocol.featureDimensions,18);
 for(const row of report.rows){assert.equal(row.arms.frozen.afterMixed.combined,.5);assert.ok(row.arms.learned.afterB.a>.8);assert.ok(row.arms.learned.afterB.b>.8);assert.equal(row.arms.learned.storedExperiences,128);}
});
