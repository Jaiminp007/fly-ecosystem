import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AutonomyService} from '../platform/autonomy.mjs';
import {proposeParameters,passesGate} from '../learning/curriculum.mjs';
import {actorParameters,ACTOR_BOUNDS} from '../learning/trace-actor.mjs';
import {RNG,World} from '../engine.mjs';
const waitFor=async fn=>{const until=Date.now()+15000;while(!await fn()){if(Date.now()>until)throw Error('Autonomy service condition timed out');await new Promise(resolve=>setTimeout(resolve,50));}};

test('autonomous campaigns run in a child, checkpoint and resume without replacing the campaign',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'afterwing-autonomy-')),service=new AutonomyService(directory);
 t.after(async()=>{await service.close();await rm(directory,{recursive:true,force:true});});
 assert.equal((await service.status()).status,'not-started');
 await assert.rejects(service.control({action:'start',rounds:1000}),/Rounds/);
 await service.control({action:'start',rounds:1});await waitFor(async()=>!(await service.status()).running);
 const first=await service.status();assert.equal(first.status,'round-budget-reached',first.error);assert.equal(first.round,1);assert.equal(first.stage,1);
 await service.control({action:'start',rounds:1});await waitFor(async()=>!(await service.status()).running);
 const second=await service.status();assert.equal(second.id,first.id);assert.equal(second.round,2);assert.equal(second.stage,2);
 const checkpoint=JSON.parse(await readFile(join(directory,'state.json'),'utf8'));assert.equal(checkpoint.history.length,2);assert.ok(checkpoint.sourceSha256['learning/trace-actor.mjs']);assert.ok(checkpoint.sourceSha256['scripts/atomic-json.mjs']);
});

test('bounded proposals preserve parameters unidentifiable in the cue task and gates reject uncertain learning',()=>{
 const params=actorParameters(),rng=new RNG(11);
 for(let i=0;i<50;i++){const proposal=proposeParameters(params,rng,.8);for(const[key,[min,max]]of Object.entries(ACTOR_BOUNDS))if(proposal[key]!==undefined)assert.ok(proposal[key]>=min&&proposal[key]<=max);assert.equal(proposal.exploration,params.exploration);assert.equal(proposal.eligibilityDecay,params.eligibilityDecay);assert.equal(proposal.traceNormalization,undefined);}
 assert.equal(proposeParameters({...params,traceNormalization:1},rng,.8).traceNormalization,1);
 assert.equal(passesGate({summary:{learned:{ci95:[.8,.99]},learnedMinusfrozen:{ci95:[.3,.5]},'learnedMinusmemory-reset':{ci95:[.3,.5]}}}),false);
});

test('reproduction can be disabled to isolate within-life learning without reseeding or mutation',()=>{
 const world=new World({founders:2,reproduction:false,mutation:false});for(const fly of world.flies){fly.x=180;fly.y=180;fly.age=40;fly.energy=100;}
 world.initialEnergy=world.energy();world.advance(10);assert.equal(world.totals.births,0);assert.equal(world.flies.length,2);assert.ok(Math.abs(world.metrics().accountingError)<1e-7);
});
