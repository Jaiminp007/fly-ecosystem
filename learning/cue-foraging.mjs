// Opt-in embodied cue experiment. No platform module imports this file.
import assert from 'node:assert/strict';
import {World, RNG} from '../engine.mjs';
import {digest, advanceRng} from './intervention-study.mjs';
import {CONTINUAL_PHASES, enterContinualPhase} from './continual-regimes.mjs';
import {embodiedProgram} from './embodied-programs.mjs';
import {chargeForStep, billSarsaWork, encodedStateBytes} from './sarsa-experiment.mjs';
import {learnerSummary} from './sarsa-screen.mjs';

const clamp = x => Math.max(-1, Math.min(1, x));
const canonical = x => JSON.parse(JSON.stringify(x));
const learned = arm => ['candidate','lambda0','frozen','reset','cueBlind','shuffled','nullCandidate','nullBlind','fastOnly','linear'].includes(arm);
export const CUE_ARMS = ['candidate','lambda0','frozen','reset','cueBlind','shuffled','nullCandidate','nullBlind','fastOnly','linear','incumbent','accept','refuse','slowAccept','tasteReflex'];
export const AUTHORITY_ARMS = ['valueOracle','cueOracle','accept','refuse','random','shuffledOracle','nullCueOracle','nullRandom'];
export const CUE_PROBES = [
  ...[['A','A'],['A','C'],['A','reset'],['B','A'],['B','B'],['B','C'],['B','reset'],['C','B'],['C','C']],
  ...['A','C','reset','accept'].map(version=>['transfer',version])
].map(([family,version])=>({family,version}));
export function shuffle(values, rng) {
  const result=[...values]; for(let i=result.length-1;i>0;i--){const j=Math.floor(rng.next()*(i+1));[result[i],result[j]]=[result[j],result[i]];} return result;
}
export function makeCueCodebook(seed) {
  const rng=new RNG(seed), patterns=shuffle(Array.from({length:16},(_,i)=>({id:i+1,bits:Array.from({length:4},(_,j)=>(i>>j&1)?1:-1)})),rng), result={};
  for(const [i,family] of ['A','B','C'].entries()) {const labels=shuffle([-1,-1,1,1],rng);result[family]=patterns.slice(i*4,i*4+4).map((p,j)=>({...p,valence:labels[j]}));}
  return result;
}
export function enterCuePhase(world, phase, seed, codebook, nullSeed=null) {
  const before=world.energy(), physicalRng=world.rng.state, rng=new RNG(seed), pool=codebook[phase.id==='return-A'?'A':phase.id];
  assert.equal(pool.length,4); world.config.nutrient=phase.nutrient; world.config.ecology='baseline'; world.nextRelocationTick=null;
  world.resourceCenters=Array.from({length:3},()=>({x:rng.range(100,900),y:rng.range(80,560)}));
  const order=shuffle(world.food.map((_,i)=>i),rng), groups=Array.from({length:4},()=>[]);
  for(const [i,index] of order.entries()) {
    const patch=world.food[index], item=pool[i%4]; patch.cueId=item.id;patch.cue=[...item.bits];patch.valence=item.valence;groups[i%4].push(index);
    const abundance=Math.max(...world.resourceCenters.map(c=>Math.exp(-((patch.x-c.x)**2+(patch.y-c.y)**2)/24000)));
    patch.regrowth=abundance*.16+.001;patch.capacity=Math.max(patch.amount,abundance*4+.05);
  }
  if(nullSeed!==null){const nrng=new RNG((nullSeed^seed)>>>0||1);for(const indices of groups)for(const [i,index] of shuffle(indices,nrng).entries())world.food[index].valence=i%2?1:-1;}
  assert.equal(world.energy(),before);assert.equal(world.rng.state,physicalRng);
  return {family:phase.id,seed,rngState:rng.state,nextShift:phase.shiftEvery?world.tick+phase.shiftEvery:null,shiftEvery:phase.shiftEvery,shifts:0};
}
export function updateCueResources(world, resource) {
  if(resource.nextShift===null||world.tick<resource.nextShift)return;
  const before=world.energy(),rng=new RNG(resource.rngState);
  world.resourceCenters=Array.from({length:3},()=>({x:rng.range(100,900),y:rng.range(80,560)}));
  for(const patch of world.food){const a=Math.max(...world.resourceCenters.map(c=>Math.exp(-((patch.x-c.x)**2+(patch.y-c.y)**2)/24000)));patch.regrowth=a*.16+.001;patch.capacity=Math.max(patch.amount,a*4+.05);}
  resource.rngState=rng.state;resource.nextShift+=resource.shiftEvery;resource.shifts++;assert.equal(world.energy(),before);
}
export function cueObservation(raw, cue) {
  const obs=[...raw];obs[0]=cue[0];obs[1]=(cue[1]+1)/2;obs[2]=(cue[2]+1)/2;obs[3]=(cue[3]+1)/2;
  obs[12]=raw[3];return obs;
}
export function motorPrimitive(raw, action, slow=false) {
  assert.ok([-1,1].includes(action)); const attraction=2*(raw[2]-raw[1]), wall=1.8*(raw[10]-raw[11]);
  const turn=Math.tanh((action>0?attraction:-attraction+.8*raw[0])+wall);
  return [turn,slow?-.7:0,action>0?1:-1,-1,0];
}
function fixedState(id,seed,knowledge=null){return {agentId:id,config:{fixed:true},weights:[],eligibility:[],history:[],pending:null,recent:[],older:[],olderSeen:0,
  rngState:seed,retentionRngState:seed,replayRngState:seed,decisions:0,transitions:0,replayUpdates:0,acquisition:false,dead:false,lastDecisionTick:0,lastObservedTick:0,
  work:{scalarOperations:0,liveUpdates:0,replayUpdates:0},charge:{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0},...(knowledge?{knowledge}: {})};}
export class CueExperiment {
  constructor({history,arm,reference,pricing,emit=()=>{}}) {
    assert.ok([...CUE_ARMS,...AUTHORITY_ARMS].includes(arm));assert.ok(pricing.operationEnergy>0&&pricing.byteEnergyPerSecond>0);
    this.historySpec=structuredClone(history);this.arm=arm;this.pricing={...pricing};this.codebook=makeCueCodebook(history.cueSeed);
    this.world=new World({seed:history.seed,founders:reference.founders,capacity:240,reproduction:false,mutation:false,learning:arm==='incumbent',controller:'episodic-actor',
      actorParameters:reference.actorParameters,episodicParameters:{...reference.parameters,memoryLearning:arm==='incumbent',neuralLearning:arm==='incumbent'},
      nutrient:.4,seasonal:false,challenges:'off',cueForaging:true});
    this.program=arm==='linear'?'linear-sarsa-v1':arm==='fastOnly'?'mushroom-fast-only-v1':'mushroom-policy-v1';
    this.founderIds=this.world.flies.map(f=>f.id);this.startingEnergy=this.world.flies.reduce((s,f)=>s+f.energy,0);this.learners={};
    for(const id of this.founderIds){const seed=(history.seed^Math.imul(id,2654435761))>>>0||1;
      const s=learned(arm)?embodiedProgram(this.program).api.create(id,seed,arm==='lambda0'?{lambda:0}:{}):fixedState(id,seed,arm.includes('Oracle')&&arm!=='valueOracle'?this.codebook:null);
      s.actuator={heldAction:1,ticks:0,decisions:0,scalarOperations:0};this.learners[id]=s;}
    this.phaseIndex=0;this.phaseEnd=512;this.savedModels={};this.atC=null;this.phaseRows=[];this.receipts={};this.pressure={};this.transfer=false;
    this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[0],history.resourceSeeds[0],this.codebook,this.isNull()?history.nullSeed:null);
    Object.defineProperty(this,'emit',{value:emit,writable:true,enumerable:false});
  }
  isNull(){return ['nullCandidate','nullBlind','nullCueOracle','nullRandom'].includes(this.arm);}
  eventProgram(){return this.arm==='linear'?'linear':this.arm==='fastOnly'?'fastOnly':learned(this.arm)?'candidate':'fixed';}
  observation(fly,raw,tick){
    let cue=this.transfer?[0,0,0,0]:fly.sensedCue;
    if(['cueBlind','nullBlind'].includes(this.arm))cue=[0,0,0,0];
    if(['shuffled','shuffledOracle'].includes(this.arm)&&!this.transfer){const family=this.resource.family==='return-A'?'A':this.resource.family;
      const i=parseInt(digest(`${this.historySpec.shuffleSeed}:${fly.id}:${tick}`).slice(0,8),16)%4;cue=this.codebook[family][i].bits;}
    return cueObservation(raw,cue);
  }
  fixedChoice(s,fly,obs){
    s.work.scalarOperations++;
    if(this.arm==='valueOracle')return fly.sensedValence<0?-1:1;
    if(this.arm.includes('Oracle')){const bits=[obs[0],2*obs[1]-1,2*obs[2]-1,2*obs[3]-1];s.work.scalarOperations+=6;
      for(const item of Object.values(s.knowledge).flat()){let match=true;for(let j=0;j<4;j++){s.work.scalarOperations++;if(item.bits[j]!==bits[j]){match=false;break;}}
        if(match){s.work.scalarOperations++;return item.valence<0?-1:1;}}return 1;}
    if(['random','nullRandom'].includes(this.arm)){s.rngState=advanceRng(s.rngState);s.work.scalarOperations+=6;return s.rngState/4294967296<.5?-1:1;}
    if(this.arm==='refuse')return -1;if(this.arm==='tasteReflex')return obs[13]<0?-1:1;return 1;
  }
  flushLedger(id,discarded=0){const r=this.receipts[id];if(!r)return;r.discarded=discarded;r.finalEnergy-=discarded;
    assert.ok(Math.abs(r.initialEnergy-r.cost+r.beneficialEaten-r.toxinDamage-r.discarded-r.finalEnergy)<1e-7);
    this.emit({program:'physical-ledger',type:'ledger',arm:this.arm,...r});delete this.receipts[id];}
  pressureRecord(id,tr){if(this.arm!=='candidate'||tr.tick>1536)return;const key=tr.tick<=512?'A':tr.tick<=1024?'B':'C',d=this.pressure[id]||={A:[],B:[],C:[],transitions:0};
    d.transitions++;for(let j=0;j<tr.phi.length;j++)if(tr.phi[j]!==0&&!d[key].includes(j))d[key].push(j);}
  step(){
    if(this.phaseIndex>=CONTINUAL_PHASES.length||!this.world.flies.length)return false;
    const api=embodiedProgram(this.program).api;
    if(this.world.tick===this.phaseEnd){this.phaseIndex++;if(this.phaseIndex===4)return false;const phase=CONTINUAL_PHASES[this.phaseIndex];
      this.resource=enterCuePhase(this.world,phase,this.historySpec.resourceSeeds[this.phaseIndex],this.codebook,this.isNull()?this.historySpec.nullSeed:null);this.phaseEnd+=phase.ticks;
      if(['frozen','reset'].includes(this.arm)&&['B','C'].includes(phase.id)){this.emit({program:this.eventProgram(),type:'intervention',arm:this.arm,tick:this.world.tick+1,action:this.arm==='frozen'?'freeze':'reset'});
        for(const s of Object.values(this.learners)){if(this.arm==='frozen')api.freeze(s);else api.reset(s);s.charge.storageBytes=0;}}
    }
    if(!this.transfer)updateCueResources(this.world,this.resource);
    const before=[...this.world.flies], previous=Object.fromEntries(before.map(f=>[f.id,this.learners[f.id].transitions]));
    this.world.step((fly,raw,tick)=>{
      const s=this.learners[fly.id], decision=(tick-1)%8===0;
      if(decision){this.flushLedger(fly.id);const observation=this.observation(fly,raw,tick), own={agentId:fly.id,tick,energy:fly.energy-s.charge.outstandingEnergy,observation};
        if(learned(this.arm))s.actuator.heldAction=api.choose(s,own);else {s.actuator.heldAction=this.fixedChoice(s,fly,observation);s.decisions++;s.lastDecisionTick=tick;
          this.emit({program:'fixed',type:'decision',arm:this.arm,agentId:fly.id,tick,observation,choice:s.actuator.heldAction,sensedValence:fly.sensedValence,rngState:s.rngState});}
        s.actuator.decisions++;
      }
      // Arithmetic/transcendental operations in motorPrimitive: six for
      // approach, nine for avoidance. Constants/assignments are unpriced.
      if(this.arm!=='incumbent'){const work=s.actuator.heldAction>0?6:9;s.actuator.ticks++;s.actuator.scalarOperations+=work;s.work.scalarOperations+=work;}
      const bill=this.arm==='incumbent'?{energyCost:0}:chargeForStep(s,this.pricing);
      return {...bill,afterController:outputs=>{if(this.arm!=='incumbent'){const action=motorPrimitive(raw,s.actuator.heldAction,this.arm==='slowAccept');for(let j=0;j<5;j++)outputs[j]=action[j];}},
        afterStep:r=>{const old=this.receipts[fly.id];if(old){old.finalEnergy=r.finalEnergy;old.cost+=r.cost;old.paidExtra+=r.paidExtra;old.beneficialEaten+=r.beneficialEaten;old.harmfulEaten+=r.harmfulEaten;old.toxinDamage+=r.toxinDamage;old.steps++;}
          else this.receipts[fly.id]={agentId:fly.id,tick,steps:1,initialEnergy:r.initialEnergy,finalEnergy:r.finalEnergy,cost:r.cost,paidExtra:r.paidExtra,beneficialEaten:r.beneficialEaten,harmfulEaten:r.harmfulEaten,toxinDamage:r.toxinDamage};}};
    });
    for(const fly of before){const s=this.learners[fly.id],alive=this.world.flies.includes(fly);
      if(learned(this.arm))api.observe(s,{agentId:fly.id,tick:this.world.tick,energy:(alive?fly.energy:0)-s.charge.outstandingEnergy,terminal:!alive});else{s.lastObservedTick=this.world.tick;s.dead=!alive;}
      if(!alive){if(this.arm!=='incumbent')billSarsaWork(s,this.pricing);this.flushLedger(fly.id,fly.energy);}
      const transitions=s.recent.filter(tr=>tr.experience>previous[fly.id]);for(const tr of transitions)this.pressureRecord(fly.id,tr);
      const decision=learned(this.arm)&&s.lastDecisionTick===this.world.tick?s.history.at(-1):null;
      if(transitions.length||decision)this.emit({program:this.eventProgram(),type:'experience',arm:this.arm,tick:this.world.tick,agentId:fly.id,transitions,decision});
    }
    assert.ok(Math.abs(this.world.metrics().accountingError)<1e-6);
    if(this.world.tick===this.phaseEnd){const phase=CONTINUAL_PHASES[this.phaseIndex];this.phaseRows.push({phase:phase.id,...this.endpoint()});
      if(['A','B'].includes(phase.id)&&learned(this.arm))this.savedModels[phase.id]=structuredClone(this.learners);
      if(phase.id==='C'&&this.arm==='candidate')this.atC=this.checkpoint(false);}
    return true;
  }
  advance(ticks){for(let i=0;i<ticks;i++)if(!this.step())break;}
  endpoint(){const energy=this.world.flies.reduce((s,f)=>s+f.energy,0),debt=Object.values(this.learners).reduce((s,v)=>s+v.charge.outstandingEnergy,0);
    return {tick:this.world.tick,founders:this.founderIds.length,survivors:this.world.flies.length,survival:this.world.flies.length/this.founderIds.length,
      budgetAdjustedEnergyPerFounder:(energy-this.startingEnergy-debt)/this.founderIds.length,outstandingEnergy:debt,
      accountingResidual:this.world.metrics().accountingError,foodInventory:this.world.food.reduce((s,p)=>s+p.amount,0),totals:structuredClone(this.world.totals),
      scalarOperations:Object.values(this.learners).reduce((s,v)=>s+v.work.scalarOperations,0),encodedBytes:Object.values(this.learners).reduce((s,v)=>s+encodedStateBytes(v),0)};}
  checkpoint(includeAtC=true){const {world,atC,...state}=this;return canonical({schema:1,kind:'joint-cue-foraging-experiment',world:world.checkpoint(),state,atC:includeAtC?atC:null});}
  static restore(cp,emit=()=>{}){assert.equal(cp.kind,'joint-cue-foraging-experiment');const run=Object.create(CueExperiment.prototype);Object.assign(run,structuredClone(cp.state));run.world=World.restore(cp.world);run.atC=structuredClone(cp.atC);
    Object.defineProperty(run,'emit',{value:emit,writable:true,enumerable:false});if(learned(run.arm))for(const s of Object.values(run.learners))embodiedProgram(run.program).api.restore(s);return run;}
}
export function pressureSummary(run){const ds=Object.values(run.pressure), count=family=>ds.reduce((s,d)=>s+d[family].length,0), a=count('A'),b=count('B');
  const reuseA=ds.reduce((s,d)=>s+d.A.filter(i=>d.B.includes(i)||d.C.includes(i)).length,0),reuseB=ds.reduce((s,d)=>s+d.B.filter(i=>d.C.includes(i)).length,0);
  return {aCells:a,bCells:b,reusedA:reuseA,reusedB:reuseB,aReuse:a?reuseA/a:0,bReuse:b?reuseB/b:0,bodiesOverReceiptCapacity:ds.filter(d=>d.transitions>16).length,founders:run.founderIds.length};}
export function simulateCueArm(p,h,arm,emit=()=>{}){const run=new CueExperiment({history:h,arm,reference:p.reference,pricing:p.pricing,emit});
  emit({program:run.eventProgram(),type:'start',arm,seed:h.seed,learners:Object.values(run.learners).map(learnerSummary)});
  run.advance(1792);for(const id of Object.keys(run.receipts))run.flushLedger(id);
  const learners=Object.values(run.learners).map(learnerSummary);emit({program:run.eventProgram(),type:'end',arm,learners});
  return {row:{arm,endpoint:run.endpoint(),learners,phases:run.phaseRows,finalSha256:digest(run.checkpoint()),pressure:arm==='candidate'?pressureSummary(run):null},atC:run.atC};}
export function runCueProbe(atC,spec,resourceSeed,founders){
  if(!atC)return {...spec,resourceSeed,founders,survival:0,value:0,skippedAllDead:true};
  const run=CueExperiment.restore(atC),api=embodiedProgram(run.program).api,current=structuredClone(run.learners),source=spec.version==='C'?current:run.savedModels[spec.version];
  for(const [id,s] of Object.entries(current)){const model=spec.version==='reset'?api.create(s.agentId,s.rngState,s.config):structuredClone(source?.[id]||s);api.freeze(model);model.history=[];model.rngState=s.rngState;model.lastObservedTick=run.world.tick;model.lastDecisionTick=run.world.tick-7;
    model.actuator={heldAction:1,ticks:0,decisions:0,scalarOperations:0};model.dead=!run.world.flies.some(f=>f.id===+id);model.charge={operationsBilled:model.work.scalarOperations,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0};run.learners[id]=model;}
  run.arm=spec.version==='accept'?'accept':'frozen';run.receipts={};run.phaseRows=[];run.savedModels={};run.atC=null;
  run.transfer=spec.family==='transfer';const phase=CONTINUAL_PHASES.find(v=>v.id===(run.transfer?'A':spec.family));
  run.phaseIndex=CONTINUAL_PHASES.indexOf(phase);run.phaseEnd=run.world.tick+256;
  if(run.transfer){run.world.config.cueForaging=false;enterContinualPhase(run.world,phase,resourceSeed);}
  else run.resource=enterCuePhase(run.world,phase,resourceSeed,run.codebook);
  run.startingEnergy=run.world.flies.reduce((s,f)=>s+f.energy,0);const startWorldSha256=digest(run.world.checkpoint()),before=digest(Object.values(run.learners).map(s=>s.weights));
  run.advance(256);assert.equal(digest(Object.values(run.learners).map(s=>s.weights)),before);
  const endpoint=run.endpoint();return {...spec,resourceSeed,founders,survival:endpoint.survival,value:endpoint.budgetAdjustedEnergyPerFounder,startWorldSha256,endpoint,acquisitionDisabled:true,learnedWeightsUnchanged:true};
}

export function simulateAuthorityHistory(p,h,emit=()=>{}) {
  const arms={};
  for(const arm of AUTHORITY_ARMS){const run=new CueExperiment({history:h,arm,reference:p.reference,pricing:p.pricing,emit});
    emit({program:'authority',type:'start',arm,seed:h.seed,codebook:run.codebook,learners:run.learners,
      initialEnergy:run.world.initialEnergy,initialFoodInventory:run.world.food.reduce((s,v)=>s+v.amount,0)});
    const initialWorldSha256=digest(run.world.checkpoint());run.advance(1792);
    for(const id of Object.keys(run.receipts))run.flushLedger(id);
    emit({program:'authority',type:'end',arm,learners:run.learners,endpoint:run.endpoint()});
    arms[arm]={endpoint:run.endpoint(),phases:run.phaseRows,initialWorldSha256,finalSha256:digest(run.checkpoint())};
  }
  return {schema:1,history:h,arms};
}
