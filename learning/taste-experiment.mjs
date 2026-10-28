import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {digest} from './intervention-study.mjs';
import {CONTINUAL_PHASES,enterContinualPhase,updateContinualResources} from './continual-regimes.mjs';
import {makeCueCodebook,enterCuePhase,updateCueResources} from './cue-foraging.mjs';
import {contactObservation} from './contact-observation.mjs';
import {tickMotor} from './tick-actor-critic.mjs';
import {pursuitMotor} from './pursuit-authority.mjs';
import {chargeForStep,billSarsaWork,encodedStateBytes} from './sarsa-experiment.mjs';
import {createTasteEnergyBody,chooseTasteEnergyAction,observeTasteEnergyBody,freezeTasteEnergyBody,resetTasteEnergyBody,compactTasteEnergyBody,restoreTasteEnergyBody} from './taste-energy.mjs';
import {VALUE_REFERENCE} from './value-development.mjs';

export const TASTE_ARMS=Object.freeze(['candidate','unlearned','frozen','reset','noTaste','noNormalization','blind','acceptCruise','acceptStationary','nativeFullCruise']);
const fixed=arm=>['acceptCruise','acceptStationary','nativeFullCruise'].includes(arm);
const canonical=value=>JSON.parse(JSON.stringify(value));
const validSeed=value=>Number.isInteger(value)&&value>0&&value<=0xffffffff;
const fixedBody=(agentId,seed,tick=0)=>({agentId,rngState:seed,dead:false,lastDecisionTick:tick,lastObservedTick:tick,decisions:tick,
  work:{scalarOperations:0,liveUpdates:0,replayUpdates:0},charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0}});

export class TasteExperiment{
  constructor({history,arm='candidate',reference=VALUE_REFERENCE,pricing={operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)},learnerOptions={},cruiseSpeed=0,body='N',emit=null}){
    assert.ok(TASTE_ARMS.includes(arm));assert.ok(validSeed(history.seed)&&validSeed(history.cueSeed)&&history.resourceSeeds.length===4&&history.resourceSeeds.every(validSeed));
    assert.ok(reference.founders>=2&&Number.isSafeInteger(reference.founders));assert.ok(pricing.operationEnergy>0&&pricing.byteEnergyPerSecond>0);
    assert.ok([0,1].includes(cruiseSpeed));assert.ok(['N','P','Q'].includes(body));assert.ok(arm!=='nativeFullCruise'||body==='N');
    this.cruiseSpeed=cruiseSpeed;this.body=body;
    this.history=structuredClone(history);this.arm=arm;this.program=fixed(arm)?'fixed':'taste';this.reference=structuredClone(reference);this.pricing={...pricing};this.learnerOptions={...learnerOptions};
    this.world=new World({seed:history.seed,founders:reference.founders,capacity:240,reproduction:false,mutation:false,learning:false,controller:'episodic-actor',
      actorParameters:reference.actorParameters,episodicParameters:{...reference.parameters,actuator:'move',memoryLearning:false,neuralLearning:false},
      nutrient:.4,seasonal:false,challenges:'off',cueForaging:true});
    this.codebook=makeCueCodebook(history.cueSeed);this.founderIds=this.world.flies.map(f=>f.id);this.learners={};
    for(const id of this.founderIds){
      const seed=(history.seed^Math.imul(id,2654435761))>>>0||1;
      this.learners[id]=this.program==='fixed'?fixedBody(id,seed):createTasteEnergyBody(id,seed,{...learnerOptions,tasteLearning:arm!=='noTaste',normalizeMotor:arm!=='noNormalization',cueBlind:arm==='blind'});
      if(arm==='unlearned')freezeTasteEnergyBody(this.learners[id]);
    }
    this.startingEnergy=this.world.flies.reduce((n,f)=>n+f.energy,0);this.startingDebt=0;this.startingOperations=0;
    this.phaseIndex=0;this.phaseEnd=512;this.phaseRows=[];this.savedModels={};this.atA=null;this.atB=null;this.atC=null;this.probe=false;this.transfer=false;this.finished=false;
    this.statistics={};this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[0],history.resourceSeeds[0],this.codebook);
    Object.defineProperty(this,'emit',{value:emit,writable:true,enumerable:false});
  }
  record(event){if(this.emit)this.emit(canonical({arm:this.arm,...event}));}
  step(){
    if(this.finished||!this.world.flies.length)return false;
    if(this.world.tick===this.phaseEnd){
      if(this.probe||++this.phaseIndex>=4){this.finished=true;return false;}
      const phase=CONTINUAL_PHASES[this.phaseIndex];
      if(['B','C'].includes(phase.id)&&['frozen','reset'].includes(this.arm))for(const f of this.world.flies)(this.arm==='frozen'?freezeTasteEnergyBody:resetTasteEnergyBody)(this.learners[f.id]);
      this.resource=enterCuePhase(this.world,phase,this.history.resourceSeeds[this.phaseIndex],this.codebook);this.phaseEnd+=phase.ticks;
    }
    if(this.transfer)updateContinualResources(this.world,this.resource);else updateCueResources(this.world,this.resource);
    const family=this.transfer?'transfer':this.resource.family,stats=this.statistics[family]??={decisions:0,actions:[0,0,0,0],tasteExamples:0,beneficialEaten:0,toxinDamage:0,physicalCosts:0};
    const before=[...this.world.flies];
    this.world.step((fly,raw,tick)=>{
      const state=this.learners[fly.id];let own,action;
      if(this.program==='taste'){
        const observation=contactObservation(fly,this.world.food,fly.sensedCue,state.work);
        if(this.transfer){observation.cue=[0,0,0,0];observation.odorPresent=false;}
        if(state.config.cueBlind)observation.cue=[0,0,0,0];
        own={agentId:fly.id,tick,energy:fly.energy-state.charge.outstandingEnergy,raw,...observation};
        action=chooseTasteEnergyAction(state,own,e=>this.record({type:'update',event:e}));
      }else{
        state.work.scalarOperations++;action=this.arm==='acceptStationary'?2:0;state.decisions++;state.lastDecisionTick=tick;
      }
      stats.decisions++;stats.actions[action]++;
      let outputs;
      if(this.body==='P'){
        const motor=pursuitMotor(raw,(action===0||action===2)?1:-1);
        outputs=motor.outputs;if(action>=2)outputs[1]=-1;
        state.work.scalarOperations+=motor.operations+2;
      }else if(this.body==='Q'){
        const motor=pursuitMotor(raw,(action===0||action===2)?1:-1);
        outputs=motor.outputs;outputs[1]=action>=2?-1:0;
        state.work.scalarOperations+=motor.operations+2;
      }else{
        outputs=tickMotor(state,raw,action);
        if(action<2)outputs[1]=this.arm==='nativeFullCruise'?1:(this.cruiseSpeed??0);
      }
      const bill=chargeForStep(state,this.pricing);
      this.record({type:'decision',own,action,outputs,requestedExtra:bill.energyCost});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        stats.beneficialEaten+=receipt.beneficialEaten;stats.toxinDamage+=receipt.toxinDamage;stats.physicalCosts+=receipt.cost;
        this.record({type:'physical',...receipt});
      }};
    });
    for(const fly of before){
      const state=this.learners[fly.id],alive=this.world.flies.includes(fly),examples=state.tasteExamples??0;
      const own={agentId:fly.id,tick:this.world.tick,energy:(alive?fly.energy:0)-state.charge.outstandingEnergy,lastFood:fly.lastFood,terminal:!alive};
      if(this.program==='taste')observeTasteEnergyBody(state,own,e=>this.record({type:'update',event:e}));else{state.lastObservedTick=this.world.tick;state.dead=!alive;}
      stats.tasteExamples+=(state.tasteExamples??0)-examples;
      if(!alive)billSarsaWork(state,this.pricing);
      this.record({type:'observe',own});
    }
    if(!this.probe&&this.world.tick===this.phaseEnd){
      const phase=CONTINUAL_PHASES[this.phaseIndex].id;this.phaseRows.push({phase,...this.endpoint()});
      if(this.program==='taste')this.savedModels[phase]=Object.fromEntries(Object.entries(this.learners).map(([id,s])=>[id,structuredClone(s.weights)]));
      if(this.arm==='candidate'&&phase==='A')this.atA=this.checkpoint(false);
      if(this.arm==='candidate'&&phase==='B')this.atB=this.checkpoint(false);
      if(this.arm==='candidate'&&phase==='C')this.atC=this.checkpoint(false);
    }
    return true;
  }
  advance(ticks){assert.ok(Number.isInteger(ticks)&&ticks>=0);for(let i=0;i<ticks;i++)if(!this.step())break;return this.endpoint();}
  endpoint(){
    const states=Object.values(this.learners),energy=this.world.flies.reduce((n,f)=>n+f.energy,0),debt=states.reduce((n,s)=>n+s.charge.outstandingEnergy,0),operations=states.reduce((n,s)=>n+s.work.scalarOperations,0);
    return {tick:this.world.tick,founders:this.founderIds.length,survivors:this.world.flies.length,physicalEnergy:energy,
      startingEnergy:this.startingEnergy,startingDebt:this.startingDebt,outstandingEnergy:debt,
      budgetAdjustedEnergyPerFounder:(energy-this.startingEnergy-(debt-this.startingDebt))/this.founderIds.length,
      scalarOperations:operations,additionalScalarOperations:operations-this.startingOperations,operationsBilled:states.reduce((n,s)=>n+(s.charge.operationsBilled??0),0),incurredEnergy:states.reduce((n,s)=>n+s.charge.incurredEnergy,0),
      paidEnergy:states.reduce((n,s)=>n+s.charge.paidEnergy,0),learnerEncodedBytes:states.reduce((n,s)=>n+encodedStateBytes(s),0),
      accountingResidual:this.world.metrics().accountingError,foodInventory:this.world.food.reduce((n,p)=>n+p.amount,0),totals:structuredClone(this.world.totals)};
  }
  checkpoint(includeAnchors=true){const {world,atA,atB,atC,...state}=this;return canonical({schema:1,kind:'taste-world',world:world.checkpoint(),state,atA:includeAnchors?atA:null,atB:includeAnchors?atB:null,atC:includeAnchors?atC:null});}
  static restore(cp,emit=null){
    assert.equal(cp.schema,1);assert.equal(cp.kind,'taste-world');const run=Object.create(TasteExperiment.prototype);Object.assign(run,structuredClone(cp.state));
    run.world=World.restore(cp.world);run.atA=structuredClone(cp.atA);run.atB=structuredClone(cp.atB??null);run.atC=structuredClone(cp.atC);Object.defineProperty(run,'emit',{value:emit,writable:true,enumerable:false});
    assert.ok(TASTE_ARMS.includes(run.arm));assert.equal(run.program,fixed(run.arm)?'fixed':'taste');assert.equal(run.world.config.reproduction,false);assert.equal(run.world.config.mutation,false);
    assert.equal(run.world.config.learning,false);assert.equal(run.world.config.episodicParameters.memoryLearning,false);assert.equal(run.world.config.episodicParameters.neuralLearning,false);
    if(run.body===undefined)run.body='N';assert.ok(['N','P','Q'].includes(run.body));
    assert.deepEqual(Object.keys(run.learners).sort(),run.founderIds.map(String).sort());assert.equal(run.founderIds.length,run.reference.founders);
    for(const id of run.founderIds){const state=run.learners[id];assert.equal(state.agentId,id);assert.equal(state.dead,!run.world.flies.some(f=>f.id===id));if(!state.dead)assert.equal(state.lastObservedTick,run.world.tick);
      if(run.program==='taste')run.learners[id]=restoreTasteEnergyBody(state);
      else assert.ok(Math.abs(state.charge.incurredEnergy-state.charge.paidEnergy-state.charge.outstandingEnergy)<1e-8);
    }
    return run;
  }
}

export function runTasteProbe(anchor,{family='A',version='current',seed,ticks=256,founders=24,body=null}){
  assert.ok(['A','B','C','transfer'].includes(family)&&['A','B','C','current','reset','acceptCruise','acceptStationary','nativeFullCruise'].includes(version));assert.ok(validSeed(seed)&&ticks>=1&&ticks<=256);
  if(body!==null)assert.ok(['N','P','Q'].includes(body));
  if(!anchor)return {family,version,seed,founders,body:body??'N',survivors:0,value:0,skippedAllDead:true};
  const run=TasteExperiment.restore(anchor);assert.equal(run.program,'taste');assert.equal(founders,run.founderIds.length);
  if(body!==null)run.body=body;
  const models=['A','B','C'].includes(version)?run.savedModels[version]:null;if(['A','B','C'].includes(version))assert.ok(models);
  for(const id of run.founderIds){const state=run.learners[id];if(fixed(version)){
      const replacement=fixedBody(id,state.feedRngState,state.lastObservedTick);replacement.dead=state.dead;replacement.charge={...state.charge,operationsBilled:0,storageBytes:0};run.learners[id]=replacement;
    }else{if(models)state.weights=structuredClone(models[id]);if(version==='reset')resetTasteEnergyBody(state);compactTasteEnergyBody(state);state.charge.storageBytes=0;}
  }
  run.arm=fixed(version)?version:'frozen';run.program=fixed(version)?'fixed':'taste';run.probe=true;run.transfer=family==='transfer';run.finished=false;run.atA=null;run.atB=null;run.atC=null;
  run.phaseRows=[];run.statistics={};run.savedModels={};run.phaseEnd=run.world.tick+ticks;
  const phase=CONTINUAL_PHASES.find(p=>p.id===(run.transfer?'A':family));
  if(run.transfer){run.world.config.cueForaging=false;run.resource=enterContinualPhase(run.world,phase,seed);}else run.resource=enterCuePhase(run.world,phase,seed,run.codebook);
  run.startingEnergy=run.world.flies.reduce((n,f)=>n+f.energy,0);run.startingDebt=Object.values(run.learners).reduce((n,s)=>n+s.charge.outstandingEnergy,0);
  run.startingOperations=Object.values(run.learners).reduce((n,s)=>n+s.work.scalarOperations,0);
  const startWorldSha256=digest(run.world.checkpoint()),before=digest(Object.values(run.learners).map(s=>s.weights??null)),skippedAllDead=run.world.flies.length===0;
  const startPending=Object.values(run.learners).reduce((n,s)=>n+(s.work.scalarOperations-(s.charge.operationsBilled??0)),0);
  run.advance(ticks);assert.equal(digest(Object.values(run.learners).map(s=>s.weights??null)),before);
  const endpoint=run.endpoint();return {family,version,seed,founders,body:run.body,survivors:endpoint.survivors,value:endpoint.budgetAdjustedEnergyPerFounder,skippedAllDead,startWorldSha256,startPending,endpoint,statistics:run.statistics};
}
