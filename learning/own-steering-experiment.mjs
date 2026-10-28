import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {CoverageExperiment} from './coverage-experiment.mjs';
import {CONTINUAL_PHASES,enterContinualPhase,updateContinualResources} from './continual-regimes.mjs';
import {enterCuePhase,updateCueResources} from './cue-foraging.mjs';
import {contactObservation} from './contact-observation.mjs';
import {chooseCoverageTaste,observeCoverageTaste,freezeCoverageTaste,resetCoverageTaste} from './coverage-taste.mjs';
import {overlapObservation} from './overlap-harvest.mjs';
import {filteredOverlapRecommendation} from './filtered-overlap.mjs';
import {overlapGuard} from './guarded-overlap.mjs';
import {createOwnSteering,chooseOwnSteering,terminateOwnSteering,freezeOwnSteering,resetOwnSteering} from './own-steering.mjs';
import {encodedStateBytes,billSarsaWork,chargeForStep} from './sarsa-experiment.mjs';

export class OwnSteeringExperiment extends CoverageExperiment{
  constructor({steeringMode='learned',acquisitionGeometry='grid',auditSnapshots=false,...options}){
    assert.ok(['learned','native','guarded'].includes(steeringMode));
    assert.ok(['grid','continual'].includes(acquisitionGeometry));
    assert.ok(options.arm===undefined||options.arm==='candidate');
    assert.equal(typeof auditSnapshots,'boolean');
    super({...options,arm:'candidate'});this.steeringMode=steeringMode;this.acquisitionGeometry=acquisitionGeometry;this.auditSnapshots=auditSnapshots;
    if(acquisitionGeometry==='continual'){
      enterContinualPhase(this.world,CONTINUAL_PHASES[0],this.history.resourceSeeds[0]);
      this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[0],this.history.resourceSeeds[0],this.codebook);
    }
    for(const fly of this.world.flies){
      const state=this.learners[fly.id],seed=(this.history.seed^Math.imul(fly.id,2654435761)^0x74139ab5)>>>0||1;
      state.steering=createOwnSteering(fly.id,seed);state.spatialPoints=[];state.scratch={separation:0};state.lastCost=fly.lastEnergyCost??0;
    }
    this.attachSpatial();
  }
  attachSpatial(){
    Object.defineProperty(this,'auditSpatial',{value:{},enumerable:false,configurable:true});
    const original=this.world.sensors.bind(this.world);
    Object.defineProperty(this.world,'sensors',{enumerable:false,configurable:true,value:(fly,foodIndex,agentIndex,challenge)=>{
      let sensed=[];const shared={nearby:(body,radius)=>{sensed=foodIndex.nearby(body,radius);return sensed;}};
      const raw=original(fly,shared,agentIndex,challenge),state=this.learners[fly.id];
      if(this.auditSnapshots)this.auditSpatial[fly.id]={fly:{x:fly.x,y:fly.y,heading:fly.heading,sense:fly.genome.traits.sense,sensedCue:[...fly.sensedCue]},
        sensed:sensed.map(patch=>({x:patch.x,y:patch.y,amount:patch.amount,cue:[...patch.cue]})),
        food:this.world.food.map(patch=>({x:patch.x,y:patch.y,amount:patch.amount,cue:[...patch.cue]}))};
      if(this.wallShortcut&&this.probe){
        assert.ok(state.steering&&!state.steering.acquisition&&state.steering.pending===null);
        state.work.scalarOperations+=4;state.wallSkip=raw[10]!==0||raw[11]!==0;
        if(state.wallSkip){
          state.work.scalarOperations+=encodedStateBytes(state.spatialPoints)+encodedStateBytes(state.scratch.bins??{})+2;
          state.spatialPoints=[];state.scratch.bins={};return raw;
        }
      }
      state.spatialPoints=overlapObservation(fly,sensed,state.work);
      if(this.targetCueMode){
        const cues=[];state.work.scalarOperations+=2;
        for(const patch of sensed){state.work.scalarOperations++;if(patch.amount<=.06)continue;
          cues.push(this.transfer?[0,0,0,0]:[...patch.cue]);state.work.scalarOperations+=5;}
        assert.equal(cues.length,state.spatialPoints.length);state.targetCues=cues;
      }
      return raw;
    }});
  }
  step(){
    if(this.finished||!this.world.flies.length)return false;
    if(this.world.tick===this.phaseEnd){
      if(this.probe||++this.phaseIndex>=CONTINUAL_PHASES.length){this.finished=true;return false;}
      this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[this.phaseIndex],this.history.resourceSeeds[this.phaseIndex],this.codebook);
      this.phaseEnd+=CONTINUAL_PHASES[this.phaseIndex].ticks;
    }
    if(this.transfer)updateContinualResources(this.world,this.resource);else updateCueResources(this.world,this.resource);
    const family=this.transfer?'transfer':this.resource.family,stats=this.statistics[family]??={decisions:0,moves:[0,0,0],accept:0,intake:0,toxin:0,cost:0,steering:[0,0],available:0};
    const before=[...this.world.flies];
    this.world.step((fly,raw,tick)=>{
      const state=this.learners[fly.id],observation=contactObservation(fly,this.world.food,fly.sensedCue,state.work);
      if(this.transfer){observation.cue=[0,0,0,0];observation.odorPresent=false;}
      state.work.scalarOperations++;
      const own={agentId:fly.id,tick,energy:fly.energy-state.charge.outstandingEnergy,raw,...observation};
      const choice=chooseCoverageTaste(state,own,{fixedMove:this.fixedMove??null}),recommendation=filteredOverlapRecommendation(state.spatialPoints,state.work,state.scratch);
      const guard=overlapGuard(recommendation.point,raw,own.energy,fly.genome.traits.speed,state.lastCost,state.work);
      const available=recommendation.pair[0]>=0&&!guard.wall&&guard.viable,distance=Math.hypot(...recommendation.point);
      const features=[1,Math.max(0,Math.min(1,own.energy/120)),raw[10],raw[11],raw[13],Math.max(-1,Math.min(1,raw[12])),
        Math.min(1,distance/fly.genome.traits.sense),distance>0?recommendation.point[1]/distance:0];
      state.work.scalarOperations+=14;
      const steeringWork=state.steering.work.scalarOperations;
      const forcedAction=this.steeringMode==='native'?0:this.steeringMode==='guarded'?Number(available):null;
      const steering=chooseOwnSteering(state.steering,{agentId:fly.id,tick,energy:own.energy,features,midpointAvailable:available},{forcedAction});
      state.work.scalarOperations+=state.steering.work.scalarOperations-steeringWork;
      const sine=steering.action===1&&distance>0?recommendation.point[1]/distance:raw[2]-raw[1];
      const outputs=[Math.tanh(2*sine+1.8*(raw[10]-raw[11])),choice.move,choice.accept?1:-1,-1,0];state.work.scalarOperations+=10;
      stats.decisions++;stats.moves[choice.action]++;stats.accept+=Number(choice.accept);stats.steering[steering.action]++;stats.available+=Number(available);
      const bill=chargeForStep(state,this.pricing);
      this.emit?.({type:'decision',id:fly.id,tick,own,choice,steering,features,available,recommendation,guard,outputs,requestedExtra:bill.energyCost,work:state.work.scalarOperations,steeringWork:state.steering.work.scalarOperations,storageBytes:state.charge.storageBytes,...(this.auditSnapshots?{auditState:structuredClone(state),auditSpatial:this.auditSpatial[fly.id]}:{})});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        state.lastCost=receipt.cost;stats.intake+=receipt.beneficialEaten;stats.toxin+=receipt.toxinDamage;stats.cost+=receipt.cost;this.emit?.({type:'physical',...receipt});
      }};
    });
    for(const fly of before){
      const state=this.learners[fly.id],alive=this.world.flies.includes(fly);state.work.scalarOperations++;
      const own={agentId:fly.id,tick:this.world.tick,energy:(alive?fly.energy:0)-state.charge.outstandingEnergy,lastFood:fly.lastFood,terminal:!alive};
      observeCoverageTaste(state,own);
      if(!alive){const work=state.steering.work.scalarOperations;terminateOwnSteering(state.steering,own);state.work.scalarOperations+=state.steering.work.scalarOperations-work;}
      billSarsaWork(state,this.pricing);this.emit?.({type:'observe',own,...(this.auditSnapshots?{auditState:structuredClone(state)}:{})});
    }
    if(!this.probe&&this.world.tick===this.phaseEnd&&this.phaseIndex<3)this.anchors[CONTINUAL_PHASES[this.phaseIndex].id]=this.checkpoint(false);
    return true;
  }
  checkpoint(includeAnchors=true){const result=super.checkpoint(includeAnchors);result.kind='own-steering-world';return result;}
  static restore(checkpoint,emit=null){
    assert.equal(checkpoint.kind,'own-steering-world');const run=Object.create(OwnSteeringExperiment.prototype);
    Object.assign(run,structuredClone(checkpoint.state));run.world=World.restore(checkpoint.world);run.anchors=structuredClone(checkpoint.anchors);run.attach(emit);run.attachSpatial();return run;
  }
  static fork(anchor,{phase='A',seed,mode='current',modelAnchor=null,steeringMode=null,fixedMove=null,emit=null}){
    assert.ok(['A','B','C','transfer'].includes(phase));assert.ok(['current','reset'].includes(mode));
    assert.ok(steeringMode===null||['learned','native','guarded'].includes(steeringMode));assert.ok(fixedMove===null||[-1,0,1].includes(fixedMove));
    assert.ok(modelAnchor===null||mode==='current');
    if(modelAnchor!==null){
      assert.equal(modelAnchor.kind,'own-steering-world');assert.deepEqual(modelAnchor.state.history,anchor.state.history);
      assert.deepEqual(modelAnchor.state.founderIds,anchor.state.founderIds);assert.equal(modelAnchor.state.acquisitionGeometry,anchor.state.acquisitionGeometry);
      assert.ok(modelAnchor.world.world.tick<=anchor.world.world.tick);
    }
    const run=OwnSteeringExperiment.restore(anchor,emit);run.anchors={};run.probe=true;run.finished=false;run.phaseEnd=run.world.tick+256;
    run.transfer=phase==='transfer';run.fixedMove=fixedMove;if(steeringMode!==null)run.steeringMode=steeringMode;
    run.startingDebt=Object.values(run.learners).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    for(const fly of run.world.flies){
      const state=run.learners[fly.id];
      if(modelAnchor!==null){
        assert.ok(modelAnchor.world.world.flies.some(source=>source.id===fly.id));
        const source=modelAnchor.state.learners[fly.id];assert.equal(source.agentId,fly.id);assert.equal(source.steering.agentId,fly.id);
        state.weights=structuredClone(source.weights);state.taste.weights=structuredClone(source.taste.weights);state.steering.weights=structuredClone(source.steering.weights);
      }else{
        state.weights=structuredClone(state.weights);state.taste.weights=structuredClone(state.taste.weights);state.steering.weights=structuredClone(state.steering.weights);
      }
      state.work.scalarOperations+=66;
      if(mode==='reset'){
        resetCoverageTaste(state);const work=state.steering.work.scalarOperations;resetOwnSteering(state.steering);
        state.work.scalarOperations+=state.steering.work.scalarOperations-work;
      }
      freezeCoverageTaste(state);freezeOwnSteering(state.steering);state.charge.storageBytes=0;billSarsaWork(state,run.pricing);
    }
    run.world.config.cueForaging=!run.transfer;
    run.resource=run.transfer?enterContinualPhase(run.world,CONTINUAL_PHASES[0],seed):enterCuePhase(run.world,CONTINUAL_PHASES.find(item=>item.id===phase),seed,run.codebook);
    run.startingEnergy=run.world.flies.reduce((sum,fly)=>sum+fly.energy,0);run.statistics={};return run;
  }
}
