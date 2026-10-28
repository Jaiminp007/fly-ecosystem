// Checkpointable frozen transfer executor. Hidden annotations are observer-only.
import assert from 'node:assert/strict';
import {TasteExperiment} from './taste-experiment.mjs';
import {compactTasteEnergyBody,chooseTasteEnergyAction,observeTasteEnergyBody} from './taste-energy.mjs';
import {createTimingState} from './taste-headroom.mjs';
import {contactObservation} from './contact-observation.mjs';
import {tickMotor} from './tick-actor-critic.mjs';
import {chargeForStep,billSarsaWork} from './sarsa-experiment.mjs';
import {enterContinualPhase,CONTINUAL_PHASES} from './continual-regimes.mjs';
import {digest} from './intervention-study.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function speedRecommendation(own,work){
  const checks=[own.raw[3]>0,own.raw[3]<.75,own.raw[0]>=.5,!own.contactPresent,own.raw[10]===0,own.raw[11]===0];
  work.scalarOperations+=6;return checks.every(Boolean)?1:0;
}
export function steeringRecommendation(raw,nativeTurn,work){
  const sine=raw[2]-raw[1],cosine=raw[0];
  let error=Math.atan2(sine,cosine);
  if(sine===0&&cosine<0)error=Math.PI;
  const inverse=clamp(error/.28,-1,1),target=raw[3]>0,leftClear=raw[10]===0,rightClear=raw[11]===0;
  // One subtraction, atan2, five scalar comparisons, division and two clamps.
  work.scalarOperations+=10;
  return {turn:target&&leftClear&&rightClear?inverse:nativeTurn,error,target,wallFallback:target&&!(leftClear&&rightClear),saturated:Math.abs(inverse)===1};
}

export class StallTransfer{
  constructor(anchor,seed,{observer=null,speedMode=null,steeringMode=null,escapeMode=null}={}){
    this.run=TasteExperiment.restore(anchor);const run=this.run;assert.equal(run.cruiseSpeed??0,0);
    this.controls=Object.fromEntries(run.founderIds.map(id=>[id,{...createTimingState(),pulseRemaining:0,pulseAction:0}]));
    assert.ok(speedMode===null||[0,1,2].includes(speedMode));
    if(speedMode!==null)for(const control of Object.values(this.controls))Object.assign(control,{speedMode,requestedMove:0,executedMove:0});
    assert.ok(steeringMode===null||[0,1,2].includes(steeringMode));assert.ok(steeringMode===null||speedMode===null);
    if(steeringMode!==null)for(const control of Object.values(this.controls))Object.assign(control,{steeringMode,requestedTurn:0,executedTurn:0});
    assert.ok(escapeMode===null||[0,1].includes(escapeMode));assert.ok(escapeMode===null||(speedMode===1&&steeringMode===null));
    if(escapeMode!==null)for(const control of Object.values(this.controls))Object.assign(control,{escapeMode,escapeRemaining:0,escapeNoIntake:0,escapeWallBits:0});
    for(const s of Object.values(run.learners)){assert.equal(s.config.holdTicks,1);compactTasteEnergyBody(s);billSarsaWork(s,run.pricing);s.charge.storageBytes=0;}
    run.world.config.cueForaging=false;enterContinualPhase(run.world,CONTINUAL_PHASES[0],seed);
    run.atA=run.atB=run.atC=null;run.savedModels={};run.phaseRows=[];run.statistics={};
    run.startingEnergy=run.world.flies.reduce((n,f)=>n+f.energy,0);run.startingDebt=Object.values(run.learners).reduce((n,s)=>n+s.charge.outstandingEnergy,0);
    run.startingOperations=Object.values(run.learners).reduce((n,s)=>n+s.work.scalarOperations,0);
    this.seed=seed;this.startTick=run.world.tick;this.endTick=this.startTick+256;this.elapsed=0;
    this.weightsSha256=digest(Object.values(run.learners).map(s=>s.weights));
    this.statistics={decisions:0,actions:[0,0,0,0],intake:0,chargedPhysicalCosts:0};
    if(speedMode!==null)Object.assign(this.statistics,{halfSpeedDecisions:0,fullSpeedDecisions:0});
    if(steeringMode!==null)Object.assign(this.statistics,{angularTargetDecisions:0,absoluteAngularError:0,behindDecisions:0,saturatedDecisions:0,wallFallbackDecisions:0});
    this.attachObserver(observer);
  }
  attachObserver(observer){
    Object.defineProperty(this,'observer',{value:observer,writable:true,configurable:true,enumerable:false});
    Object.defineProperty(this,'targets',{value:new Map(),configurable:true,enumerable:false});
    Object.defineProperty(this,'lastNoise',{value:0,writable:true,configurable:true,enumerable:false});
    if(!observer)return;
    const world=this.run.world,nativeSensors=world.sensors.bind(world),nativeNormal=world.rng.normal.bind(world.rng);
    Object.defineProperty(world.rng,'normal',{enumerable:false,configurable:true,value:()=>{this.lastNoise=nativeNormal();return this.lastNoise;}});
    Object.defineProperty(world,'sensors',{enumerable:false,configurable:true,value:(fly,fi,ai,challenge)=>{
      const raw=nativeSensors(fly,fi,ai,challenge);let best=null,score=0;
      for(const patch of fi.nearby(fly,fly.genome.traits.sense).filter(p=>p.amount>.06)){
        const value=patch.amount/(distance(fly,patch)+20);if(value>score){best=patch;score=value;}
      }
      const target=best?{index:world.food.indexOf(best),x:best.x,y:best.y,amount:best.amount,
        deepInterior:world.obstacles.some(o=>distance(best,o)<o.r-10)}:null;
      this.targets.set(fly.id,target);return raw;
    }});
  }
  checkpoint(){return {schema:1,kind:'stall-transfer',run:this.run.checkpoint(false),controls:structuredClone(this.controls),seed:this.seed,startTick:this.startTick,endTick:this.endTick,
    elapsed:this.elapsed,weightsSha256:this.weightsSha256,statistics:structuredClone(this.statistics)};}
  static restore(cp,{observer=null}={}){
    assert.equal(cp.kind,'stall-transfer');const out=Object.create(StallTransfer.prototype);
    for(const key of ['controls','seed','startTick','endTick','elapsed','weightsSha256','statistics'])out[key]=structuredClone(cp[key]);
    out.run=TasteExperiment.restore(cp.run);assert.equal(out.run.world.tick,out.startTick+out.elapsed);out.attachObserver(observer);return out;
  }
  pulse(id,action){assert.ok([0,1,2].includes(action)&&this.controls[id]&&this.run.world.flies.some(f=>f.id===id));this.controls[id].pulseRemaining=16;this.controls[id].pulseAction=action;}
  commitEscape(id){assert.ok(this.controls[id]?.escapeMode!==undefined&&this.run.world.flies.some(f=>f.id===id));this.controls[id].escapeRemaining=Math.ceil(Math.PI/(2.8*.1));}
  snapshot(){
    const run=this.run;for(const state of Object.values(run.learners))assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
    assert.equal(digest(Object.values(run.learners).map(s=>s.weights)),this.weightsSha256);
    const endpoint=run.endpoint();assert.ok(Math.abs(endpoint.accountingResidual)<1e-7);
    return {elapsed:this.elapsed,endpoint,statistics:structuredClone(this.statistics),bodyBudgets:Object.fromEntries(run.founderIds.map(id=>{
      const body=run.world.flies.find(f=>f.id===id),s=run.learners[id];return [id,{alive:!!body,physicalEnergy:body?.energy??0,debt:s.charge.outstandingEnergy,budget:(body?.energy??0)-s.charge.outstandingEnergy}];
    }))};
  }
  step(){
    const run=this.run;if(run.world.tick>=this.endTick||!run.world.flies.length)return false;
    const before=[...run.world.flies];
    run.world.step((fly,raw,tick)=>{
      const s=run.learners[fly.id],control=this.controls[fly.id];assert.equal(s.acquisition,false);assert.equal(s.motorPending,null);
      const local=contactObservation(fly,run.world.food,fly.sensedCue,s.work),own={agentId:fly.id,tick,energy:fly.energy-s.charge.outstandingEnergy,raw,...local,cue:[0,0,0,0],odorPresent:false};
      chooseTasteEnergyAction(s,own);s.work.scalarOperations++;const active=control.pulseRemaining>0,action=active?control.pulseAction:0;
      if(active)control.pulseRemaining--;control.started=true;
      s.credit.pending.action=action;s.hold.cruise=action<2;
      const outputs=tickMotor(s,raw,action);
      if(control.speedMode!==undefined){
        assert.equal(action,0);const recommended=speedRecommendation(own,s.work);s.work.scalarOperations++;
        const move=control.speedMode===2?recommended:control.speedMode;control.requestedMove=control.executedMove=move;outputs[1]=move;
        this.statistics[move===1?'fullSpeedDecisions':'halfSpeedDecisions']++;
      }
      let steering=null;
      if(control.steeringMode!==undefined){
        assert.equal(action,0);steering=steeringRecommendation(raw,outputs[0],s.work);s.work.scalarOperations++;
        outputs[0]=control.steeringMode===2?steering.turn:outputs[0];outputs[1]=control.steeringMode===0?0:1;
        control.requestedTurn=control.executedTurn=outputs[0];
        if(steering.target){this.statistics.angularTargetDecisions++;this.statistics.absoluteAngularError+=Math.abs(steering.error);
          if(raw[0]<0)this.statistics.behindDecisions++;if(steering.wallFallback)this.statistics.wallFallbackDecisions++;
          else if(steering.saturated)this.statistics.saturatedDecisions++;}
      }
      let escape=null;
      if(control.escapeMode!==undefined){
        const active=control.escapeRemaining>0,recommendedTurn=active?1:outputs[0];
        control.escapeRemaining-=active?1:0;s.work.scalarOperations+=4;
        outputs[0]=control.escapeMode===1?recommendedTurn:outputs[0];
        control.escapeNoIntake=raw[3]>0&&raw[13]<=0?control.escapeNoIntake+1:0;
        control.escapeWallBits=((control.escapeWallBits<<1)|Number(raw[10]>0||raw[11]>0))&15;
        s.work.scalarOperations+=12;
        escape={active,recommendedTurn,requestedTurn:outputs[0],executedTurn:outputs[0],eat:outputs[2]};
      }
      const bill=chargeForStep({...s,timing:control},run.pricing);
      const pre={x:fly.x,y:fly.y,heading:fly.heading},target=this.targets.get(fly.id);
      this.statistics.decisions++;this.statistics.actions[action]++;
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        this.statistics.intake+=receipt.beneficialEaten;this.statistics.chargedPhysicalCosts+=receipt.cost;
        if(this.observer){
          const heading=angle(pre.heading+outputs[0]*2.8*.1+this.lastNoise*.06),speed=(outputs[1]+1)/2*fly.genome.traits.speed;
          const proposed={x:clamp(pre.x+Math.cos(heading)*speed*.1,6,994),y:clamp(pre.y+Math.sin(heading)*speed*.1,6,634)};
          const collision=run.world.obstacles.some(o=>distance(proposed,o)<o.r+5);
          assert.ok(Math.abs(fly.x-(collision?pre.x:proposed.x))<1e-10&&Math.abs(fly.y-(collision?pre.y:proposed.y))<1e-10,'Observer movement reconstruction differs');
          assert.equal(fly.lastActions[1],outputs[1]);
          assert.equal(fly.lastActions[0],outputs[0]);
          this.observer({id:fly.id,decision:this.elapsed+1,tick,raw:[...raw],contactPresent:own.contactPresent,action,target,requestedMove:outputs[1],executedMove:fly.lastActions[1],
            ...(steering?{steering,requestedTurn:outputs[0],executedTurn:fly.lastActions[0]}:{}),
            ...(escape?{escape:{...escape,executedTurn:fly.lastActions[0]}}:{}),
            x:pre.x,y:pre.y,displacement:Math.hypot(fly.x-pre.x,fly.y-pre.y),collision,intake:receipt.beneficialEaten,signedIntake:fly.lastFood,cost:receipt.cost});
        }
      }};
    });
    for(const fly of before){const s=run.learners[fly.id],alive=run.world.flies.includes(fly);
      observeTasteEnergyBody(s,{agentId:fly.id,tick:run.world.tick,energy:(alive?fly.energy:0)-s.charge.outstandingEnergy,lastFood:fly.lastFood,terminal:!alive});
      billSarsaWork(s,run.pricing); // settle ALL completed work, including survivors
    }
    this.elapsed++;return true;
  }
  advanceTo(elapsed){assert.ok(elapsed>=this.elapsed&&elapsed<=256);while(this.elapsed<elapsed&&this.step());return this.snapshot();}
}
