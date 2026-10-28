import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {CONTINUAL_PHASES,enterContinualPhase,updateContinualResources} from './continual-regimes.mjs';
import {makeCueCodebook,enterCuePhase,updateCueResources} from './cue-foraging.mjs';
import {contactObservation} from './contact-observation.mjs';
import {VALUE_REFERENCE} from './value-development.mjs';
import {chargeForStep,billSarsaWork,encodedStateBytes} from './sarsa-experiment.mjs';
import {createCoverageTasteBody,chooseCoverageTaste,observeCoverageTaste,freezeCoverageTaste,resetCoverageTaste} from './coverage-taste.mjs';

export const COVERAGE_ARMS=Object.freeze(['candidate','unlearned','frozen','reset','native-full']);
const bareBody=id=>({agentId:id,work:{scalarOperations:0},charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0},lastDecisionTick:0,lastObservedTick:0});
export class CoverageExperiment{
  constructor({history,arm='candidate',reference=VALUE_REFERENCE,pricing={operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)},emit=null}){
    assert.ok(COVERAGE_ARMS.includes(arm));this.history=structuredClone(history);this.arm=arm;this.pricing=structuredClone(pricing);
    this.world=new World({seed:history.seed,founders:reference.founders,capacity:240,reproduction:false,mutation:false,learning:false,controller:'episodic-actor',
      actorParameters:reference.actorParameters,episodicParameters:{...reference.parameters,actuator:'move',memoryLearning:false,neuralLearning:false},nutrient:.4,seasonal:false,challenges:'off',cueForaging:true});
    this.founderIds=this.world.flies.map(fly=>fly.id);this.learners={};
    for(const id of this.founderIds){
      const state=this.learners[id]=arm==='native-full'?bareBody(id):createCoverageTasteBody(id,(history.seed^Math.imul(id,2654435761))>>>0||1);
      if(arm==='unlearned')freezeCoverageTaste(state);
    }
    this.codebook=makeCueCodebook(history.cueSeed);this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[0],history.resourceSeeds[0],this.codebook);
    this.phaseIndex=0;this.phaseEnd=512;this.probe=false;this.transfer=false;this.finished=false;
    this.startingEnergy=this.world.flies.reduce((sum,fly)=>sum+fly.energy,0);this.startingDebt=0;this.statistics={};this.anchors={};
    this.attach(emit);
  }
  attach(emit){Object.defineProperty(this,'emit',{value:emit,enumerable:false,writable:true,configurable:true});}
  step(){
    if(this.finished||!this.world.flies.length)return false;
    if(this.world.tick===this.phaseEnd){
      if(this.probe||++this.phaseIndex>=4){this.finished=true;return false;}
      if(['B','C'].includes(CONTINUAL_PHASES[this.phaseIndex].id))for(const fly of this.world.flies){
        if(this.arm==='frozen')freezeCoverageTaste(this.learners[fly.id]);
        if(this.arm==='reset')resetCoverageTaste(this.learners[fly.id]);
      }
      this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[this.phaseIndex],this.history.resourceSeeds[this.phaseIndex],this.codebook);
      this.phaseEnd+=CONTINUAL_PHASES[this.phaseIndex].ticks;
    }
    if(this.transfer)updateContinualResources(this.world,this.resource);else updateCueResources(this.world,this.resource);
    const family=this.transfer?'transfer':this.resource.family;
    const stats=this.statistics[family]??={decisions:0,moves:[0,0,0],accept:0,intake:0,toxin:0,cost:0};
    const before=[...this.world.flies];
    this.world.step((fly,raw,tick)=>{
      const state=this.learners[fly.id];let choice={move:1,action:2,accept:true},own=null;
      if(this.arm!=='native-full'){
        const observation=contactObservation(fly,this.world.food,fly.sensedCue,state.work);
        if(this.transfer){observation.cue=[0,0,0,0];observation.odorPresent=false;}
        state.work.scalarOperations++;
        own={agentId:fly.id,tick,energy:fly.energy-state.charge.outstandingEnergy,raw,...observation};
        choice=chooseCoverageTaste(state,own,{fixedMove:this.fixedMove??null});
      }else{state.lastDecisionTick=tick;state.work.scalarOperations+=8;}
      const outputs=[Math.tanh(2*(raw[2]-raw[1])+1.8*(raw[10]-raw[11])),choice.move,choice.accept?1:-1,-1,0];
      if(this.arm!=='native-full')state.work.scalarOperations+=8;
      stats.decisions++;stats.moves[choice.action]++;stats.accept+=Number(choice.accept);
      const bill=chargeForStep(state,this.pricing);this.emit?.({type:'decision',own,id:fly.id,tick,choice,outputs,requestedExtra:bill.energyCost,work:state.work.scalarOperations,storageBytes:state.charge.storageBytes});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        stats.intake+=receipt.beneficialEaten;stats.toxin+=receipt.toxinDamage;stats.cost+=receipt.cost;this.emit?.({type:'physical',...receipt});
      }};
    });
    for(const fly of before){
      const state=this.learners[fly.id],alive=this.world.flies.includes(fly);
      if(this.arm!=='native-full'){
        state.work.scalarOperations++;
        const own={agentId:fly.id,tick:this.world.tick,energy:(alive?fly.energy:0)-state.charge.outstandingEnergy,lastFood:fly.lastFood,terminal:!alive};
        observeCoverageTaste(state,own);this.emit?.({type:'observe',own});
      }else state.lastObservedTick=this.world.tick;
      billSarsaWork(state,this.pricing);
    }
    if(!this.probe&&this.world.tick===this.phaseEnd&&this.phaseIndex<3)this.anchors[CONTINUAL_PHASES[this.phaseIndex].id]=this.checkpoint(false);
    return true;
  }
  advance(ticks){for(let index=0;index<ticks;index++)if(!this.step())break;return this.endpoint();}
  endpoint(){
    const states=Object.values(this.learners),energy=this.world.flies.reduce((sum,fly)=>sum+fly.energy,0),debt=states.reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    assert.ok(states.every(state=>state.charge.operationsBilled===state.work.scalarOperations));
    assert.ok(Math.abs(this.world.metrics().accountingError)<1e-7);
    return {tick:this.world.tick,founders:this.founderIds.length,survivors:this.world.flies.length,physicalEnergy:energy,startingEnergy:this.startingEnergy,startingDebt:this.startingDebt,outstandingEnergy:debt,
      budgetAdjustedEnergyPerFounder:(energy-this.startingEnergy-debt+this.startingDebt)/this.founderIds.length,
      scalarOperations:states.reduce((sum,state)=>sum+state.work.scalarOperations,0),incurredEnergy:states.reduce((sum,state)=>sum+state.charge.incurredEnergy,0),paidEnergy:states.reduce((sum,state)=>sum+state.charge.paidEnergy,0),
      encodedBytes:states.reduce((sum,state)=>sum+encodedStateBytes(state),0),accountingResidual:this.world.metrics().accountingError,statistics:structuredClone(this.statistics)};
  }
  checkpoint(includeAnchors=true){const {world,anchors,...state}=this;return {schema:1,kind:'coverage-world',world:world.checkpoint(),state:structuredClone(state),anchors:includeAnchors?structuredClone(anchors):{}};}
  static restore(checkpoint,emit=null){
    assert.equal(checkpoint.schema,1);assert.equal(checkpoint.kind,'coverage-world');const run=Object.create(CoverageExperiment.prototype);
    Object.assign(run,structuredClone(checkpoint.state));run.world=World.restore(checkpoint.world);run.anchors=structuredClone(checkpoint.anchors);run.attach(emit);return run;
  }
  static fork(anchor,{phase='A',seed,mode='current',fixedMove=null,emit=null}){
    assert.ok(['current','reset','native-full'].includes(mode));assert.ok(fixedMove===null||[-1,0,1].includes(fixedMove));
    const run=CoverageExperiment.restore(anchor,emit);run.anchors={};run.probe=true;run.finished=false;run.phaseEnd=run.world.tick+256;run.transfer=phase==='transfer';run.fixedMove=fixedMove;
    const startingDebt=Object.values(run.learners).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    if(mode==='native-full'){
      for(const id of run.founderIds){const old=run.learners[id];billSarsaWork(old,run.pricing);const state=bareBody(id);state.charge={...old.charge,operationsBilled:0,storageBytes:0};state.lastDecisionTick=run.world.tick;state.lastObservedTick=run.world.tick;run.learners[id]=state;}
      run.arm='native-full';
    }else if(run.arm!=='native-full')for(const state of Object.values(run.learners)){
      if(mode==='reset')resetCoverageTaste(state);
      freezeCoverageTaste(state);billSarsaWork(state,run.pricing);
    }
    run.world.config.cueForaging=!run.transfer;
    run.resource=run.transfer?enterContinualPhase(run.world,CONTINUAL_PHASES[0],seed):enterCuePhase(run.world,CONTINUAL_PHASES.find(item=>item.id===phase),seed,run.codebook);
    run.startingEnergy=run.world.flies.reduce((sum,fly)=>sum+fly.energy,0);run.startingDebt=startingDebt;
    run.statistics={};return run;
  }
}
