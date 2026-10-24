import {RNG} from '../engine.mjs';
import {actorParameters,ACTOR_BOUNDS} from './trace-actor.mjs';
import {TASK_STAGES,evaluateSeeds,interval95} from './tasks.mjs';
export const CURRICULUM_GATE=Object.freeze({accuracyLowerBound:.9,heldoutAccuracyLowerBound:.85,advantageLowerBound:.2,promotionLowerBound:.005,maximumRetrainingLoss:.02});
export function passesGate(result,{heldOut=false}={}){return result.summary.learned.ci95[0]>=(heldOut?CURRICULUM_GATE.heldoutAccuracyLowerBound:CURRICULUM_GATE.accuracyLowerBound)&&result.summary.learnedMinusfrozen.ci95[0]>=CURRICULUM_GATE.advantageLowerBound&&result.summary['learnedMinusmemory-reset'].ci95[0]>=CURRICULUM_GATE.advantageLowerBound;}
export function proposeParameters(parameters,rng,scale){
  const candidate={...parameters};
  candidate.traceRetention=1-(1-candidate.traceRetention)*Math.exp(rng.normal()*scale);
  candidate.learningScale*=Math.exp(rng.normal()*scale);
  // Binary episodic tasks identify learning scale and trace retention.
  // Exploration/eligibility decay are not tuned here because they do not affect this one-choice protocol.
  for(const[key,[min,max]]of Object.entries(ACTOR_BOUNDS)){if(['plasticOutputs','traceNormalization'].includes(key)&&candidate[key]===undefined)continue;candidate[key]=Math.max(min,Math.min(max,candidate[key]));}
  return actorParameters(candidate);
}
const seeds=(start,n=10)=>Array.from({length:n},(_,i)=>start+i);
const pause=()=>new Promise(resolve=>setImmediate(resolve));
export async function curriculumRound(state,{record=()=>{},shouldStop=()=>false}={}){
  const stage=TASK_STAGES[state.stage];if(!stage)return state;
  const round=state.round++,offset=state.seedOffset+round*100;
  const arms=['learned','frozen','memory-reset'];
  const incumbent=evaluateSeeds(seeds(offset+20000),stage,state.parameters,arms);await pause();
  const entry={round,stage:stage.id,parametersBefore:{...state.parameters},incumbent,proposals:[],promoted:false,stagePassed:false};
  if(passesGate(incumbent))entry.stagePassed=true;
  else if(!shouldStop()){
    const rng=new RNG(state.rngState),trainingSeeds=seeds(offset+10000),candidates=[state.parameters];
    for(let i=0;i<4;i++)candidates.push(proposeParameters(state.parameters,rng,state.proposalScale));
    state.rngState=rng.state;
    let best={parameters:state.parameters,score:-Infinity};
    for(const parameters of candidates){
      if(shouldStop())break;
      const development=evaluateSeeds(trainingSeeds,stage,parameters,['learned']);
      entry.proposals.push({parameters,developmentAccuracy:development.summary.learned.mean});
      if(development.summary.learned.mean>best.score)best={parameters,score:development.summary.learned.mean};
      await pause();
    }
    if(!shouldStop()&&JSON.stringify(best.parameters)!==JSON.stringify(state.parameters)){
      // This batch was not used to rank candidates. Both candidate and incumbent train from scratch on matched seeds.
      const freshSeeds=seeds(offset+40000),candidate=evaluateSeeds(freshSeeds,stage,best.parameters,arms);await pause();
      const control=evaluateSeeds(freshSeeds,stage,state.parameters,arms);
      const delta=interval95(candidate.rows.map((row,index)=>row.arms.learned.accuracy-control.rows[index].arms.learned.accuracy));
      const retrainingRegression=[];
      for(let earlier=0;earlier<state.stage;earlier++){
        const retainedSeeds=seeds(offset+60000+earlier*10000),a=evaluateSeeds(retainedSeeds,TASK_STAGES[earlier],best.parameters,['learned']),b=evaluateSeeds(retainedSeeds,TASK_STAGES[earlier],state.parameters,['learned']);
        retrainingRegression.push({stage:TASK_STAGES[earlier].id,difference:interval95(a.rows.map((row,index)=>row.arms.learned.accuracy-b.rows[index].arms.learned.accuracy))});await pause();
      }
      entry.candidate={parameters:best.parameters,gate:candidate,control,delta,retrainingRegression};
      if(delta.ci95[0]>CURRICULUM_GATE.promotionLowerBound&&retrainingRegression.every(result=>result.difference.ci95[0]>=-CURRICULUM_GATE.maximumRetrainingLoss)){
        state.parameters=best.parameters;state.promotions++;state.proposalScale=Math.min(1.5,state.proposalScale*1.1);entry.promoted=true;entry.stagePassed=passesGate(candidate);
      }
    }
    if(!entry.promoted)state.proposalScale=Math.max(.2,state.proposalScale*.95);
  }
  if(entry.stagePassed)state.stage++;
  state.history.push({round,stage:stage.id,promoted:entry.promoted,stagePassed:entry.stagePassed,accuracy:entry.candidate&&entry.promoted?entry.candidate.gate.summary.learned:incumbent.summary.learned,parameters:{...state.parameters}});
  await record(entry);return state;
}
