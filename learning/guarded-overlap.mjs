import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {OverlapTransfer,overlapRecommendation} from './overlap-harvest.mjs';
import {chargeForStep,billSarsaWork} from './sarsa-experiment.mjs';

export function overlapGuard(point,raw,energy,speed,lastCost,work){
  assert.ok(speed>0&&lastCost>=0&&Number.isFinite(energy));
  const distance=Math.hypot(...point),turnTicks=Math.abs(Math.atan2(point[1],point[0]))/.28,travelTicks=Math.max(0,distance-15)/(speed*.1);
  const requiredEnergy=lastCost*(turnTicks+travelTicks),wall=raw[10]!==0||raw[11]!==0,viable=energy>requiredEnergy;
  work.scalarOperations+=15;return {requiredEnergy,wall,viable};
}
export class GuardedOverlapTransfer extends OverlapTransfer{
  constructor(anchor,seed,mode,options={}){
    assert.ok([0,1,2].includes(mode));super(anchor,seed,mode===0?0:1,options);
    for(const state of Object.values(this.controllers)){
      const fly=this.world.flies.find(fly=>fly.id===state.agentId);
      Object.assign(state,{mode,speed:fly?.genome.traits.speed??1,lastCost:fly?.lastEnergyCost??0,ownEnergy:fly?.energy??0,requiredEnergy:0,wall:false,viable:false});
    }
    this.statistics.wallBlocked=0;this.statistics.energyBlocked=0;
  }
  step(){
    if(this.world.tick>=this.endTick||!this.world.flies.length)return false;
    this.world.step((fly,raw,tick)=>{
      const state=this.controllers[fly.id],recommendation=overlapRecommendation(state.points,state.work);
      state.point=recommendation.point;state.pair=recommendation.pair;state.lastDecisionTick=tick;state.ownEnergy=fly.energy-state.charge.outstandingEnergy;state.work.scalarOperations++;
      const guard=overlapGuard(state.point,raw,state.ownEnergy,state.speed,state.lastCost,state.work);Object.assign(state,guard);
      const recommended=state.pair[0]>=0,midpoint=recommended&&(state.mode===2||state.mode===1&&!guard.wall&&guard.viable);
      const distance=Math.hypot(...state.point),sine=midpoint&&distance>0?state.point[1]/distance:raw[2]-raw[1];state.work.scalarOperations+=16;
      const outputs=[Math.tanh(2*sine+1.8*(raw[10]-raw[11])),1,1,-1,0],bill=chargeForStep(state,this.pricing);
      this.statistics.decisions++;this.statistics.midpointRecommendations+=Number(recommended);this.statistics.midpointExecuted+=Number(midpoint);
      this.statistics.wallBlocked+=Number(recommended&&guard.wall);this.statistics.energyBlocked+=Number(recommended&&!guard.viable);
      this.observer?.({type:'decision',id:fly.id,tick,raw:[...raw],points:structuredClone(state.points),...recommendation,guard,ownEnergy:state.ownEnergy,speed:state.speed,lastCost:state.lastCost,midpoint,outputs,requestedExtra:bill.energyCost,storageBytes:state.charge.storageBytes,operations:state.work.scalarOperations});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        state.lastObservedTick=this.world.tick;state.lastCost=receipt.cost;this.statistics.intake+=receipt.beneficialEaten;this.statistics.physicalCosts+=receipt.cost;this.observer?.({type:'physical',...receipt});
      }};
    });
    for(const state of Object.values(this.controllers))billSarsaWork(state,this.pricing);return true;
  }
  checkpoint(){const value=super.checkpoint();value.kind='guarded-overlap-transfer';return value;}
  static restore(checkpoint,{observer=null}={}){
    assert.equal(checkpoint.schema,1);assert.equal(checkpoint.kind,'guarded-overlap-transfer');const run=Object.create(GuardedOverlapTransfer.prototype);
    Object.assign(run,structuredClone(checkpoint.state));run.world=World.restore(checkpoint.world);run.attach(observer);return run;
  }
}
