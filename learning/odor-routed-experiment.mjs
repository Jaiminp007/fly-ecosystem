import assert from 'node:assert/strict';
import {World} from '../engine.mjs';
import {OwnSteeringExperiment} from './own-steering-experiment.mjs';
import {CONTINUAL_PHASES,enterContinualPhase,updateContinualResources} from './continual-regimes.mjs';
import {enterCuePhase,updateCueResources} from './cue-foraging.mjs';
import {contactObservation} from './contact-observation.mjs';
import {createOdorRoutedTasteBody,chooseOdorRoutedTaste,observeOdorRoutedTaste,freezeOdorRoutedTaste,resetOdorRoutedTaste,predictTargetTaste} from './odor-routed-taste.mjs';
import {filteredOverlapRecommendation} from './filtered-overlap.mjs';
import {incrementalOverlapRecommendation} from './incremental-overlap.mjs';
import {compactFrozenOdorRoutedState} from './frozen-memory-compaction.mjs';
import {overlapGuard} from './guarded-overlap.mjs';
import {chooseOwnSteering,terminateOwnSteering,freezeOwnSteering,resetOwnSteering} from './own-steering.mjs';
import {createReplaySteering,chooseReplaySteering,terminateReplaySteering,freezeReplaySteering,resetReplaySteering} from './replay-steering.mjs';
import {createCueSharedSteering,chooseCueSharedSteering,terminateCueSharedSteering,freezeCueSharedSteering,resetCueSharedSteering} from './cue-shared-steering.mjs';
import {encodedStateBytes,billSarsaWork,chargeForStep} from './sarsa-experiment.mjs';
import {advanceRng} from './intervention-study.mjs';
import {certifyCueNative} from './cue-native-proof.mjs';
import {makeAdjacentConflictCodebook} from './adjacent-conflict-cues.mjs';
import {createDecoupledCueTaste} from './decoupled-cue-taste.mjs';
import {createContactActionBandit,contactActionObservationOperations,observeContactAction,freezeContactAction,resetContactAction} from './contact-action-bandit.mjs';

const steeringMethods={
  original:{choose:chooseOwnSteering,terminate:terminateOwnSteering,freeze:freezeOwnSteering,reset:resetOwnSteering},
  replay:{choose:chooseReplaySteering,terminate:terminateReplaySteering,freeze:freezeReplaySteering,reset:resetReplaySteering},
  'cue-shared':{choose:chooseCueSharedSteering,terminate:terminateCueSharedSteering,freeze:freezeCueSharedSteering,reset:resetCueSharedSteering}
};
const methods=run=>steeringMethods[run.steeringLearner??'original'];

export class OdorRoutedExperiment extends OwnSteeringExperiment{
  constructor({trainingRegime='continuous',steeringLearner='original',spatialSelector='filtered',contactCueMode='disabled',targetCueMode='disabled',phaseDurations=null,tasteDecisionMode=null,cueCurriculum='default',cueTastePolicy=null,cueTasteReplay=null,steeringProjection=null,steeringProtection=null,contactBandit=null,contactGateReplay=null,...options}){
    assert.ok(['continuous','freeze-after-A','reset-each-phase'].includes(trainingRegime));
    assert.ok(Object.hasOwn(steeringMethods,steeringLearner));
    assert.ok(['filtered','incremental'].includes(spatialSelector));
    assert.ok(['disabled','observe','filter'].includes(contactCueMode));
    assert.ok(['disabled','observe','filter'].includes(targetCueMode));
    assert.ok(tasteDecisionMode===null||['sample','threshold'].includes(tasteDecisionMode));
    assert.ok(['default','adjacent-opposed'].includes(cueCurriculum));
    assert.ok(cueTastePolicy===null||['shared','shared-plus-cue'].includes(cueTastePolicy));
    assert.ok(cueTasteReplay===null||cueTastePolicy!==null&&['mixed','fresh','rbase','blend'].includes(cueTasteReplay));
    assert.ok(steeringProjection===null||steeringLearner==='cue-shared'&&['control','project'].includes(steeringProjection));
    assert.ok(steeringProtection===null||steeringLearner==='cue-shared'&&steeringProjection===null&&['control','protect'].includes(steeringProtection));
    assert.ok(contactBandit===null||['learned','random','shadow'].includes(contactBandit)&&contactCueMode==='filter');
    assert.ok(contactGateReplay===null||['fresh','reservoir'].includes(contactGateReplay)&&contactBandit!==null);
    assert.ok(phaseDurations===null||Array.isArray(phaseDurations)&&phaseDurations.length===CONTINUAL_PHASES.length&&phaseDurations.every(value=>Number.isSafeInteger(value)&&value>0));
    super(options);
    this.trainingRegime=trainingRegime;this.steeringLearner=steeringLearner;this.spatialSelector=spatialSelector;
    if(contactCueMode!=='disabled')this.contactCueMode=contactCueMode;
    if(targetCueMode!=='disabled')this.targetCueMode=targetCueMode;
    if(tasteDecisionMode!==null)this.tasteDecisionMode=tasteDecisionMode;
    if(cueTastePolicy!==null)this.cueTastePolicy=cueTastePolicy;
    if(cueTasteReplay!==null)this.cueTasteReplay=cueTasteReplay;
    if(steeringProjection!==null)this.steeringProjection=steeringProjection;
    if(steeringProtection!==null)this.steeringProtection=steeringProtection;
    if(contactBandit!==null)this.contactBandit=contactBandit;
    if(contactGateReplay!==null)this.contactGateReplay=contactGateReplay;
    if(phaseDurations!==null){this.phaseDurations=[...phaseDurations];this.phaseEnd=this.world.tick+phaseDurations[0];}
    if(cueCurriculum==='adjacent-opposed'){const book=makeAdjacentConflictCodebook(this.history.cueSeed);assert.deepEqual(book.A,this.codebook.A);this.codebook=book;this.cueCurriculum=cueCurriculum;}
    for(const fly of this.world.flies){
      const old=this.learners[fly.id],seed=(this.history.seed^Math.imul(fly.id,2654435761))>>>0||1;
      const state=createOdorRoutedTasteBody(fly.id,seed);
      state.steering=steeringLearner==='replay'?createReplaySteering(fly.id,old.steering.rngState):steeringLearner==='cue-shared'?createCueSharedSteering(fly.id,old.steering.rngState,steeringProjection,steeringProtection):old.steering;
      if(steeringLearner==='cue-shared')state.work.scalarOperations+=state.steering.work.scalarOperations;
      state.spatialPoints=old.spatialPoints;state.scratch=old.scratch;state.lastCost=old.lastCost;
      if(this.targetCueMode){state.targetCues=[];state.work.scalarOperations++;}
      if(this.cueTastePolicy){state.cueTaste=createDecoupledCueTaste(fly.id,(seed^0x2c9277b5)>>>0||1);state.work.scalarOperations+=state.cueTaste.work.scalarOperations;}
      if(this.contactBandit){state.contactBandit=createContactActionBandit(fly.id,(seed^0x8452f721)>>>0||1,{replay:this.contactGateReplay!==undefined});state.work.scalarOperations+=state.contactBandit.work.scalarOperations;}
      this.learners[fly.id]=state;
    }
  }
  step(){
    if(this.finished||!this.world.flies.length)return false;
    if(this.targetCueMode)assert.ok(!this.wallShortcut&&!this.cueNativeProof);
    if(this.world.tick===this.phaseEnd){
      if(this.probe||++this.phaseIndex>=CONTINUAL_PHASES.length){this.finished=true;return false;}
      if(this.trainingRegime==='freeze-after-A'&&this.phaseIndex===1||this.trainingRegime==='reset-each-phase')for(const fly of this.world.flies){
        const state=this.learners[fly.id];
        if(this.trainingRegime==='freeze-after-A'){freezeOdorRoutedTaste(state);methods(this).freeze(state.steering);}
        else{resetOdorRoutedTaste(state);const work=state.steering.work.scalarOperations;methods(this).reset(state.steering);state.work.scalarOperations+=state.steering.work.scalarOperations-work;}
        if(state.contactBandit){const work=state.contactBandit.work.scalarOperations;if(this.trainingRegime==='freeze-after-A')freezeContactAction(state.contactBandit);else resetContactAction(state.contactBandit);state.work.scalarOperations+=state.contactBandit.work.scalarOperations-work;}
        state.charge.storageBytes=0;billSarsaWork(state,this.pricing);
      }
      if(this.phaseIndex===3){
        this.world.config.cueForaging=false;this.transfer=true;
        this.resource=enterContinualPhase(this.world,CONTINUAL_PHASES[0],this.history.resourceSeeds[3]);
      }else this.resource=enterCuePhase(this.world,CONTINUAL_PHASES[this.phaseIndex],this.history.resourceSeeds[this.phaseIndex],this.codebook);
      this.phaseEnd+=this.phaseDurations?.[this.phaseIndex]??CONTINUAL_PHASES[this.phaseIndex].ticks;
    }
    if(this.transfer)updateContinualResources(this.world,this.resource);else updateCueResources(this.world,this.resource);
    const family=this.transfer?(this.probe?'transfer':'odor-free-acquisition'):this.resource.family,stats=this.statistics[family]??={decisions:0,moves:[0,0,0],accept:0,intake:0,toxin:0,cost:0,steering:[0,0],available:0};
    const before=[...this.world.flies];
    this.world.step((fly,raw,tick)=>{
      const state=this.learners[fly.id],compareCues=Boolean(this.contactCueMode),observation=contactObservation(fly,this.world.food,fly.sensedCue,state.work,{compareCues});
      if(this.transfer){observation.cue=[0,0,0,0];observation.odorPresent=false;}
      state.work.scalarOperations++;
      const own={agentId:fly.id,tick,energy:fly.energy-state.charge.outstandingEnergy,raw,...observation};
      if(compareCues)state.work.scalarOperations++;
      const choice=chooseOdorRoutedTaste(state,own,{fixedMove:this.fixedMove??null,requireHomogeneousContact:this.contactCueMode==='filter',tasteDecisionMode:this.tasteDecisionMode??null,cueTastePolicy:this.cueTastePolicy??null,contactStop:this.contactStop??null,contactBandit:this.contactBandit??null});
      let recommendation,guard,available,features,steering,sine,cueProof=false,targetEvaluation=null;
      if(this.cueNativeProof&&!state.wallSkip){assert.notEqual(this.steeringMode,'guarded');cueProof=certifyCueNative(state.steering,own,state.work,state.cueProof);}
      if(this.wallShortcut&&state.wallSkip||cueProof){
        assert.ok(this.probe&&!state.steering.acquisition&&state.steering.pending===null);
        if(cueProof){state.work.scalarOperations+=encodedStateBytes(state.scratch.bins??{})+1;state.scratch.bins={};}
        else assert.ok(raw[10]!==0||raw[11]!==0);
        assert.ok(state.steering.lastDecisionTick===null||tick>state.steering.lastDecisionTick);
        state.steering.rngState=advanceRng(state.steering.rngState);state.steering.work.scalarOperations+=9;state.work.scalarOperations+=9;state.steering.lastDecisionTick=tick;
        recommendation=null;guard=cueProof?null:{wall:true,viable:null,requiredEnergy:null};available=cueProof?null:false;features=null;steering={action:0,proposed:0,predictions:null};sine=raw[2]-raw[1];
      }else{
        recommendation=(this.spatialSelector==='incremental'?incrementalOverlapRecommendation:filteredOverlapRecommendation)(state.spatialPoints,state.work,state.scratch);
        guard=overlapGuard(recommendation.point,raw,own.energy,fly.genome.traits.speed,state.lastCost,state.work);
        available=recommendation.pair[0]>=0&&!guard.wall&&guard.viable;const distance=Math.hypot(...recommendation.point);
        if(this.targetCueMode){
          state.work.scalarOperations++;
          if(available){const scores=recommendation.pair.map(index=>predictTargetTaste(state,state.targetCues[index],this.cueTastePolicy??null));state.work.scalarOperations+=3;
            targetEvaluation={scores,reject:scores[0]+scores[1]<1};}
        }
        features=[1,Math.max(0,Math.min(1,own.energy/120)),raw[10],raw[11],raw[13],Math.max(-1,Math.min(1,raw[12])),Math.min(1,distance/fly.genome.traits.sense),distance>0?recommendation.point[1]/distance:0];
        state.work.scalarOperations+=14;const steeringWork=state.steering.work.scalarOperations;
        const focalMode=this.focalSteering?.[fly.id]??null;if(focalMode!==null)assert.ok(this.probe&&this.targetCueMode!=='filter'&&!this.wallShortcut&&!this.cueNativeProof&&['native','learned'].includes(focalMode));
        const selectedMode=focalMode??this.steeringMode,forcedAction=selectedMode==='native'?0:selectedMode==='guarded'?Number(available):null;
        steering=methods(this).choose(state.steering,{agentId:fly.id,tick,energy:own.energy,features,midpointAvailable:available,cue:own.cue},{forcedAction});
        if(this.targetCueMode){state.work.scalarOperations++;
          if(this.targetCueMode==='filter'&&this.steeringMode==='learned'&&targetEvaluation?.reject&&steering.action===1){steering.action=0;state.work.scalarOperations++;if(state.steering.pending){state.steering.pending.action=0;state.work.scalarOperations++;}}}
        state.work.scalarOperations+=state.steering.work.scalarOperations-steeringWork;sine=steering.action===1&&distance>0?recommendation.point[1]/distance:raw[2]-raw[1];
      }
      const outputs=[Math.tanh(2*sine+1.8*(raw[10]-raw[11])),choice.move,choice.accept?1:-1,-1,0];state.work.scalarOperations+=10;
      stats.decisions++;stats.moves[choice.action]++;stats.accept+=Number(choice.accept);stats.steering[steering.action]++;stats.available+=Number(available);
      if(available===null)stats.unknownAvailability=(stats.unknownAvailability??0)+1;
      const bill=chargeForStep(state,this.pricing);
      this.emit?.({type:'decision',id:fly.id,tick,own,choice,steering,features,available,recommendation,guard,...(this.targetCueMode?{targetEvaluation}:{}),...(this.wallShortcut?{wallShortcut:state.wallSkip}:{}),...(this.cueNativeProof?{cueNativeProof:cueProof?structuredClone(state.cueProof):null}:{}),outputs,requestedExtra:bill.energyCost,work:state.work.scalarOperations,steeringWork:state.steering.work.scalarOperations,storageBytes:state.charge.storageBytes,...(this.auditSnapshots?{auditState:structuredClone(state),auditSpatial:this.auditSpatial[fly.id]}:{})});
      return {...bill,afterController:native=>native.splice(0,5,...outputs),afterStep:receipt=>{
        state.lastCost=receipt.cost;stats.intake+=receipt.beneficialEaten;stats.toxin+=receipt.toxinDamage;stats.cost+=receipt.cost;this.emit?.({type:'physical',...receipt});
      }};
    });
    for(const fly of before){
      const state=this.learners[fly.id],alive=this.world.flies.includes(fly);state.work.scalarOperations++;
      const own={agentId:fly.id,tick:this.world.tick,energy:(alive?fly.energy:0)-state.charge.outstandingEnergy,lastFood:fly.lastFood,terminal:!alive};
      observeOdorRoutedTaste(state,own,{cueTasteReplay:this.cueTasteReplay??null});
      if(!alive){const work=state.steering.work.scalarOperations;methods(this).terminate(state.steering,own);state.work.scalarOperations+=state.steering.work.scalarOperations-work;}
      if(state.contactBandit?.pending){const debt=state.charge.outstandingEnergy;billSarsaWork(state,this.pricing);const cost=contactActionObservationOperations(state.contactBandit,this.contactGateReplay??null),energy=own.energy-(state.charge.outstandingEnergy-debt)-cost*this.pricing.operationEnergy,work=state.contactBandit.work.scalarOperations;observeContactAction(state.contactBandit,{...own,energy},{replayPolicy:this.contactGateReplay??null});state.work.scalarOperations+=state.contactBandit.work.scalarOperations-work;}
      billSarsaWork(state,this.pricing);this.emit?.({type:'observe',own,...(this.auditSnapshots?{auditState:structuredClone(state)}:{})});
    }
    if(!this.probe&&this.world.tick===this.phaseEnd&&this.phaseIndex<4)this.anchors[this.phaseIndex===3?'D':CONTINUAL_PHASES[this.phaseIndex].id]=this.checkpoint(false);
    return true;
  }
  checkpoint(includeAnchors=true){const value=super.checkpoint(includeAnchors);value.kind='odor-routed-world';return value;}
  static restore(checkpoint,emit=null){
    assert.equal(checkpoint.kind,'odor-routed-world');const run=Object.create(OdorRoutedExperiment.prototype);
    Object.assign(run,structuredClone(checkpoint.state));run.world=World.restore(checkpoint.world);run.anchors=structuredClone(checkpoint.anchors);run.attach(emit);run.attachSpatial();return run;
  }
  static fork(anchor,{phase='A',seed,mode='current',modelAnchor=null,steeringMode=null,fixedMove=null,compactFrozen=false,wallShortcut=false,cueNativeProof=false,targetCueMode=null,emit=null}){
    assert.ok(['A','B','C','transfer'].includes(phase));assert.ok(['current','reset'].includes(mode));
    assert.equal(typeof compactFrozen,'boolean');assert.equal(typeof wallShortcut,'boolean');assert.equal(typeof cueNativeProof,'boolean');
    assert.ok(targetCueMode===null||['observe','filter'].includes(targetCueMode));
    assert.ok(steeringMode===null||['learned','native','guarded'].includes(steeringMode));assert.ok(fixedMove===null||[-1,0,1].includes(fixedMove));
    assert.ok(modelAnchor===null||mode==='current');
    if(modelAnchor!==null){
      assert.equal(modelAnchor.kind,'odor-routed-world');assert.deepEqual(modelAnchor.state.history,anchor.state.history);
      assert.deepEqual(modelAnchor.state.founderIds,anchor.state.founderIds);assert.equal(modelAnchor.state.acquisitionGeometry,anchor.state.acquisitionGeometry);
      assert.equal(modelAnchor.state.steeringLearner??'original',anchor.state.steeringLearner??'original');
      assert.equal(modelAnchor.state.spatialSelector??'filtered',anchor.state.spatialSelector??'filtered');
      assert.equal(modelAnchor.state.cueTastePolicy??null,anchor.state.cueTastePolicy??null);
      assert.equal(modelAnchor.state.cueTasteReplay??null,anchor.state.cueTasteReplay??null);
      assert.equal(modelAnchor.state.steeringProjection??null,anchor.state.steeringProjection??null);
      assert.equal(modelAnchor.state.steeringProtection??null,anchor.state.steeringProtection??null);
      assert.equal(modelAnchor.state.contactBandit??null,anchor.state.contactBandit??null);
      assert.equal(modelAnchor.state.contactGateReplay??null,anchor.state.contactGateReplay??null);
      assert.ok(modelAnchor.world.world.tick<=anchor.world.world.tick);
    }
    const run=OdorRoutedExperiment.restore(anchor,emit);run.anchors={};run.probe=true;run.finished=false;run.phaseEnd=run.world.tick+256;
    if(targetCueMode!==null)run.targetCueMode=targetCueMode;
    if(run.targetCueMode)assert.ok(!wallShortcut&&!cueNativeProof&&!run.wallShortcut&&!run.cueNativeProof);
    if(wallShortcut){assert.equal(run.spatialSelector,'incremental');assert.equal(run.steeringLearner,'cue-shared');run.wallShortcut=true;}
    if(cueNativeProof){assert.ok(wallShortcut);assert.equal(run.steeringLearner,'cue-shared');assert.notEqual(steeringMode??run.steeringMode,'guarded');run.cueNativeProof=true;}
    run.transfer=phase==='transfer';run.fixedMove=fixedMove;if(steeringMode!==null)run.steeringMode=steeringMode;
    run.startingDebt=Object.values(run.learners).reduce((sum,state)=>sum+state.charge.outstandingEnergy,0);
    for(const fly of run.world.flies){
      const state=run.learners[fly.id];
      if(modelAnchor!==null){
        assert.ok(modelAnchor.world.world.flies.some(source=>source.id===fly.id));
        const source=modelAnchor.state.learners[fly.id];assert.equal(source.agentId,fly.id);assert.equal(source.steering.agentId,fly.id);
        state.banks.present.weights=structuredClone(source.banks.present.weights);state.banks.absent.weights=structuredClone(source.banks.absent.weights);state.taste.weights=structuredClone(source.taste.weights);state.steering.weights=structuredClone(source.steering.weights);
      }else{
        state.banks.present.weights=structuredClone(state.banks.present.weights);state.banks.absent.weights=structuredClone(state.banks.absent.weights);state.taste.weights=structuredClone(state.taste.weights);state.steering.weights=structuredClone(state.steering.weights);
      }
      state.work.scalarOperations+=105;
      if(run.cueTastePolicy){const source=modelAnchor===null?state:modelAnchor.state.learners[fly.id];assert.ok(state.cueTaste&&source.cueTaste);state.cueTaste.weights=structuredClone(source.cueTaste.weights);state.cueTaste.residuals=structuredClone(source.cueTaste.residuals);state.work.scalarOperations+=27;}
      if(run.steeringLearner==='cue-shared'){
        state.steering.contextWeights=structuredClone(modelAnchor===null?state.steering.contextWeights:modelAnchor.state.learners[fly.id].steering.contextWeights);
        state.work.scalarOperations+=272;
      }
      if(state.contactBandit){const source=modelAnchor===null?state:modelAnchor.state.learners[fly.id];assert.ok(source.contactBandit);state.contactBandit.weights=structuredClone(source.contactBandit.weights);state.work.scalarOperations+=14;const work=state.contactBandit.work.scalarOperations;if(mode==='reset')resetContactAction(state.contactBandit);freezeContactAction(state.contactBandit);state.work.scalarOperations+=state.contactBandit.work.scalarOperations-work;}
      if(mode==='reset'){
        resetOdorRoutedTaste(state);const work=state.steering.work.scalarOperations;methods(run).reset(state.steering);
        state.work.scalarOperations+=state.steering.work.scalarOperations-work;
      }
      freezeOdorRoutedTaste(state);methods(run).freeze(state.steering);
      if(compactFrozen)compactFrozenOdorRoutedState(state);
      if(run.targetCueMode&&!Object.hasOwn(state,'targetCues')){state.targetCues=[];state.work.scalarOperations++;}
      if(wallShortcut){state.wallSkip=false;state.work.scalarOperations++;}
      if(cueNativeProof){state.cueProof={route:0,upper:0,reason:0,known:[0,0,0,0,0,0]};state.work.scalarOperations+=12;}
      state.charge.storageBytes=0;billSarsaWork(state,run.pricing);
    }
    run.world.config.cueForaging=!run.transfer;
    run.resource=run.transfer?enterContinualPhase(run.world,CONTINUAL_PHASES[0],seed):enterCuePhase(run.world,CONTINUAL_PHASES.find(item=>item.id===phase),seed,run.codebook);
    run.startingEnergy=run.world.flies.reduce((sum,fly)=>sum+fly.energy,0);run.statistics={};return run;
  }
}
