import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {CueExperiment, makeCueCodebook, enterCuePhase, cueObservation, runCueProbe, pressureSummary, AUTHORITY_ARMS} from '../learning/cue-foraging.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {digest} from '../learning/intervention-study.mjs';
const reference={founders:4,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}};
const pricing={byteEnergyPerSecond:1e-5/(17*8),operationEnergy:5e-6/17};
const history={seed:103,cueSeed:104,resourceSeeds:[105,106,107,108],shuffleSeed:109,nullSeed:110};
const config=arm=>({history,arm,reference,pricing});

test('beneficial and harmful food obey the physical ledger, including terminal depletion',()=>{
  for(const energy of [.1,50]){
    const w=new World({seed:111,founders:2,reproduction:false,mutation:false,seasonal:false,nutrient:0,controller:'episodic-actor',episodicParameters:reference.parameters,cueForaging:true});
    const fly=w.flies[0];for(const f of w.flies){f.x=100;f.y=100;f.energy=energy;}
    for(const p of w.food){p.amount=0;p.regrowth=0;}
    Object.assign(w.food[0],{x:100,y:100,amount:.8,capacity:1,valence:-1});
    Object.assign(w.food[1],{x:100,y:100,amount:.6,capacity:1,valence:1});
    w.initialEnergy=w.energy();const receipts=[];
    w.step(()=>({energyCost:.01,afterController:o=>{o[0]=0;o[1]=-1;o[2]=1;o[3]=-1;o[4]=0;},afterStep:r=>receipts.push(r)}));
    assert.ok(w.totals.harmfulEaten>0);assert.ok(w.totals.beneficialEaten>0);
    assert.equal(w.totals.foodEaten,w.totals.harmfulEaten+w.totals.beneficialEaten);
    for(const r of receipts)assert.ok(Math.abs(r.initialEnergy-r.cost+r.beneficialEaten-r.toxinDamage-r.finalEnergy)<1e-12);
    assert.ok(Math.abs(w.metrics().accountingError)<1e-10);
    assert.deepEqual(World.restore(w.checkpoint()).checkpoint(),w.checkpoint());
    assert.ok(fly.energy>=0);
  }
});

test('cue assignments change no inventory, body, physical RNG or candidate observation when only hidden valence is changed',()=>{
  const run=new CueExperiment(config('candidate')),before=run.world.checkpoint(),book=makeCueCodebook(112);
  assert.equal(new Set(Object.values(book).flat().map(c=>c.id)).size,12);
  for(const family of Object.values(book))assert.equal(family.reduce((s,c)=>s+c.valence,0),0);
  enterCuePhase(run.world,CONTINUAL_PHASES[1],113,book);
  assert.equal(run.world.energy(),before.world.food.reduce((s,p)=>s+p.amount,0)+before.world.flies.reduce((s,f)=>s+f.energy,0));
  assert.deepEqual(run.world.flies,before.world.flies);assert.equal(run.world.rng.state,before.world.rng.state);
  const twin=CueExperiment.restore(run.checkpoint());for(const p of twin.world.food)p.valence*=-1;
  const seen=[];run.world.step((f,raw,tick)=>{seen.push(run.observation(f,raw,tick));return {energyCost:0};});
  const other=[];twin.world.step((f,raw,tick)=>{other.push(twin.observation(f,raw,tick));return {energyCost:0};});
  assert.deepEqual(seen,other);assert.equal(cueObservation(Array(17).fill(0),[-1,1,-1,1]).length,17);
});

test('joint cue checkpoint continues exactly across phases, bills and held motor actions',()=>{
  for(const arm of ['candidate','cueBlind','shuffled','reset','cueOracle','nullCueOracle','random']){
    const run=new CueExperiment(config(arm));run.advance(509);const twin=CueExperiment.restore(run.checkpoint());
    run.advance(530);twin.advance(530);assert.deepEqual(twin.checkpoint(),run.checkpoint());
    for(const s of Object.values(run.learners))assert.ok(Math.abs(s.charge.incurredEnergy-s.charge.paidEnergy-s.charge.outstandingEnergy)<1e-9);
    assert.ok(Math.abs(run.endpoint().accountingResidual)<1e-6);
  }
});

test('common-body skill and original-ecology probes are read-only and do not refill energy',()=>{
  const run=new CueExperiment(config('candidate'));run.advance(1536);assert.ok(run.atC);
  const before=digest(run.checkpoint()),p=pressureSummary(run);assert.ok(p.aCells>0&&p.reusedA>0&&p.bodiesOverReceiptCapacity>0);
  for(const family of ['A','B','transfer']){
    const a=runCueProbe(run.atC,{family,version:'C'},114,4),b=runCueProbe(run.atC,{family,version:'reset'},114,4);
    assert.equal(a.startWorldSha256,b.startWorldSha256);assert.equal(a.founders,4);assert.ok(a.acquisitionDisabled&&a.learnedWeightsUnchanged);
  }
  const accept=runCueProbe(run.atC,{family:'transfer',version:'accept'},114,4),reset=runCueProbe(run.atC,{family:'transfer',version:'reset'},114,4);
  assert.equal(accept.startWorldSha256,reset.startWorldSha256);
  assert.ok(accept.endpoint.encodedBytes<reset.endpoint.encodedBytes,'A fixed transfer control must not carry an unused learned circuit');
  assert.equal(digest(run.checkpoint()),before);
});

test('authority controls are distinct, nonlearning and null assignments break deterministic cue labels',()=>{
  const runs=AUTHORITY_ARMS.map(arm=>new CueExperiment(config(arm)));
  assert.equal(new Set(runs.filter(r=>!r.isNull()).map(r=>digest(r.world.checkpoint()))).size,1);
  const nullRun=runs.find(r=>r.arm==='nullCueOracle');
  for(const id of new Set(nullRun.world.food.map(p=>p.cueId)))assert.equal(new Set(nullRun.world.food.filter(p=>p.cueId===id).map(p=>p.valence)).size,2);
  for(const run of runs){run.advance(17);assert.ok(Object.values(run.learners).every(s=>!s.acquisition&&s.transitions===0&&s.weights.length===0));}
  assert.notDeepEqual(runs.find(r=>r.arm==='accept').world.checkpoint(),runs.find(r=>r.arm==='refuse').world.checkpoint());
});
