import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {advanceRng,digest} from './intervention-study.mjs';
import {CONTINUAL_PHASES,enterContinualPhase,updateContinualResources} from './continual-regimes.mjs';
import {makeCueCodebook,enterCuePhase,updateCueResources,cueObservation} from './cue-foraging.mjs';
import {contactCue} from './contact-cue.mjs';
import {chargeForStep,billSarsaWork,encodedStateBytes} from './sarsa-experiment.mjs';
import {createTickBody,chooseTickAction,observeTickBody,tickMotor,freezeTickBody,resetTickBody,restoreTickBody} from './tick-actor-critic.mjs';
import {createValueBody,chooseValueAction,observeValueBody,freezeValueBody,resetValueBody,restoreValueBody} from './tick-value.mjs';

export const VALUE_CUE_ARMS=Object.freeze(['candidate','originalValue','contactActor','originalActor','lambda0','frozen','reset',
  'cueBlind','shuffled','nullCandidate','nullBlind','incumbent','acceptCruise','refuseCruise','acceptStationary','refuseStationary','random']);
export const VALUE_CUE_PROBES=Object.freeze([
  ['A','A'],['A','B'],['A','C'],['A','reset'],['B','A'],['B','B'],['B','C'],['B','reset'],['C','B'],['C','C'],
  ...['A','C','reset','accept','acceptStationary'].map(version=>['transfer',version])
].map(([family,version])=>Object.freeze({family,version})));
const canonical=value=>JSON.parse(JSON.stringify(value)),validSeed=s=>Number.isInteger(s)&&s>0&&s<=0xffffffff;
const valueArms=['candidate','originalValue','lambda0','frozen','reset','cueBlind','shuffled','nullCandidate','nullBlind'];
const actorArms=['contactActor','originalActor'];
const learned=arm=>valueArms.includes(arm)||actorArms.includes(arm);
const program=arm=>valueArms.includes(arm)?'value':actorArms.includes(arm)?'actor':arm==='incumbent'?'native':'fixed';
const api=kind=>kind==='value'?{choose:chooseValueAction,observe:observeValueBody,freeze:freezeValueBody,reset:resetValueBody,restore:restoreValueBody}:
  {choose:chooseTickAction,observe:observeTickBody,freeze:freezeTickBody,reset:resetTickBody,restore:restoreTickBody};
function fixedState(agentId,seed,arm,tick=0){return {schema:1,kind:arm==='incumbent'?'native-value-reference-observer':'fixed-value-menu-control',
  agentId,arm,rngState:seed,dead:false,decisions:tick,lastDecisionTick:tick,lastObservedTick:tick,
  work:{scalarOperations:0,liveUpdates:0,replayUpdates:0},charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0}};}
function validateHistory(h){for(const key of ['seed','cueSeed','shuffleSeed','nullSeed'])assert.ok(validSeed(h[key]));assert.ok(Array.isArray(h.resourceSeeds)&&h.resourceSeeds.length===4&&h.resourceSeeds.every(validSeed));}
function weightValid(weights,kind){
  if(kind==='value')assert.ok(Array.isArray(weights)&&weights.length===4&&weights.every(row=>Array.isArray(row)&&row.length===71&&row.every(v=>Number.isFinite(v)&&Math.abs(v)<=4)));
  else assert.ok(Array.isArray(weights)&&weights.length===161&&weights.every(v=>Number.isFinite(v)&&Math.abs(v)<=4));
}
export class ValueCueExperiment{
  constructor({history,arm,reference,pricing,emit=()=>{}}){
    validateHistory(history);assert.ok(VALUE_CUE_ARMS.includes(arm));assert.ok(Number.isSafeInteger(reference.founders)&&reference.founders>=2);
    assert.ok(Number.isFinite(pricing.operationEnergy)&&pricing.operationEnergy>0&&Number.isFinite(pricing.byteEnergyPerSecond)&&pricing.byteEnergyPerSecond>0);
    this.historySpec=structuredClone(history);this.arm=arm;this.program=program(arm);this.reference=structuredClone(reference);this.pricing=structuredClone(pricing);
    this.world=new World({seed:history.seed,founders:reference.founders,capacity:240,reproduction:false,mutation:false,controller:'episodic-actor',
      learning:arm==='incumbent',actorParameters:reference.actorParameters,
      episodicParameters:{...reference.parameters,actuator:'move',memoryLearning:arm==='incumbent',neuralLearning:arm==='incumbent'},
      nutrient:.4,seasonal:false,challenges:'off',cueForaging:true});
    this.codebook=makeCueCodebook(history.cueSeed);this.founderIds=this.world.flies.map(f=>f.id);
    this.startingEnergy=this.world.flies.reduce((n,f)=>n+f.energy,0);this.startingDebt=0;this.startingOperations=0;this.learners={};
    for(const id of this.founderIds){const seed=(history.seed^Math.imul(id,2654435761))>>>0||1;
      this.learners[id]=this.program==='value'?createValueBody(id,seed,arm==='lambda0'?{lambda:0}:{}):this.program==='actor'?createTickBody(id,seed):fixedState(id,seed,arm);}
    this.phaseIndex=0;this.phaseEnd=512;this.phaseRows=[];this.savedModels={};this.atC=null;
    this.transfer=false;this.probe=false;this.finished=false;
    this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[0],history.resourceSeeds[0],this.codebook,this.isNull()?history.nullSeed:null);
    Object.defineProperty(this,'emit',{value:emit,writable:true,enumerable:false});
  }
  record(event){this.emit(structuredClone({arm:this.arm,program:this.program,...event}));}
  isNull(){return ['nullCandidate','nullBlind'].includes(this.arm);}
  usesContact(){return !this.transfer&&(valueArms.includes(this.arm)&&this.arm!=='originalValue'||this.arm==='contactActor');}
  observation(fly,raw,tick){
    const state=this.learners[fly.id],before=state.work.scalarOperations;
    let selected=this.transfer?[0,0,0,0]:this.usesContact()?contactCue(fly,this.world.food,fly.sensedCue,state.work):fly.sensedCue;
    const selectedCue=[...selected],contactOperations=state.work.scalarOperations-before;
    if(['cueBlind','nullBlind'].includes(this.arm))selected=[0,0,0,0];
    if(this.arm==='shuffled'&&!this.transfer){const family=this.resource.family==='return-A'?'A':this.resource.family;
      const index=parseInt(digest(`${this.historySpec.shuffleSeed}:${fly.id}:${tick}`).slice(0,8),16)%4;selected=this.codebook[family][index].bits;}
    return {observation:cueObservation(raw,selected),selectedCue,contactOperations};
  }
  fixedChoice(state,tick){
    assert.ok(!state.dead);assert.equal(state.lastObservedTick+1,tick);
    let action=['acceptCruise','refuseCruise','acceptStationary','refuseStationary'].indexOf(this.arm);state.work.scalarOperations++;
    if(this.arm==='random'){state.rngState=advanceRng(state.rngState);action=Math.floor(state.rngState/4294967296*4);state.work.scalarOperations+=9;}
    assert.ok(action>=0&&action<4);state.decisions++;state.lastDecisionTick=tick;return action;
  }
  enterNextPhase(){
    this.phaseIndex++;if(this.phaseIndex>=CONTINUAL_PHASES.length){this.finished=true;return false;}
    const phase=CONTINUAL_PHASES[this.phaseIndex];
    if(['B','C'].includes(phase.id)&&['frozen','reset'].includes(this.arm)){
      for(const state of Object.values(this.learners))if(!state.dead)api(this.program)[this.arm==='frozen'?'freeze':'reset'](state);
      this.record({type:'intervention',tick:this.world.tick,phase:phase.id,action:this.arm});
    }
    this.resource=enterCuePhase(this.world,phase,this.historySpec.resourceSeeds[this.phaseIndex],this.codebook,this.isNull()?this.historySpec.nullSeed:null);
    this.phaseEnd+=phase.ticks;this.record({type:'phase',tick:this.world.tick,phase:phase.id,resource:this.resource});return true;
  }
  step(){
    if(this.finished||!this.world.flies.length)return false;
    if(this.world.tick===this.phaseEnd){if(this.probe){this.finished=true;return false;}if(!this.enterNextPhase())return false;}
    if(this.transfer)updateContinualResources(this.world,this.resource);else updateCueResources(this.world,this.resource);
    const before=[...this.world.flies];
    this.world.step((fly,raw,tick)=>{
      const state=this.learners[fly.id];
      if(this.program==='native'){
        state.decisions++;state.lastDecisionTick=tick;
        return {energyCost:0,afterController:outputs=>this.record({type:'native-motor',agentId:fly.id,tick,raw,outputs,sensorPosition:{x:fly.x,y:fly.y},
          nativeMemoryRecords:fly.brain.episodic.memory.records.length,nativeLookupRecords:fly.brain.episodic.lookupRecordsThisStep}),
          afterStep:receipt=>this.record({type:'physical',...receipt,physicalPosition:{x:fly.x,y:fly.y},storageBytes:0,requestedExtra:0,outstandingEnergy:0})};
      }
      const {observation,selectedCue,contactOperations}=this.observation(fly,raw,tick),own={agentId:fly.id,tick,energy:fly.energy-state.charge.outstandingEnergy,raw,observation};
      const choice=learned(this.arm)?api(this.program).choose(state,own,row=>this.record({type:'transition',...row})):this.fixedChoice(state,tick);
      const outputs=tickMotor(state,raw,choice),bill=chargeForStep(state,this.pricing);
      this.record({type:'decision',own,sensorPosition:{x:fly.x,y:fly.y},nativeSourceCue:fly.sensedCue,selectedCue,contactOperations,physicalEnergy:fly.energy,choice,outputs,
        rngState:state.rngState,scalarOperations:state.work.scalarOperations,storageBytes:state.charge.storageBytes,requestedExtra:bill.energyCost});
      return {...bill,afterController:native=>{native.splice(0,5,...outputs);this.record({type:'native-cost',agentId:fly.id,tick,outputs:native,
        nativeMemoryRecords:fly.brain.episodic.memory.records.length,nativeLookupRecords:fly.brain.episodic.lookupRecordsThisStep});},
        afterStep:receipt=>this.record({type:'physical',...receipt,physicalPosition:{x:fly.x,y:fly.y},storageBytes:state.charge.storageBytes,requestedExtra:bill.energyCost,
          outstandingEnergy:state.charge.outstandingEnergy,incurredEnergy:state.charge.incurredEnergy,paidEnergy:state.charge.paidEnergy})};
    });
    for(const fly of before){
      const state=this.learners[fly.id],alive=this.world.flies.includes(fly),own={agentId:fly.id,tick:this.world.tick,energy:(alive?fly.energy:0)-state.charge.outstandingEnergy,terminal:!alive};
      if(learned(this.arm))api(this.program).observe(state,own,row=>this.record({type:'transition',...row}));else{state.lastObservedTick=this.world.tick;state.dead=!alive;}
      if(!alive&&this.program!=='native')billSarsaWork(state,this.pricing);
      this.record({type:'observe',own,physicalEnergy:alive?fly.energy:0,discardedEnergy:alive?0:fly.energy,scalarOperations:state.work.scalarOperations,
        outstandingEnergy:state.charge.outstandingEnergy,incurredEnergy:state.charge.incurredEnergy,paidEnergy:state.charge.paidEnergy});
    }
    assert.ok(Math.abs(this.world.metrics().accountingError)<1e-6);
    if(!this.probe&&this.world.tick===this.phaseEnd){
      const phase=CONTINUAL_PHASES[this.phaseIndex];this.phaseRows.push({phase:phase.id,...this.endpoint()});
      if(['A','B'].includes(phase.id)&&learned(this.arm))this.savedModels[phase.id]=Object.fromEntries(Object.entries(this.learners).map(([id,s])=>[id,structuredClone(s.weights)]));
      this.record({type:'phase-end',tick:this.world.tick,phase:phase.id,endpoint:this.endpoint()});if(phase.id==='C'&&this.arm==='candidate')this.atC=this.checkpoint(false);
    }
    return true;
  }
  advance(ticks){assert.ok(Number.isSafeInteger(ticks)&&ticks>=0);for(let i=0;i<ticks;i++)if(!this.step())break;}
  endpoint(){
    const energy=this.world.flies.reduce((n,f)=>n+f.energy,0),debt=Object.values(this.learners).reduce((n,s)=>n+s.charge.outstandingEnergy,0),
      operations=Object.values(this.learners).reduce((n,s)=>n+s.work.scalarOperations,0);
    return {tick:this.world.tick,founders:this.founderIds.length,survivors:this.world.flies.length,survival:this.world.flies.length/this.founderIds.length,
      physicalEnergy:energy,startingEnergy:this.startingEnergy,startingDebt:this.startingDebt,outstandingEnergy:debt,
      budgetAdjustedEnergyPerFounder:(energy-this.startingEnergy-(debt-this.startingDebt))/this.founderIds.length,
      accountingResidual:this.world.metrics().accountingError,foodInventory:this.world.food.reduce((n,p)=>n+p.amount,0),totals:structuredClone(this.world.totals),
      scalarOperations:operations,additionalScalarOperations:operations-this.startingOperations,
      learnerEncodedBytes:this.program==='native'?0:Object.values(this.learners).reduce((n,s)=>n+encodedStateBytes(s),0)};
  }
  checkpoint(includeAtC=true){const {world,atC,...state}=this;return canonical({schema:1,kind:'joint-value-cue-experiment',world:world.checkpoint(),state,atC:includeAtC?atC:null});}
  static restore(cp,emit=()=>{}){
    assert.equal(cp.schema,1);assert.equal(cp.kind,'joint-value-cue-experiment');const run=Object.create(ValueCueExperiment.prototype);Object.assign(run,structuredClone(cp.state));
    assert.ok(VALUE_CUE_ARMS.includes(run.arm));assert.equal(run.program,program(run.arm));validateHistory(run.historySpec);
    assert.equal(new Set(run.founderIds).size,run.reference.founders);assert.equal(run.founderIds.length,run.reference.founders);
    assert.deepEqual(Object.keys(run.learners).sort(),run.founderIds.map(String).sort());
    assert.ok(Number.isFinite(run.pricing.operationEnergy)&&run.pricing.operationEnergy>0&&Number.isFinite(run.pricing.byteEnergyPerSecond)&&run.pricing.byteEnergyPerSecond>0);
    run.world=World.restore(cp.world);run.atC=structuredClone(cp.atC);
    assert.equal(run.world.config.reproduction,false);assert.equal(run.world.config.mutation,false);assert.equal(run.world.config.controller,'episodic-actor');
    assert.equal(run.world.config.learning,run.program==='native');assert.ok(run.world.flies.every(f=>run.founderIds.includes(f.id)));
    assert.equal(run.world.config.cueForaging,!run.transfer);assert.deepEqual(run.codebook,makeCueCodebook(run.historySpec.cueSeed));
    assert.equal(run.world.config.episodicParameters.memoryLearning,run.program==='native');assert.equal(run.world.config.episodicParameters.neuralLearning,run.program==='native');
    assert.ok(Number.isSafeInteger(run.phaseIndex)&&run.phaseIndex>=0&&run.phaseIndex<=4&&Number.isSafeInteger(run.phaseEnd)&&run.phaseEnd>=run.world.tick);
    for(const key of ['probe','finished','transfer'])assert.equal(typeof run[key],'boolean');
    for(const key of ['startingEnergy','startingDebt','startingOperations'])assert.ok(Number.isFinite(run[key])&&run[key]>=0);
    for(const [family,models]of Object.entries(run.savedModels)){assert.ok(['A','B'].includes(family));assert.deepEqual(Object.keys(models).sort(),run.founderIds.map(String).sort());for(const weights of Object.values(models))weightValid(weights,run.program);}
    for(const id of run.founderIds){
      const state=run.learners[id];assert.equal(state.agentId,id);assert.equal(state.dead,!run.world.flies.some(f=>f.id===id));
      assert.ok(state.lastObservedTick<=run.world.tick);if(!state.dead)assert.equal(state.lastObservedTick,run.world.tick);
      if(learned(run.arm)){run.learners[id]=api(run.program).restore(state);if(run.program==='value')assert.equal(state.config.lambda,run.arm==='lambda0'?0:.9);}
      else{
        assert.deepEqual(Object.keys(state).sort(),Object.keys(fixedState(id,state.rngState,run.arm)).sort());assert.equal(state.arm,run.arm);
        assert.equal(state.kind,run.program==='native'?'native-value-reference-observer':'fixed-value-menu-control');assert.equal(state.decisions,state.lastDecisionTick);
        assert.equal(state.lastObservedTick,state.lastDecisionTick);assert.ok(Number.isInteger(state.rngState)&&state.rngState>0&&state.rngState<=0xffffffff);
        for(const key of ['scalarOperations','liveUpdates','replayUpdates'])assert.ok(Number.isSafeInteger(state.work[key])&&state.work[key]>=0);
        assert.equal(state.work.liveUpdates,0);assert.equal(state.work.replayUpdates,0);
        for(const key of ['operationsBilled','outstandingEnergy','incurredEnergy','paidEnergy','storageBytes'])assert.ok(Number.isFinite(state.charge[key])&&state.charge[key]>=0);
        assert.ok(state.charge.operationsBilled<=state.work.scalarOperations);
        assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy)<1e-8);
      }
    }
    Object.defineProperty(run,'emit',{value:emit,writable:true,enumerable:false});return run;
  }
}
export function runValueCueProbe(atC,spec,resourceSeed,founders,{ticks=256,emit=()=>{}}={}){
  assert.ok(VALUE_CUE_PROBES.some(v=>v.family===spec.family&&v.version===spec.version));assert.ok(validSeed(resourceSeed)&&Number.isSafeInteger(founders)&&founders>=2);
  assert.ok(Number.isSafeInteger(ticks)&&ticks>0&&ticks<=256);
  if(!atC)return {...spec,resourceSeed,founders,survivors:0,survival:0,value:0,skippedAllDead:true,startWorldSha256:null,resetInitializationOperations:0,resetInitializationEnergyPerFounder:0};
  const run=ValueCueExperiment.restore(atC,emit);assert.equal(run.program,'value');assert.equal(run.founderIds.length,founders);
  const source=['A','B'].includes(spec.version)?run.savedModels[spec.version]:null;if(['A','B'].includes(spec.version))assert.ok(source);
  const fixed=spec.version==='accept'?'acceptCruise':spec.version==='acceptStationary'?'acceptStationary':null;
  let operations=0;
  for(const id of run.founderIds){
    const current=run.learners[id];
    if(fixed){const state=fixedState(id,current.rngState,fixed,current.lastObservedTick);state.dead=current.dead;state.charge={...current.charge,operationsBilled:0,storageBytes:0};run.learners[id]=state;}
    else{
      operations+=current.work.scalarOperations;if(source)current.weights=structuredClone(source[id]);if(spec.version==='reset')for(const row of current.weights)row.fill(0);
      freezeValueBody(current);current.previous=null;current.recent=[];current.older=[];current.olderSeen=0;current.acquiredTransitions=0;current.charge.storageBytes=0;
    }
  }
  run.arm=fixed||'frozen';run.program=fixed?'fixed':'value';run.probe=true;run.finished=false;run.atC=null;run.savedModels={};run.phaseRows=[];
  run.transfer=spec.family==='transfer';const phase=CONTINUAL_PHASES.find(v=>v.id===(run.transfer?'A':spec.family));run.phaseIndex=CONTINUAL_PHASES.indexOf(phase);run.phaseEnd=run.world.tick+ticks;
  if(run.transfer){run.world.config.cueForaging=false;run.resource=enterContinualPhase(run.world,phase,resourceSeed);}else run.resource=enterCuePhase(run.world,phase,resourceSeed,run.codebook);
  run.startingEnergy=run.world.flies.reduce((n,f)=>n+f.energy,0);run.startingDebt=Object.values(run.learners).reduce((n,s)=>n+s.charge.outstandingEnergy,0);run.startingOperations=operations;
  const startWorldSha256=digest(run.world.checkpoint()),before=digest(Object.values(run.learners).map(s=>s.weights??null));
  run.record({type:'probe-start',spec,resourceSeed,ticks,startingEnergy:run.startingEnergy,startingDebt:run.startingDebt,startWorldSha256,
    resetInitializationOperations:0,learners:run.learners,world:run.world.checkpoint(),inferenceOnlyCompaction:true});
  const skippedAllDead=run.world.flies.length===0;run.advance(ticks);assert.equal(digest(Object.values(run.learners).map(s=>s.weights??null)),before);
  const endpoint=run.endpoint();run.record({type:'probe-end',endpoint,learners:run.learners});
  return {...spec,resourceSeed,founders,survivors:endpoint.survivors,survival:endpoint.survival,value:endpoint.budgetAdjustedEnergyPerFounder,
    resetInitializationOperations:0,resetInitializationEnergyPerFounder:0,skippedAllDead,startWorldSha256,endpoint,acquisitionDisabled:true,
    learnedWeightsUnchanged:true,inferenceOnlyCompaction:true,finalWorldSha256:digest(run.world.checkpoint())};
}
