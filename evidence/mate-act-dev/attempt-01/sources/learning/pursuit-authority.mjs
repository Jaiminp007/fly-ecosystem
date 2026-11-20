import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {CueExperiment,motorPrimitive} from './cue-foraging.mjs';
import {CONTINUAL_PHASES,enterContinualPhase} from './continual-regimes.mjs';
import {chargeForStep,encodedStateBytes} from './sarsa-experiment.mjs';
import {advanceRng,digest} from './intervention-study.mjs';

export const PURSUIT_ARMS=['legacyFast','pursuit','refuse','random'];

export function pursuitMotor(raw,action){
  assert.ok([-1,1].includes(action));
  const magnitude=raw[0]**2+raw[1]**2+raw[2]**2;
  if(!(magnitude>0))return {outputs:[Math.tanh(1.8*(raw[10]-raw[11])),0,action,-1,0],operations:9};
  let bearing=Math.atan2(action*(raw[2]-raw[1]),action*raw[0]);
  if(bearing===-Math.PI)bearing=Math.PI;
  const turn=Math.max(-1,Math.min(1,bearing/.28)),move=Math.abs(bearing)>.28?-1:0;
  return {outputs:[turn,move,action,-1,0],operations:16};
}

function state(id,seed,mode,dead){return {agentId:id,mode,rngState:seed,heldAction:1,decisions:0,ticks:0,lastDecisionTick:0,lastObservedTick:1536,dead,
  work:{scalarOperations:0},charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0}};}

export function simulatePursuitAuthority(protocol,history,emit=()=>{}){
  const warm=new CueExperiment({history,arm:'valueOracle',reference:protocol.reference,pricing:protocol.pricing,emit:event=>emit({stage:'warmup',...event})});
  emit({stage:'warmup',program:'authority',type:'start',arm:'valueOracle',seed:history.seed,codebook:warm.codebook,learners:warm.learners,
    initialEnergy:warm.world.initialEnergy,initialFoodInventory:warm.world.food.reduce((sum,patch)=>sum+patch.amount,0)});
  warm.advance(1536);for(const id of Object.keys(warm.receipts))warm.flushLedger(id);
  emit({stage:'warmup',program:'authority',type:'end',arm:'valueOracle',learners:warm.learners,endpoint:warm.endpoint()});
  const warmup={endpoint:warm.endpoint(),finalSha256:digest(warm.checkpoint())},arms={};
  for(const mode of PURSUIT_ARMS){
    const world=World.restore(warm.world.checkpoint());world.config.cueForaging=false;world.config.learning=false;
    world.config.episodicParameters.memoryLearning=false;world.config.episodicParameters.neuralLearning=false;
    enterContinualPhase(world,CONTINUAL_PHASES[0],history.transferSeed);
    const start=world.tick,end=start+256,initialEnergy=world.flies.reduce((sum,fly)=>sum+fly.energy,0),initialWorldEnergy=world.energy(),initialTotals=structuredClone(world.totals),
      initialWorldSha256=digest(world.checkpoint()),learners=Object.fromEntries(warm.founderIds.map(id=>[id,state(id,(history.seed^Math.imul(id,2654435761))>>>0||1,mode,!world.flies.some(fly=>fly.id===id))])),receipts={};
    function flush(id,discarded=0){const receipt=receipts[id];if(!receipt)return;receipt.discarded=discarded;receipt.finalEnergy-=discarded;
      emit({stage:'probe',type:'ledger',arm:mode,...receipt});delete receipts[id];}
    emit({stage:'probe',type:'start',arm:mode,initialWorldSha256,initialEnergy,initialWorldEnergy,initialTotals,bodyEnergy:Object.fromEntries(world.flies.map(fly=>[fly.id,fly.energy])),learners});
    while(world.tick<end&&world.flies.length){const before=[...world.flies];world.step((fly,raw,tick)=>{
      const controller=learners[fly.id];
      if((tick-start-1)%8===0){
        flush(fly.id);controller.work.scalarOperations++;controller.heldAction=mode==='refuse'?-1:1;
        if(mode==='random'){controller.rngState=advanceRng(controller.rngState);controller.heldAction=controller.rngState/4294967296<.5?-1:1;controller.work.scalarOperations+=6;}
        controller.decisions++;controller.lastDecisionTick=tick;
        emit({stage:'probe',type:'decision',arm:mode,agentId:fly.id,tick,choice:controller.heldAction,rngState:controller.rngState});
      }
      const motor=mode==='legacyFast'?{outputs:motorPrimitive(raw,1,false),operations:6}:pursuitMotor(raw,controller.heldAction);
      controller.ticks++;controller.work.scalarOperations+=motor.operations;
      emit({stage:'probe',type:'motor',arm:mode,agentId:fly.id,tick,sensors:[raw[0],raw[1],raw[2],raw[10],raw[11]],action:controller.heldAction,outputs:motor.outputs,operations:motor.operations});
      const bill=chargeForStep(controller,protocol.pricing);
      return {...bill,afterController:outputs=>{for(let index=0;index<5;index++)outputs[index]=motor.outputs[index];},afterStep:receipt=>{
        const old=receipts[fly.id];
        if(old){old.steps++;old.finalEnergy=receipt.finalEnergy;old.cost+=receipt.cost;old.paidExtra+=receipt.paidExtra;old.beneficialEaten+=receipt.beneficialEaten;old.byteSeconds+=controller.charge.storageBytes*.1;}
        else receipts[fly.id]={agentId:fly.id,tick,steps:1,initialEnergy:receipt.initialEnergy,finalEnergy:receipt.finalEnergy,cost:receipt.cost,paidExtra:receipt.paidExtra,beneficialEaten:receipt.beneficialEaten,byteSeconds:controller.charge.storageBytes*.1};}};
    });for(const fly of before){const controller=learners[fly.id];controller.lastObservedTick=world.tick;controller.dead=!world.flies.includes(fly);if(controller.dead)flush(fly.id,fly.energy);}}
    for(const id of Object.keys(receipts))flush(id);
    const debt=Object.values(learners).reduce((sum,controller)=>sum+controller.charge.outstandingEnergy,0),endpoint={tick:world.tick,founders:warm.founderIds.length,survivors:world.flies.length,survival:world.flies.length/warm.founderIds.length,
      budgetAdjustedEnergyPerFounder:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initialEnergy-debt)/warm.founderIds.length,outstandingEnergy:debt,
      accountingResidual:world.metrics().accountingError,foodInventory:world.food.reduce((sum,patch)=>sum+patch.amount,0),totals:structuredClone(world.totals),
      scalarOperations:Object.values(learners).reduce((sum,controller)=>sum+controller.work.scalarOperations,0),encodedBytes:Object.values(learners).reduce((sum,controller)=>sum+encodedStateBytes(controller),0)};
    assert.ok(Math.abs(endpoint.accountingResidual)<1e-6);
    emit({stage:'probe',type:'end',arm:mode,endpoint,learners});arms[mode]={endpoint,initialWorldSha256,finalSha256:digest({world:world.checkpoint(),learners})};
  }
  assert.equal(new Set(Object.values(arms).map(arm=>arm.initialWorldSha256)).size,1);
  return {schema:1,history,warmup,arms};
}
