import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {digest} from './intervention-study.mjs';
import {billSarsaWork,chargeForStep,encodedStateBytes} from './sarsa-experiment.mjs';
import {CONTINUAL_PHASES,enterContinualPhase} from './continual-regimes.mjs';

export function overlapObservation(fly,patches,work){
  const cosine=Math.cos(fly.heading),sine=Math.sin(fly.heading),points=[];work.scalarOperations+=2;
  for(const patch of patches){
    work.scalarOperations++;if(patch.amount<=.06)continue;
    const dx=patch.x-fly.x,dy=patch.y-fly.y;
    points.push([dx*cosine+dy*sine,-dx*sine+dy*cosine,patch.amount]);work.scalarOperations+=9;
  }
  return points;
}
export function overlapRecommendation(points,work){
  let score=0,point=[0,0],pair=[-1,-1];
  for(const [forward,lateral,amount]of points){
    const value=amount/(Math.hypot(forward,lateral)+20);work.scalarOperations+=4;
    if(value>score){score=value;point=[forward,lateral];}
  }
  for(let first=0;first<points.length;first++)for(let second=first+1;second<points.length;second++){
    const left=points[first],right=points[second],distance=Math.hypot(left[0]-right[0],left[1]-right[1]);work.scalarOperations+=4;
    if(distance>30)continue;
    const midpoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...midpoint)+20);work.scalarOperations+=9;
    if(value>score){score=value;point=midpoint;pair=[first,second];}
  }
  return {point,pair,score};
}
export class OverlapTransfer{
  constructor(anchor,seed,mode,{observer=null}={}){
    assert.ok(mode===0||mode===1);this.world=World.restore(anchor.world);this.pricing=structuredClone(anchor.state.pricing);
    this.founderIds=[...anchor.state.founderIds];this.controllers={};
    const inherited=structuredClone(anchor.state.learners);
    for(const id of this.founderIds){
      const old=inherited[id];billSarsaWork(old,this.pricing);
      this.controllers[id]={agentId:id,mode,points:[],point:[0,0],pair:[-1,-1],lastDecisionTick:this.world.tick-1,lastObservedTick:this.world.tick,work:{scalarOperations:0},charge:{...old.charge,operationsBilled:0,storageBytes:0}};
    }
    this.world.config.cueForaging=false;enterContinualPhase(this.world,CONTINUAL_PHASES[0],seed);
    this.startWorldSha256=digest(this.world.checkpoint());this.endTick=this.world.tick+256;
    this.startingEnergy=this.world.flies.reduce((sum,fly)=>sum+fly.energy,0);this.startingDebt=Object.values(this.controllers).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    this.statistics={decisions:0,midpointRecommendations:0,midpointExecuted:0,intake:0,physicalCosts:0};this.attach(observer);
  }
  attach(observer){
    Object.defineProperty(this,'observer',{value:observer,enumerable:false,writable:true,configurable:true});
    const original=this.world.sensors.bind(this.world);
    Object.defineProperty(this.world,'sensors',{enumerable:false,configurable:true,value:(fly,foodIndex,agentIndex,challenge)=>{
      let sensed=[];const shared={nearby:(body,radius)=>{sensed=foodIndex.nearby(body,radius);return sensed;}};
      const raw=original(fly,shared,agentIndex,challenge),state=this.controllers[fly.id];state.points=overlapObservation(fly,sensed,state.work);return raw;
    }});
  }
  step(){
    if(this.world.tick>=this.endTick||!this.world.flies.length)return false;
    this.world.step((fly,raw,tick)=>{
      const state=this.controllers[fly.id],recommendation=overlapRecommendation(state.points,state.work),midpoint=state.mode===1&&recommendation.pair[0]>=0;
      state.point=recommendation.point;state.pair=recommendation.pair;state.lastDecisionTick=tick;
      const distance=Math.hypot(...state.point),sine=midpoint&&distance>0?state.point[1]/distance:raw[2]-raw[1];state.work.scalarOperations+=12;
      const outputs=[Math.tanh(2*sine+1.8*(raw[10]-raw[11])),1,1,-1,0],bill=chargeForStep(state,this.pricing);
      this.statistics.decisions++;this.statistics.midpointRecommendations+=Number(recommendation.pair[0]>=0);this.statistics.midpointExecuted+=Number(midpoint);
      this.observer?.({type:'decision',id:fly.id,tick,raw:[...raw],points:structuredClone(state.points),...recommendation,midpoint,outputs,requestedExtra:bill.energyCost,storageBytes:state.charge.storageBytes,operations:state.work.scalarOperations});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        state.lastObservedTick=this.world.tick;this.statistics.intake+=receipt.beneficialEaten;this.statistics.physicalCosts+=receipt.cost;this.observer?.({type:'physical',...receipt});
      }};
    });
    for(const state of Object.values(this.controllers))billSarsaWork(state,this.pricing);return true;
  }
  advance(){while(this.step());return this.endpoint();}
  endpoint(){
    const states=Object.values(this.controllers),energy=this.world.flies.reduce((sum,fly)=>sum+fly.energy,0),debt=states.reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    assert.ok(states.every(state=>state.charge.operationsBilled===state.work.scalarOperations));assert.ok(Math.abs(this.world.metrics().accountingError)<1e-7);
    return {tick:this.world.tick,founders:this.founderIds.length,survivors:this.world.flies.length,physicalEnergy:energy,startingEnergy:this.startingEnergy,startingDebt:this.startingDebt,outstandingEnergy:debt,
      budgetAdjustedEnergyPerFounder:(energy-this.startingEnergy-debt+this.startingDebt)/this.founderIds.length,
      scalarOperations:states.reduce((sum,state)=>sum+state.work.scalarOperations,0),incurredEnergy:states.reduce((sum,state)=>sum+state.charge.incurredEnergy,0),paidEnergy:states.reduce((sum,state)=>sum+state.charge.paidEnergy,0),
      encodedBytes:states.reduce((sum,state)=>sum+encodedStateBytes(state),0),accountingResidual:this.world.metrics().accountingError,statistics:structuredClone(this.statistics)};
  }
  checkpoint(){const {world,...state}=this;return {schema:1,kind:'overlap-transfer',world:world.checkpoint(),state:structuredClone(state)};}
  static restore(checkpoint,{observer=null}={}){
    assert.equal(checkpoint.schema,1);assert.equal(checkpoint.kind,'overlap-transfer');const run=Object.create(OverlapTransfer.prototype);
    Object.assign(run,structuredClone(checkpoint.state));run.world=World.restore(checkpoint.world);run.attach(observer);return run;
  }
}
