// Evaluation-only actuator diagnostic. No learned policies or platform imports.
import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {CueExperiment,motorPrimitive} from './cue-foraging.mjs';
import {CONTINUAL_PHASES,enterContinualPhase} from './continual-regimes.mjs';
import {chargeForStep,encodedStateBytes} from './sarsa-experiment.mjs';
import {advanceRng,digest} from './intervention-study.mjs';
export const TRANSFER_AUTHORITY_ARMS=['fast','slow','tasteSpeed','randomSpeed'];
function state(id,seed,mode,dead){return {agentId:id,mode,rngState:seed,heldSpeed:1,decisions:0,ticks:0,lastDecisionTick:0,lastObservedTick:1536,dead,
  work:{scalarOperations:0},charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0}};}

export function simulateTransferAuthority(p,h,emit=()=>{}){
  const warm=new CueExperiment({history:h,arm:'valueOracle',reference:p.reference,pricing:p.pricing,emit:e=>emit({stage:'warmup',...e})});
  emit({stage:'warmup',program:'authority',type:'start',arm:'valueOracle',seed:h.seed,codebook:warm.codebook,learners:warm.learners,
    initialEnergy:warm.world.initialEnergy,initialFoodInventory:warm.world.food.reduce((s,v)=>s+v.amount,0)});
  warm.advance(1536);for(const id of Object.keys(warm.receipts))warm.flushLedger(id);
  emit({stage:'warmup',program:'authority',type:'end',arm:'valueOracle',learners:warm.learners,endpoint:warm.endpoint()});
  const warmup={endpoint:warm.endpoint(),finalSha256:digest(warm.checkpoint())},arms={};
  for(const mode of TRANSFER_AUTHORITY_ARMS){
    const world=World.restore(warm.world.checkpoint());world.config.cueForaging=false;world.config.learning=false;
    world.config.episodicParameters.memoryLearning=false;world.config.episodicParameters.neuralLearning=false;
    enterContinualPhase(world,CONTINUAL_PHASES[0],h.transferSeed);
    const start=world.tick,end=start+256,initialEnergy=world.flies.reduce((s,f)=>s+f.energy,0),initialWorldEnergy=world.energy(),initialTotals=structuredClone(world.totals),
      initialWorldSha256=digest(world.checkpoint()),learners=Object.fromEntries(warm.founderIds.map(id=>[id,state(id,(h.seed^Math.imul(id,2654435761))>>>0||1,mode,!world.flies.some(f=>f.id===id))])),receipts={};
    function flush(id,discarded=0){const r=receipts[id];if(!r)return;r.discarded=discarded;r.finalEnergy-=discarded;emit({stage:'probe',type:'ledger',arm:mode,...r});delete receipts[id];}
    emit({stage:'probe',type:'start',arm:mode,initialWorldSha256,initialEnergy,initialWorldEnergy,initialTotals,bodyEnergy:Object.fromEntries(world.flies.map(f=>[f.id,f.energy])),learners});
    while(world.tick<end&&world.flies.length){const before=[...world.flies];world.step((fly,raw,tick)=>{
      const s=learners[fly.id];if((tick-start-1)%8===0){flush(fly.id);s.work.scalarOperations++;s.heldSpeed=mode==='slow'?-1:mode==='tasteSpeed'&&raw[13]>0?-1:1;
        if(mode==='randomSpeed'){s.rngState=advanceRng(s.rngState);s.heldSpeed=s.rngState/4294967296<.5?-1:1;s.work.scalarOperations+=6;}
        s.decisions++;s.lastDecisionTick=tick;emit({stage:'probe',type:'decision',arm:mode,agentId:fly.id,tick,previousIntake:raw[13],choice:s.heldSpeed,rngState:s.rngState});}
      s.ticks++;s.work.scalarOperations+=6;const bill=chargeForStep(s,p.pricing);
      return {...bill,afterController:outputs=>{const motor=motorPrimitive(raw,1,s.heldSpeed<0);for(let j=0;j<5;j++)outputs[j]=motor[j];},afterStep:r=>{
        const old=receipts[fly.id];if(old){old.steps++;old.finalEnergy=r.finalEnergy;old.cost+=r.cost;old.paidExtra+=r.paidExtra;old.beneficialEaten+=r.beneficialEaten;old.byteSeconds+=s.charge.storageBytes*.1;}
        else receipts[fly.id]={agentId:fly.id,tick,steps:1,initialEnergy:r.initialEnergy,finalEnergy:r.finalEnergy,cost:r.cost,paidExtra:r.paidExtra,beneficialEaten:r.beneficialEaten,byteSeconds:s.charge.storageBytes*.1};}};
    });for(const f of before){const s=learners[f.id];s.lastObservedTick=world.tick;s.dead=!world.flies.includes(f);if(s.dead)flush(f.id,f.energy);}}
    for(const id of Object.keys(receipts))flush(id);
    const debt=Object.values(learners).reduce((s,v)=>s+v.charge.outstandingEnergy,0),endpoint={tick:world.tick,founders:warm.founderIds.length,survivors:world.flies.length,survival:world.flies.length/warm.founderIds.length,
      budgetAdjustedEnergyPerFounder:(world.flies.reduce((s,f)=>s+f.energy,0)-initialEnergy-debt)/warm.founderIds.length,outstandingEnergy:debt,
      accountingResidual:world.metrics().accountingError,foodInventory:world.food.reduce((s,p)=>s+p.amount,0),totals:structuredClone(world.totals),
      scalarOperations:Object.values(learners).reduce((s,v)=>s+v.work.scalarOperations,0),encodedBytes:Object.values(learners).reduce((s,v)=>s+encodedStateBytes(v),0)};
    assert.ok(Math.abs(endpoint.accountingResidual)<1e-6);
    emit({stage:'probe',type:'end',arm:mode,endpoint,learners});arms[mode]={endpoint,initialWorldSha256,finalSha256:digest({world:world.checkpoint(),learners})};
  }
  assert.equal(new Set(Object.values(arms).map(v=>v.initialWorldSha256)).size,1);
  return {schema:1,history:h,warmup,arms};
}
