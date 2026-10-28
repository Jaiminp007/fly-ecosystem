import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {billSarsaWork,chargeForStep,encodedStateBytes} from './sarsa-experiment.mjs';
import {CONTINUAL_PHASES,enterContinualPhase} from './continual-regimes.mjs';
import {digest} from './intervention-study.mjs';

const blank=()=>[0,0,0,0];
export function visibleTargetPair(fly,patches,work){
  let first=null,second=null,firstScore=0,secondScore=0;
  for(const patch of patches){
    work.scalarOperations++;
    if(patch.amount<=.06)continue;
    const dx=patch.x-fly.x,dy=patch.y-fly.y,distance=Math.hypot(dx,dy),score=patch.amount/(distance+20);
    work.scalarOperations+=8;
    if(score>firstScore){second=first;secondScore=firstScore;first={patch,distance,dx,dy};firstScore=score;}
    else if(score>secondScore){second={patch,distance,dx,dy};secondScore=score;}
  }
  return [first,second].map(target=>{
    if(!target)return blank();
    const unwrapped=Math.atan2(target.dy,target.dx)-fly.heading,angle=Math.atan2(Math.sin(unwrapped),Math.cos(unwrapped));
    work.scalarOperations+=9;
    return [target.patch.amount,target.distance,Math.cos(angle),Math.sin(angle)];
  });
}
export function harvestRateChoice(targets,speed,work){
  assert.ok(speed>0);const rates=targets.map(([amount,distance,cosine,sine])=>{
    work.scalarOperations+=15;
    const travel=Math.max(0,distance-15)/speed,rotation=distance>15?Math.abs(Math.atan2(sine,cosine))/2.8:0;
    return amount/(travel+rotation+amount/8+.1);
  });
  work.scalarOperations++;return {choice:rates[1]>rates[0]?1:0,rates};
}

export class AlternativeTargetTransfer{
  constructor(anchor,seed,mode,{observer=null}={}){
    assert.ok(mode===0||mode===1);this.world=World.restore(anchor.world);this.pricing=structuredClone(anchor.state.pricing);
    this.founderIds=[...anchor.state.founderIds];this.controllers={};
    const inherited=structuredClone(anchor.state.learners);
    for(const id of this.founderIds){
      const old=inherited[id];billSarsaWork(old,this.pricing);
      this.controllers[id]={agentId:id,mode,targets:[blank(),blank()],selected:0,speed:this.world.flies.find(fly=>fly.id===id)?.genome.traits.speed??0,
        lastDecisionTick:this.world.tick-1,lastObservedTick:this.world.tick,work:{scalarOperations:0},charge:{...old.charge,operationsBilled:0,storageBytes:0}};
    }
    this.world.config.cueForaging=false;enterContinualPhase(this.world,CONTINUAL_PHASES[0],seed);
    this.startWorldSha256=digest(this.world.checkpoint());this.startTick=this.world.tick;this.endTick=this.startTick+256;
    this.startingEnergy=this.world.flies.reduce((sum,fly)=>sum+fly.energy,0);
    this.startingDebt=Object.values(this.controllers).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    this.statistics={decisions:0,alternativeRecommendations:0,alternativeExecuted:0,intake:0,physicalCosts:0};this.attach(observer);
  }
  attach(observer){
    Object.defineProperty(this,'observer',{value:observer,enumerable:false,writable:true,configurable:true});
    const original=this.world.sensors.bind(this.world);
    Object.defineProperty(this.world,'sensors',{enumerable:false,configurable:true,value:(fly,foodIndex,agentIndex,challenge)=>{
      let sensed=[];
      const sharedIndex={nearby:(body,radius)=>{sensed=foodIndex.nearby(body,radius);return sensed;}};
      const raw=original(fly,sharedIndex,agentIndex,challenge),state=this.controllers[fly.id];
      state.targets=visibleTargetPair(fly,sensed,state.work);
      if(state.targets[0][0]>0){assert.ok(Math.abs(state.targets[0][2]-raw[0])<1e-12);assert.ok(Math.abs(state.targets[0][3]-(raw[2]-raw[1]))<1e-12);}
      return raw;
    }});
  }
  checkpoint(){const {world,...state}=this;return {schema:1,kind:'alternative-target-transfer',world:world.checkpoint(),state:structuredClone(state)};}
  static restore(checkpoint,{observer=null}={}){
    assert.equal(checkpoint.kind,'alternative-target-transfer');const run=Object.create(AlternativeTargetTransfer.prototype);
    Object.assign(run,structuredClone(checkpoint.state));run.world=World.restore(checkpoint.world);run.attach(observer);return run;
  }
  step(){
    if(this.world.tick>=this.endTick||!this.world.flies.length)return false;
    this.world.step((fly,raw,tick)=>{
      const state=this.controllers[fly.id],recommendation=harvestRateChoice(state.targets,state.speed,state.work);
      state.selected=state.mode===1?recommendation.choice:0;state.lastDecisionTick=tick;state.work.scalarOperations+=7;
      const sine=state.selected===0?raw[2]-raw[1]:state.targets[1][3],turn=Math.tanh(2*sine+1.8*(raw[10]-raw[11]));
      const outputs=[turn,1,1,-1,0],bill=chargeForStep(state,this.pricing);
      this.statistics.decisions++;this.statistics.alternativeRecommendations+=recommendation.choice;this.statistics.alternativeExecuted+=state.selected;
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        state.lastObservedTick=this.world.tick;this.statistics.intake+=receipt.beneficialEaten;this.statistics.physicalCosts+=receipt.cost;
        this.observer?.({id:fly.id,tick,raw:[...raw],targets:structuredClone(state.targets),...recommendation,selected:state.selected,outputs:[...fly.lastActions],receipt});
      }};
    });
    for(const state of Object.values(this.controllers))billSarsaWork(state,this.pricing);
    return true;
  }
  advance(){while(this.step());return this.endpoint();}
  endpoint(){
    const states=Object.values(this.controllers),energy=this.world.flies.reduce((sum,fly)=>sum+fly.energy,0),debt=states.reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    assert.ok(states.every(state=>state.charge.operationsBilled===state.work.scalarOperations));
    assert.ok(Math.abs(this.world.metrics().accountingError)<1e-7);
    return {tick:this.world.tick,founders:this.founderIds.length,survivors:this.world.flies.length,physicalEnergy:energy,startingEnergy:this.startingEnergy,startingDebt:this.startingDebt,
      outstandingEnergy:debt,budgetAdjustedEnergyPerFounder:(energy-this.startingEnergy-debt+this.startingDebt)/this.founderIds.length,
      scalarOperations:states.reduce((sum,state)=>sum+state.work.scalarOperations,0),incurredEnergy:states.reduce((sum,state)=>sum+state.charge.incurredEnergy,0),paidEnergy:states.reduce((sum,state)=>sum+state.charge.paidEnergy,0),
      controllerBytes:states.reduce((sum,state)=>sum+encodedStateBytes(state),0),accountingResidual:this.world.metrics().accountingError,statistics:structuredClone(this.statistics)};
  }
}
