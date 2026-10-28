import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {OdorRoutedExperiment} from './odor-routed-experiment.mjs';
import {updateContinualResources} from './continual-regimes.mjs';
import {contactObservation} from './contact-observation.mjs';
import {chooseOdorRoutedTaste,observeOdorRoutedTaste} from './odor-routed-taste.mjs';
import {incrementalOverlapRecommendation} from './incremental-overlap.mjs';
import {overlapGuard} from './guarded-overlap.mjs';
import {chooseCueSharedSteering,terminateCueSharedSteering} from './cue-shared-steering.mjs';
import {applyCueSharedComponentMask} from './cue-shared-component-mask.mjs';
import {encodedStateBytes,billSarsaWork,chargeForStep} from './sarsa-experiment.mjs';

export class MixedFocalTransfer extends OdorRoutedExperiment{
  static create(anchor,{seed,cheapIds=[],emit=null}){
    const run=OdorRoutedExperiment.fork(anchor,{phase:'transfer',seed,steeringMode:'learned',compactFrozen:true});
    assert.equal(run.steeringLearner,'cue-shared');assert.equal(run.spatialSelector,'incremental');
    const alive=new Set(run.world.flies.map(fly=>fly.id));assert.ok(Array.isArray(cheapIds)&&new Set(cheapIds).size===cheapIds.length&&cheapIds.every(id=>alive.has(id)));
    run.cheapIds=[...cheapIds].sort((left,right)=>left-right);
    for(const fly of run.world.flies){
      const old=run.learners[fly.id];applyCueSharedComponentMask(old,'residual-only');billSarsaWork(old,run.pricing);
      const scan=encodedStateBytes(old);old.work.scalarOperations+=scan;old.charge.storageBytes=0;billSarsaWork(old,run.pricing);
      if(run.cheapIds.includes(fly.id))run.learners[fly.id]={agentId:fly.id,work:{scalarOperations:0},charge:{...old.charge,operationsBilled:0,storageBytes:0},lastDecisionTick:run.world.tick,lastObservedTick:run.world.tick};
    }
    Object.setPrototypeOf(run,MixedFocalTransfer.prototype);run.installCheapSensor();run.attach(emit);return run;
  }
  installCheapSensor(){
    const routed=this.world.sensors.bind(this.world);
    Object.defineProperty(this.world,'sensors',{enumerable:false,configurable:true,value:(fly,foodIndex,agentIndex,challenge)=>this.cheapIds.includes(fly.id)?
      World.prototype.sensors.call(this.world,fly,foodIndex,agentIndex,challenge):routed(fly,foodIndex,agentIndex,challenge)});
  }
  static restore(checkpoint,emit=null){
    const run=OdorRoutedExperiment.restore(checkpoint,emit);assert.ok(Array.isArray(run.cheapIds));Object.setPrototypeOf(run,MixedFocalTransfer.prototype);run.installCheapSensor();return run;
  }
  step(){
    if(this.finished||!this.world.flies.length)return false;
    if(this.world.tick===this.phaseEnd){this.finished=true;return false;}
    assert.ok(this.probe&&this.transfer&&!this.world.config.cueForaging);updateContinualResources(this.world,this.resource);
    const stats=this.statistics.transfer??={decisions:0,moves:[0,0,0],accept:0,intake:0,toxin:0,cost:0,steering:[0,0],available:0},before=[...this.world.flies];
    this.world.step((fly,raw,tick)=>{
      const state=this.learners[fly.id];
      if(this.cheapIds.includes(fly.id)){
        state.lastDecisionTick=tick;state.work.scalarOperations+=8;
        const choice={move:1,action:2,accept:true},outputs=[Math.tanh(2*(raw[2]-raw[1])+1.8*(raw[10]-raw[11])),1,1,-1,0],bill=chargeForStep(state,this.pricing);
        stats.decisions++;stats.moves[2]++;stats.accept++;stats.steering[0]++;
        this.emit?.({type:'decision',id:fly.id,tick,mode:'cheap',own:null,raw,choice,outputs,requestedExtra:bill.energyCost,work:state.work.scalarOperations,storageBytes:state.charge.storageBytes});
        return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{stats.intake+=receipt.beneficialEaten;stats.toxin+=receipt.toxinDamage;stats.cost+=receipt.cost;this.emit?.({type:'physical',...receipt});}};
      }
      const observation=contactObservation(fly,this.world.food,fly.sensedCue,state.work);observation.cue=[0,0,0,0];observation.odorPresent=false;state.work.scalarOperations++;
      const own={agentId:fly.id,tick,energy:fly.energy-state.charge.outstandingEnergy,raw,...observation};
      const choice=chooseOdorRoutedTaste(state,own),recommendation=incrementalOverlapRecommendation(state.spatialPoints,state.work,state.scratch);
      const guard=overlapGuard(recommendation.point,raw,own.energy,fly.genome.traits.speed,state.lastCost,state.work);
      const available=recommendation.pair[0]>=0&&!guard.wall&&guard.viable,distance=Math.hypot(...recommendation.point);
      const features=[1,Math.max(0,Math.min(1,own.energy/120)),raw[10],raw[11],raw[13],Math.max(-1,Math.min(1,raw[12])),Math.min(1,distance/fly.genome.traits.sense),distance>0?recommendation.point[1]/distance:0];
      state.work.scalarOperations+=14;const steeringWork=state.steering.work.scalarOperations;
      const steering=chooseCueSharedSteering(state.steering,{agentId:fly.id,tick,energy:own.energy,features,midpointAvailable:available,cue:own.cue});
      state.work.scalarOperations+=state.steering.work.scalarOperations-steeringWork;
      const sine=steering.action===1&&distance>0?recommendation.point[1]/distance:raw[2]-raw[1];
      const outputs=[Math.tanh(2*sine+1.8*(raw[10]-raw[11])),choice.move,choice.accept?1:-1,-1,0];state.work.scalarOperations+=10;
      stats.decisions++;stats.moves[choice.action]++;stats.accept+=Number(choice.accept);stats.steering[steering.action]++;stats.available+=Number(available);
      const bill=chargeForStep(state,this.pricing);
      this.emit?.({type:'decision',id:fly.id,tick,mode:'residual',own,choice,steering,features,available,recommendation,guard,outputs,requestedExtra:bill.energyCost,work:state.work.scalarOperations,steeringWork:state.steering.work.scalarOperations,storageBytes:state.charge.storageBytes});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{state.lastCost=receipt.cost;stats.intake+=receipt.beneficialEaten;stats.toxin+=receipt.toxinDamage;stats.cost+=receipt.cost;this.emit?.({type:'physical',...receipt});}};
    });
    for(const fly of before){
      const state=this.learners[fly.id],alive=this.world.flies.includes(fly);
      if(this.cheapIds.includes(fly.id))state.lastObservedTick=this.world.tick;
      else{
        state.work.scalarOperations++;const own={agentId:fly.id,tick:this.world.tick,energy:(alive?fly.energy:0)-state.charge.outstandingEnergy,lastFood:fly.lastFood,terminal:!alive};
        observeOdorRoutedTaste(state,own);if(!alive){const work=state.steering.work.scalarOperations;terminateCueSharedSteering(state.steering,own);state.work.scalarOperations+=state.steering.work.scalarOperations-work;}
        this.emit?.({type:'observe',own});
      }
      billSarsaWork(state,this.pricing);
    }
    return true;
  }
}
