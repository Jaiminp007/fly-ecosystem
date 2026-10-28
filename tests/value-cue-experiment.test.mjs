import test from 'node:test';
import assert from 'node:assert/strict';
import {digest} from '../learning/intervention-study.mjs';
import {TickCueExperiment} from '../learning/tick-cue-experiment.mjs';
import {ValueCueExperiment,VALUE_CUE_ARMS,VALUE_CUE_PROBES,runValueCueProbe} from '../learning/value-cue-experiment.mjs';
const history={seed:251101,cueSeed:251102,resourceSeeds:[251103,251104,251105,251106],shuffleSeed:251107,nullSeed:251108};
const reference={founders:2,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}};
const pricing={operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)};
const config=(arm,emit=()=>{})=>({history,reference,pricing,arm,emit});
function quiet(run){
  for(const [index,fly]of run.world.flies.entries()){Object.assign(fly,{energy:120,x:100+400*index,y:100,age:0});Object.assign(fly.genome.traits,{speed:0,metabolism:0,lifespan:1000});}
  for(const patch of run.world.food)Object.assign(patch,{amount:0,regrowth:0});run.world.initialEnergy=run.world.energy();run.startingEnergy=240;return run;
}
test('seventeen arms share lawful bodies; actual contact work is charged only where computed and fixed controls have no unused learner',()=>{
  const runs=VALUE_CUE_ARMS.map(arm=>new ValueCueExperiment(config(arm))),matched=runs.filter(r=>!['incumbent','nullCandidate','nullBlind'].includes(r.arm));
  assert.equal(new Set(matched.map(r=>digest(r.world.checkpoint()))).size,1);
  for(const run of runs){
    const events=[];run.emit=e=>events.push(e);run.advance(2);
    assert.equal(run.world.config.learning,run.arm==='incumbent');
    for(const event of events.filter(e=>e.type==='decision')){
      const query=!['originalValue','originalActor','acceptCruise','refuseCruise','acceptStationary','refuseStationary','random'].includes(run.arm);
      if(query)assert.ok(event.contactOperations>=6*run.world.food.length);else assert.equal(event.contactOperations,0);
      assert.ok(event.requestedExtra>0);
    }
    if(run.program==='fixed')for(const s of Object.values(run.learners)){assert.equal(Object.hasOwn(s,'weights'),false);assert.equal(Object.hasOwn(s,'recent'),false);}
    if(run.program==='value')for(const s of Object.values(run.learners))assert.equal(s.config.lambda,run.arm==='lambda0'?0:.9);
  }
});
test('every main arm cold-continues exactly with private policies, joint storage/debt and cloned observers',()=>{
  for(const arm of VALUE_CUE_ARMS){
    const events=[],run=quiet(new ValueCueExperiment(config(arm,e=>events.push(e))));run.advance(3);
    const twinEvents=[],twin=ValueCueExperiment.restore(run.checkpoint(),e=>twinEvents.push(e));events.length=0;
    run.advance(4);twin.advance(4);assert.deepEqual(twin.checkpoint(),run.checkpoint(),arm);assert.deepEqual(twinEvents,events,arm);
    for(const state of Object.values(run.learners))assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy)<1e-8);
  }
  const normal=quiet(new ValueCueExperiment(config('candidate'))),attacked=ValueCueExperiment.restore(normal.checkpoint(),event=>{
    if(event.own?.raw)event.own.raw.fill(999);if(event.own?.observation)event.own.observation.fill(999);if(event.selectedCue)event.selectedCue.fill(999);
    if(event.record?.phi)event.record.phi.fill(999);if(event.outputs)event.outputs.fill(999);
  });normal.advance(4);attacked.advance(4);assert.deepEqual(attacked.checkpoint(),normal.checkpoint());
});
test('original-observation actor control preserves the previously audited actor physics, RNG and complete learner continuation',()=>{
  const original=new TickCueExperiment(config('candidate')),control=new ValueCueExperiment(config('originalActor'));
  assert.deepEqual(control.world.checkpoint(),original.world.checkpoint());
  for(let tick=1;tick<=12;tick++){original.step();control.step();assert.deepEqual(control.world.checkpoint(),original.world.checkpoint());assert.deepEqual(control.learners,original.learners);}
});
test('contact query selects the low local odor without exposing amount/valence and bills its actual operations',()=>{
  const events=[],run=quiet(new ValueCueExperiment(config('candidate',e=>events.push(e))));
  Object.assign(run.world.food[0],{x:100,y:100,amount:.01,cueId:1,cue:[1,-1,1,-1],valence:1});
  Object.assign(run.world.food[1],{x:130,y:100,amount:.8,cueId:2,cue:[-1,1,-1,1],valence:-1});run.world.initialEnergy=run.world.energy();
  run.step();const event=events.find(e=>e.type==='decision'&&e.own.agentId===1);
  assert.deepEqual(event.nativeSourceCue,[-1,1,-1,1]);assert.deepEqual(event.selectedCue,[1,-1,1,-1]);assert.equal(event.own.observation[0],1);
  assert.ok(event.contactOperations>=6*run.world.food.length);assert.ok(!Object.hasOwn(event.own,'valence')&&!Object.hasOwn(event.own,'patchId'));
});
test('phase snapshots, freeze and reset preserve physical inventory and streams; all fifteen frozen probes share common no-refill bodies',()=>{
  for(const arm of ['candidate','frozen','reset']){
    const run=quiet(new ValueCueExperiment(config(arm)));run.advance(512);assert.ok(run.savedModels.A);
    const before=run.checkpoint(),energy=run.world.energy();run.enterNextPhase();assert.equal(run.world.energy(),energy);assert.deepEqual(run.world.flies,before.world.world.flies);
    for(const [id,s]of Object.entries(run.learners)){
      assert.equal(s.rngState,before.state.learners[id].rngState);
      if(arm==='frozen')assert.equal(s.acquisition,false);
      if(arm==='reset'){assert.ok(s.weights.flat().every(v=>v===0));assert.equal(s.acquiredTransitions,0);assert.equal(s.recent.length,0);}
    }
    run.advance(1024);assert.ok(run.savedModels.B);
    const twin=ValueCueExperiment.restore(run.checkpoint());run.advance(2);twin.advance(2);assert.deepEqual(twin.checkpoint(),run.checkpoint());
    if(arm==='candidate'){
      assert.ok(run.atC);const source=digest(run.atC),starts={};
      for(const spec of VALUE_CUE_PROBES){
        const events=[],probe=runValueCueProbe(run.atC,spec,251109,2,{ticks:3,emit:e=>events.push(e)});
        assert.ok(probe.acquisitionDisabled&&probe.learnedWeightsUnchanged&&probe.inferenceOnlyCompaction);assert.equal(probe.resetInitializationOperations,0);
        const start=events[0];if(starts[spec.family])assert.deepEqual(start.world,starts[spec.family]);starts[spec.family]=start.world;
        for(const state of Object.values(start.learners))if(state.kind==='own-tick-linear-value'){assert.equal(state.recent.length,0);assert.equal(state.older.length,0);assert.equal(state.previous,null);}
        if(spec.family==='transfer')for(const e of events.filter(e=>e.type==='decision')){assert.equal(e.contactOperations,0);assert.deepEqual(e.selectedCue,[0,0,0,0]);}
        assert.equal(digest(run.atC),source);
      }
    }
  }
});
test('complete/partial deaths retain all founders and unpaid terminal work; restoration rejects foreign identities, unused circuits and malformed snapshots',()=>{
  const partial=quiet(new ValueCueExperiment(config('candidate')));partial.world.flies[0].genome.traits.lifespan=.01;partial.advance(2);
  assert.equal(partial.world.flies.length,1);assert.equal(partial.endpoint().founders,2);assert.equal(partial.learners[1].dead,true);assert.ok(partial.learners[1].charge.outstandingEnergy>0);
  const debt=Object.values(partial.learners).reduce((n,s)=>n+s.charge.outstandingEnergy,0);
  for(const version of ['C','reset','accept','acceptStationary']){
    const events=[],probe=runValueCueProbe(partial.checkpoint(),{family:'transfer',version},251110,2,{ticks:2,emit:e=>events.push(e)});
    assert.equal(probe.founders,2);assert.equal(events[0].startingDebt,debt);assert.equal(events[0].learners[1].dead,true);
  }
  const extinct=quiet(new ValueCueExperiment(config('candidate')));for(const fly of extinct.world.flies)fly.genome.traits.lifespan=.01;extinct.advance(1);
  const end=extinct.endpoint(),probe=runValueCueProbe(extinct.checkpoint(),{family:'transfer',version:'C'},251111,2,{ticks:2});
  assert.equal(probe.survivors,0);assert.equal(probe.value,0);assert.equal(probe.endpoint.outstandingEnergy,end.outstandingEnergy);
  const absent=runValueCueProbe(null,{family:'A',version:'C'},251111,2);assert.equal(absent.value,0);assert.equal(absent.skippedAllDead,true);
  const base=partial.checkpoint();for(const mutate of [cp=>{delete cp.state.learners[1];},cp=>{cp.state.learners[1].dead=false;},
    cp=>{cp.state.program='actor';},cp=>{cp.state.codebook.A[0].valence*= -1;},cp=>{cp.state.learners[2].weights[0].pop();}]){
    const cp=structuredClone(base);mutate(cp);assert.throws(()=>ValueCueExperiment.restore(cp));
  }
  const fixed=new ValueCueExperiment(config('acceptCruise')).checkpoint();fixed.state.learners[1].weights=[];assert.throws(()=>ValueCueExperiment.restore(fixed));
});
