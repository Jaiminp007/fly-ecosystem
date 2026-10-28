// Frozen permitted-observation timing diagnostic, proposed with Astra.
import assert from 'node:assert/strict';
import {TasteExperiment} from './taste-experiment.mjs';
import {compactTasteEnergyBody,chooseTasteEnergyAction,observeTasteEnergyBody} from './taste-energy.mjs';
import {contactObservation} from './contact-observation.mjs';
import {tickMotor} from './tick-actor-critic.mjs';
import {chargeForStep,billSarsaWork,encodedStateBytes} from './sarsa-experiment.mjs';
import {enterContinualPhase,updateContinualResources,CONTINUAL_PHASES} from './continual-regimes.mjs';
import {digest} from './intervention-study.mjs';

export const HEADROOM_POLICIES=Object.freeze(['cruise','harvest','alignment']);
export const createTimingState=()=>({started:false,pausing:false,pauseTicks:0,cruiseDue:false,alignmentArmed:true});
export function timingDecision(state,own,policy,work){
  assert.ok(HEADROOM_POLICIES.includes(policy));
  const test=value=>{work.scalarOperations++;return value;};
  if(!test(state.started)){state.started=true;return {action:0,event:'first'};}
  if(policy==='cruise')return {action:0,event:'cruise'};
  const targetPresent=test(own.raw[3]>0),aligned=test(own.raw[0]>=.5);
  if(policy==='alignment'&&!test(state.pausing)&&(!targetPresent||aligned))state.alignmentArmed=true;
  if(test(state.cruiseDue)){state.cruiseDue=false;return {action:0,event:'mandatory-cruise'};}
  const harvest=test(own.raw[13]>0)&&own.contactPresent;
  const continuePause=policy==='harvest'?harvest:!own.contactPresent&&targetPresent&&!aligned;
  const trigger=policy==='harvest'?harvest:state.alignmentArmed&&!own.contactPresent&&targetPresent&&test(own.raw[0]<0);
  if(test(state.pausing)&&!continuePause){
    state.pausing=false;const duration=state.pauseTicks;state.pauseTicks=0;
    const reason=policy==='harvest'?(own.contactPresent?'nonpositive-intake':'lost-contact'):
      own.contactPresent?'contact':!targetPresent?'target-absent':'aligned';
    return {action:0,event:'end-condition',reason,duration}; // this cruise fulfils cooldown
  }
  if(!state.pausing&&trigger){state.pausing=true;state.pauseTicks=0;if(policy==='alignment')state.alignmentArmed=false;}
  if(state.pausing){
    state.pauseTicks++;
    if(test(state.pauseTicks>=4)){
      const duration=state.pauseTicks;state.pausing=false;state.pauseTicks=0;state.cruiseDue=true;
      return {action:2,event:'end-cap',duration};
    }
    return {action:2,event:state.pauseTicks===1?'trigger':'pause'};
  }
  return {action:0,event:'cruise'};
}

export function runTimingHeadroom(anchor,{policy,seed,ticks=256,emit=null}){
  assert.ok(HEADROOM_POLICIES.includes(policy)&&ticks>=1&&ticks<=256);
  const run=TasteExperiment.restore(anchor),timers=Object.fromEntries(run.founderIds.map(id=>[id,createTimingState()]));
  assert.equal(run.program,'taste');assert.equal(run.cruiseSpeed??0,0);
  for(const state of Object.values(run.learners)){assert.equal(state.config.holdTicks,1);compactTasteEnergyBody(state);state.charge.storageBytes=0;}
  const weightsBefore=digest(Object.values(run.learners).map(s=>s.weights));
  run.world.config.cueForaging=false;const resource=enterContinualPhase(run.world,CONTINUAL_PHASES[0],seed);
  run.startingEnergy=run.world.flies.reduce((n,f)=>n+f.energy,0);run.startingDebt=Object.values(run.learners).reduce((n,s)=>n+s.charge.outstandingEnergy,0);
  run.startingOperations=Object.values(run.learners).reduce((n,s)=>n+s.work.scalarOperations,0);
  const startWorldSha256=digest(run.world.checkpoint()),initialCharges=Object.values(run.learners).reduce((n,s)=>n+s.charge.incurredEnergy,0);
  const stats={decisions:0,actions:[0,0,0,0],triggers:0,ends:{},durations:{},selectorOperations:0,beneficialEaten:0,physicalCosts:0,firstActions:[],actionBindings:0};
  for(let step=0;step<ticks&&run.world.flies.length;step++){
    updateContinualResources(run.world,resource);const before=[...run.world.flies];
    run.world.step((fly,raw,tick)=>{
      const state=run.learners[fly.id];assert.equal(state.acquisition,false);assert.equal(state.motorPending,null);
      const observation=contactObservation(fly,run.world.food,fly.sensedCue,state.work);
      const own={agentId:fly.id,tick,energy:fly.energy-state.charge.outstandingEnergy,raw,...observation,cue:[0,0,0,0],odorPresent:false};
      chooseTasteEnergyAction(state,own);
      const count=state.work.scalarOperations,first=!timers[fly.id].started,decision=timingDecision(timers[fly.id],own,policy,state.work);
      stats.selectorOperations+=state.work.scalarOperations-count;
      const action=decision.action;assert.ok(action===0||action===2);
      state.credit.pending.action=action;state.hold.cruise=action===0;stats.actionBindings++;
      if(first)stats.firstActions.push(action);if(decision.event==='trigger'||decision.event==='end-cap'&&decision.duration===1)stats.triggers++;
      if(decision.event.startsWith('end-')){const reason=decision.reason??'cap';stats.ends[reason]=(stats.ends[reason]??0)+1;stats.durations[decision.duration]=(stats.durations[decision.duration]??0)+1;}
      const outputs=tickMotor(state,raw,action);
      // The stored controller is (shadow learner, selector fields); the spread
      // is an encoding view, sharing the actual work/charge ledger, not a copy.
      const bill=chargeForStep({...state,timing:timers[fly.id]},run.pricing);
      stats.decisions++;stats.actions[action]++;
      emit?.({type:'decision',own,action,decision,selector:structuredClone(timers[fly.id]),storageBytes:state.charge.storageBytes});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:r=>{stats.beneficialEaten+=r.beneficialEaten;stats.physicalCosts+=r.cost;}};
    });
    for(const fly of before){
      const state=run.learners[fly.id],alive=run.world.flies.includes(fly);
      observeTasteEnergyBody(state,{agentId:fly.id,tick:run.world.tick,energy:(alive?fly.energy:0)-state.charge.outstandingEnergy,lastFood:fly.lastFood,terminal:!alive});
      if(!alive)billSarsaWork(state,run.pricing);
      assert.equal(state.motorPending,null);
    }
  }
  assert.equal(digest(Object.values(run.learners).map(s=>s.weights)),weightsBefore);assert.ok(stats.firstActions.every(a=>a===0));
  const endpoint=run.endpoint();assert.ok(Math.abs(endpoint.accountingResidual)<1e-7);
  stats.unfinishedPauses=Object.values(timers).filter(t=>t.pausing).length;stats.cooldownsDue=Object.values(timers).filter(t=>t.cruiseDue).length;
  const finalEncodedBytes=Object.values(run.learners).reduce((n,s)=>n+encodedStateBytes({...s,timing:timers[s.agentId]}),0);
  return {policy,seed,ticks,founders:run.founderIds.length,startWorldSha256,survivors:endpoint.survivors,value:endpoint.budgetAdjustedEnergyPerFounder,
    endpoint,statistics:stats,additionalIncurredEnergy:endpoint.incurredEnergy-initialCharges,finalEncodedBytes,weightsUnchanged:true,
    finalWorld:emit?run.world.checkpoint():null,finalLearners:emit?run.learners:null};
}
