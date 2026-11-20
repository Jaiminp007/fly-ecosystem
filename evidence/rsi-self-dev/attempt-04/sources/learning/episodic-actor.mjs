import {createActorBrain,learnActor,observeActor,actActor} from './trace-actor.mjs';
import {createJointBrain,jointActorStep,finishJointTerminal,validateJointBrain} from './joint-episodic.mjs';
import {createEpisodicMemory,episodicFeatures,chooseEpisodic,rememberEpisodic,restoreEpisodicMemory,inspectEpisodic,validateEpisodicTarget,validateEpisodicRisk} from './episodic.mjs';

export const EPISODIC_BODY_DEFAULTS=Object.freeze({capacity:128,neighbors:8,bandwidth:.25,maxDistance:.6,exploration:.1,replacement:'reservoir',recencyHalfLife:0,featureMode:'slow',decisionTicks:4,creditTicks:16,discount:.95,returnMode:'mean',bootstrapMode:'greedy',actuator:'turn',turnGain:.25,moveGain:1,moveMode:'residual',slowSpeed:.2,fastSpeed:.6,memoryLearning:true,neuralLearning:true,reserveRisk:false,riskWeight:.1,reserveThreshold:.25,riskLearning:true,memoryEnergyPerRecordSecond:.00001,lookupEnergyPerRecord:.000005});
const memoryKeys=['capacity','neighbors','bandwidth','maxDistance','exploration','replacement','recencyHalfLife','priorStrength'];
export function episodicBodyParameters(values={}){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid episodic body parameters');
 for(const key of Object.keys(values))if(!Object.hasOwn(EPISODIC_BODY_DEFAULTS,key)&&key!=='priorStrength')throw Error(`Unknown episodic body parameter: ${key}`);
 const priorStrength=values.priorStrength===undefined?0:values.priorStrength;
 if(!Number.isFinite(priorStrength)||priorStrength<0||priorStrength>16)throw Error('Invalid episodic body priorStrength');
 if(priorStrength>0&&(values.actuator==='joint'||values.reserveRisk))throw Error('Pooled prior requires binary control without reserve risk');
 const result={...EPISODIC_BODY_DEFAULTS,...values};if(priorStrength===0)delete result.priorStrength;
 createEpisodicMemory(Object.fromEntries(memoryKeys.filter(key=>result[key]!==undefined).map(key=>[key,result[key]])));
 if(!['slow','fast','current','mixed','local','navigation'].includes(result.featureMode))throw Error('Invalid episodic feature mode');
 if(!['turn','move','joint'].includes(result.actuator))throw Error('Invalid episodic actuator');
 if(!['residual','levels'].includes(result.moveMode)||result.moveMode==='levels'&&!['move','joint'].includes(result.actuator))throw Error('Invalid episodic movement mode');
 if(!Number.isFinite(result.slowSpeed)||!Number.isFinite(result.fastSpeed)||result.slowSpeed<0||result.fastSpeed>1||result.slowSpeed>=result.fastSpeed)throw Error('Invalid episodic speed levels');
 for(const key of ['memoryLearning','neuralLearning','reserveRisk','riskLearning'])if(typeof result[key]!=='boolean')throw Error(`Invalid episodic ${key}`);
 for(const[key,min,max]of [['riskWeight',0,2],['reserveThreshold',.05,.75]])if(!Number.isFinite(result[key])||result[key]<min||result[key]>max)throw Error(`Invalid episodic ${key}`);
 for(const[key,min,max,integer]of [['decisionTicks',1,16,true],['creditTicks',1,64,true],['discount',0,1,false],['turnGain',0,1,false],['moveGain',0,2,false],['memoryEnergyPerRecordSecond',0,.001,false],['lookupEnergyPerRecord',0,.001,false]])if(!Number.isFinite(result[key])||result[key]<min||result[key]>max||integer&&!Number.isInteger(result[key]))throw Error(`Invalid episodic body ${key}`);
 if(!['mean','td'].includes(result.returnMode))throw Error('Invalid episodic return mode');
 if(result.returnMode==='td'&&(result.creditTicks!==result.decisionTicks||result.discount>=1))throw Error('TD targets require aligned action/credit windows and discount < 1');
 if(!['greedy','expected'].includes(result.bootstrapMode)||result.bootstrapMode==='expected'&&result.returnMode!=='td')throw Error('Invalid episodic bootstrap mode; expected requires TD targets');
 if(result.reserveRisk&&result.returnMode!=='td')throw Error('Reserve risk requires aligned TD targets');
 if(result.actuator==='joint'&&(result.returnMode!=='td'||result.reserveRisk||result.maxDistance>=2))throw Error('Joint control requires TD, no reserve auxiliary, and retrieval radius <2');
 return result;
}
export function createEpisodicActorBrain(genome,seed,values={}){
 const parameters=episodicBodyParameters(values);if(parameters.actuator==='joint')return createJointBrain(genome,seed,parameters);const brain=createActorBrain(genome,seed);
 brain.episodic={schema:1,actuator:parameters.actuator,returnMode:parameters.returnMode,featureMode:parameters.featureMode,moveMode:parameters.moveMode,...(parameters.bootstrapMode==='expected'?{bootstrapMode:'expected'}:{}),...(parameters.reserveRisk?{reserveRisk:true,reserveThreshold:parameters.reserveThreshold,riskWeight:parameters.riskWeight,riskLearning:parameters.riskLearning}:{}),...(parameters.moveMode==='levels'?{speedLevels:[parameters.slowSpeed,parameters.fastSpeed]}:{}),steps:0,choice:0,lastCorrection:0,lookupRecordsThisStep:0,pending:[],memory:createEpisodicMemory(Object.fromEntries(memoryKeys.filter(key=>parameters[key]!==undefined).map(key=>[key,parameters[key]])),((seed^0x517a9)>>>0)||1)};
 return brain;
}
function reserveDeficit(energyFraction,threshold){
 if(!Number.isFinite(energyFraction)||energyFraction<0||energyFraction>1.000001)throw Error('Invalid observed energy fraction');
 return Math.max(0,1-energyFraction/threshold);
}
function accumulateReturns(state,reward,discount,deficit=null){
 for(const item of state.pending){item.return+=item.nextDiscount*reward;if(deficit!==null)item.riskReturn+=item.nextDiscount*deficit;item.weight+=item.nextDiscount;item.nextDiscount*=discount;item.elapsed++;}
}
function storeValueTargets(state,parameters,items,nextValue,step,terminal=false,nextRisk=0){
 for(const item of items){
  const target={kind:'td',observed:(1-parameters.discount)*item.return,estimatedFuture:terminal?0:item.nextDiscount*nextValue,discountPower:item.nextDiscount,horizon:item.elapsed,terminal,...(parameters.bootstrapMode==='expected'?{bootstrapMode:'expected',exploration:parameters.exploration}:{})};
  const value=Math.max(-1,Math.min(1,target.observed+target.estimatedFuture));
  const risk=parameters.reserveRisk&&parameters.riskLearning?{kind:'reserve-deficit',threshold:parameters.reserveThreshold,observed:(1-parameters.discount)*item.riskReturn,estimatedFuture:item.nextDiscount*(terminal?1:nextRisk),discountPower:item.nextDiscount,horizon:item.elapsed,terminal}:null;
  if(risk)risk.value=Math.min(1,risk.observed+risk.estimatedFuture);
  rememberEpisodic(state.memory,item.features,item.action,value,target,risk);
  state.lastUpdate={step,action:item.action,value,target:{...target},...(risk?{risk:{...risk}}:{})};
 }
}
export function episodicActorStep(genome,brain,inputs,reward,learning,actorParameters,values){
 if(values.actuator==='joint')return jointActorStep(genome,brain,inputs,reward,learning,actorParameters,values);
 const state=brain.episodic,p=values;state.lookupRecordsThisStep=0;
 if(learning&&p.memoryLearning){
  accumulateReturns(state,reward,p.discount,p.reserveRisk&&p.riskLearning?reserveDeficit(inputs[4],p.reserveThreshold):null);
  if(p.returnMode==='mean'){
   for(const item of state.pending.filter(item=>item.elapsed>=p.creditTicks))rememberEpisodic(state.memory,item.features,item.action,Math.max(-1,Math.min(1,item.return/Math.max(1e-12,item.weight))));
   state.pending=state.pending.filter(item=>item.elapsed<p.creditTicks);
  }
 }else state.pending=[];
 const output=p.actuator==='move'?1:0,gain=p.actuator==='move'?p.moveGain:p.turnGain;
 // Keep the steering scaffold fixed in both experiments. Also freeze the
 // memory-controlled output: its executed correction differs from the neural
 // sample, so assigning that sample's score update would misattribute credit.
 learnActor(genome,brain,reward,learning&&p.neuralLearning,{...actorParameters,plasticOutputs:(actorParameters.plasticOutputs??31)&~1&~(1<<output)});
 observeActor(genome,brain,inputs,actorParameters);const actions=actActor(genome,brain,{parameters:actorParameters});
 if(p.returnMode==='td'&&state.pending.some(item=>item.elapsed>=p.creditTicks)){
  const features=episodicFeatures(genome,brain,p.featureMode),scores=inspectEpisodic(state.memory,features,{reserveRisk:p.reserveRisk,riskWeight:p.riskWeight}),best=p.reserveRisk?(scores.positive.score>=scores.negative.score?scores.positive:scores.negative):null;
  state.lookupRecordsThisStep+=state.memory.records.length;
  const greedyValue=best?best.estimate:Math.max(scores.negative.estimate,scores.positive.estimate),greedyRisk=best?.riskEstimate??0;
  // Expected SARSA: evaluate the actual epsilon-greedy choice distribution,
  // rather than predicting a future without the configured exploration.
  const nextValue=p.bootstrapMode==='expected'?(1-p.exploration)*greedyValue+p.exploration*(scores.negative.estimate+scores.positive.estimate)/2:greedyValue;
  const nextRisk=p.bootstrapMode==='expected'&&p.reserveRisk?(1-p.exploration)*greedyRisk+p.exploration*(scores.negative.riskEstimate+scores.positive.riskEstimate)/2:greedyRisk;
  storeValueTargets(state,p,state.pending.filter(item=>item.elapsed>=p.creditTicks),nextValue,state.steps+1,false,nextRisk);
  state.pending=state.pending.filter(item=>item.elapsed<p.creditTicks);
 }
 if(state.steps%p.decisionTicks===0){
  const features=episodicFeatures(genome,brain,p.featureMode);state.lookupRecordsThisStep+=state.memory.records.length;
  state.choice=chooseEpisodic(state.memory,features,{sample:true,randomTies:true,reserveRisk:p.reserveRisk,riskWeight:p.riskWeight,capture:decision=>{state.lastDecision={step:state.steps+1,actuator:p.actuator,returnMode:p.returnMode,moveMode:p.moveMode,...(p.priorStrength?{priorStrength:p.priorStrength}:{}),...(p.bootstrapMode==='expected'?{bootstrapMode:'expected'}:{}),...(p.reserveRisk?{reserveRisk:true,riskWeight:p.riskWeight}:{}),features:[...features],...decision};}});
  if(learning&&p.memoryLearning)state.pending.push({features,action:state.choice,return:0,weight:0,nextDiscount:1,elapsed:0,...(p.reserveRisk&&p.riskLearning?{riskReturn:0}:{})});
 }
 const base=actions[output];actions[output]=p.actuator==='move'&&p.moveMode==='levels'?2*(state.choice<0?p.slowSpeed:p.fastSpeed)-1:Math.max(-1,Math.min(1,base+gain*state.choice));state.lastCorrection=actions[output]-base;brain.activity[genome.actor.inputs+output]=actions[output];state.steps++;
 return actions;
}
// Record the final observed transition with zero future value. Acquired memory
// still dies with this agent; terminal targets are never inherited by children.
export function finishEpisodicTerminal(brain,reward,learning,parameters,energyFraction){
 if(parameters.actuator==='joint')return finishJointTerminal(brain,reward,learning,parameters);
 const state=brain.episodic;
 if(parameters.returnMode!=='td'||!learning||!parameters.memoryLearning)return;
 accumulateReturns(state,reward,parameters.discount,parameters.reserveRisk&&parameters.riskLearning?reserveDeficit(energyFraction,parameters.reserveThreshold):null);
 storeValueTargets(state,parameters,state.pending,0,state.steps,true);state.pending=[];
}
export function episodicEnergyCost(brain,parameters,dt){return (parameters.reserveRisk?2:1)*(brain.episodic.memory.records.length*parameters.memoryEnergyPerRecordSecond*dt+brain.episodic.lookupRecordsThisStep*parameters.lookupEnergyPerRecord);}
export function validateEpisodicActorBrain(brain,values){
 const p=episodicBodyParameters(values);if(p.actuator==='joint')return validateJointBrain(brain,p);const state=brain?.episodic;
 if(state?.schema!==1||!Number.isSafeInteger(state.steps)||state.steps<0||state.steps!==brain.actor?.steps||![-1,0,1].includes(state.choice)||state.steps>0&&state.choice===0||!Number.isInteger(state.lookupRecordsThisStep)||state.lookupRecordsThisStep<0||state.lookupRecordsThisStep>(p.returnMode==='td'?2:1)*p.capacity||!Array.isArray(state.pending)||state.pending.length>Math.ceil(p.creditTicks/p.decisionTicks)+1)throw Error('Invalid episodic actor state');
 const memory=restoreEpisodicMemory(state.memory);
 if(memory.config.dimensions!==17)throw Error('Binary episodic memory domain mismatch');
 if((state.bootstrapMode??'greedy')!==p.bootstrapMode)throw Error('Episodic bootstrap state mismatch');
 if(state.featureMode!==undefined&&state.featureMode!==p.featureMode||p.featureMode==='navigation'&&state.featureMode!=='navigation')throw Error('Episodic feature state mismatch');
 const validateBootstrap=target=>{if(target&&((target.bootstrapMode??'greedy')!==p.bootstrapMode||p.bootstrapMode==='expected'&&target.exploration!==p.exploration))throw Error('Episodic bootstrap target mismatch');};
 for(const record of memory.records)validateBootstrap(record.target);
 if((state.reserveRisk??false)!==p.reserveRisk||p.reserveRisk&&['reserveThreshold','riskWeight','riskLearning'].some(key=>state[key]!==p[key]))throw Error('Episodic reserve-risk configuration mismatch');
 const validateRisk=(risk,target)=>{if(Boolean(risk)!==Boolean(p.reserveRisk&&p.riskLearning))throw Error('Episodic reserve-risk target mode mismatch');if(risk){validateEpisodicRisk(risk);if(risk.threshold!==p.reserveThreshold)throw Error('Episodic reserve-risk threshold mismatch');if(!target||['horizon','discountPower','terminal'].some(key=>risk[key]!==target[key]))throw Error('Episodic reserve-risk alignment mismatch');}};
 for(const record of memory.records)validateRisk(record.risk,record.target);
 if((state.returnMode??'mean')!==p.returnMode||memory.records.some(record=>(record.target?.kind==='td')!==(p.returnMode==='td')))throw Error('Episodic return mode mismatch');
 if(state.lastUpdate!==undefined){
  const u=state.lastUpdate;if(p.returnMode!=='td'||!Number.isSafeInteger(u?.step)||u.step<1||u.step>state.steps||![-1,1].includes(u.action)||!Number.isFinite(u.value)||Math.abs(u.value)>1)throw Error('Invalid episodic value update');
  validateEpisodicTarget(u.target,u.value);
  validateBootstrap(u.target);
  validateRisk(u.risk,u.target);
 }
 if((state.actuator??'turn')!==p.actuator)throw Error('Episodic actuator state mismatch');
 if((state.moveMode??'residual')!==p.moveMode||p.moveMode==='levels'&&(!Array.isArray(state.speedLevels)||state.speedLevels.length!==2||state.speedLevels[0]!==p.slowSpeed||state.speedLevels[1]!==p.fastSpeed))throw Error('Episodic movement mode mismatch');
 if(state.lastDecision!==undefined){
  const decision=state.lastDecision,r=decision?.retrieval;
  if((decision?.bootstrapMode??'greedy')!==p.bootstrapMode)throw Error('Episodic bootstrap decision mismatch');
  if((decision?.reserveRisk??false)!==p.reserveRisk||p.reserveRisk&&decision.riskWeight!==p.riskWeight)throw Error('Episodic reserve-risk decision mismatch');
  if((decision?.actuator??'turn')!==p.actuator)throw Error('Episodic decision actuator mismatch');
  if((decision?.returnMode??'mean')!==p.returnMode)throw Error('Episodic decision return mode mismatch');
  if((decision?.moveMode??'residual')!==p.moveMode)throw Error('Episodic decision movement mode mismatch');
  if((decision?.priorStrength??0)!==(p.priorStrength??0))throw Error('Episodic prior decision mismatch');
  if(!Number.isSafeInteger(decision?.step)||decision.step<1||decision.step>state.steps||state.steps-decision.step>=p.decisionTicks||decision.choice!==state.choice||!['tie','exploration','retrieval'].includes(decision.reason)||!Array.isArray(decision.features)||decision.features.length!==17||decision.features.some(value=>!Number.isFinite(value)||Math.abs(value)>1.000001)||!Number.isInteger(r?.stored)||r.stored<0||r.stored>p.capacity||!Number.isSafeInteger(r.seen)||r.seen<r.stored||r.seen>memory.seen)throw Error('Invalid episodic decision');
  for(const key of ['negative','positive']){
   const score=r[key];if(!Number.isFinite(score?.estimate)||Math.abs(score.estimate)>1.000001||!Array.isArray(score.neighbors)||score.neighbors.length>p.neighbors)throw Error('Invalid episodic retrieval');
   if(p.priorStrength){
    if(!Number.isFinite(score.rawEstimate)||Math.abs(score.rawEstimate)>1.000001||!Number.isFinite(score.priorEstimate)||Math.abs(score.priorEstimate)>1.000001||!Number.isFinite(score.supportWeight)||score.supportWeight<0||score.supportWeight>p.neighbors+1e-9||score.priorWeight!==p.priorStrength||Math.abs(score.estimate-(score.supportWeight*score.rawEstimate+p.priorStrength*score.priorEstimate)/(score.supportWeight+p.priorStrength))>1e-9)throw Error('Invalid episodic pooled-prior estimate');
   }else if(['rawEstimate','priorEstimate','supportWeight','priorWeight'].some(field=>score[field]!==undefined))throw Error('Unexpected episodic pooled-prior estimate');
   if(p.reserveRisk&&(!Number.isFinite(score.riskEstimate)||score.riskEstimate<0||score.riskEstimate>1+1e-9||!Number.isFinite(score.score)||Math.abs(score.score-(score.estimate-p.riskWeight*score.riskEstimate))>1e-9)||!p.reserveRisk&&(score.riskEstimate!==undefined||score.score!==undefined))throw Error('Invalid episodic reserve-risk estimate');
   for(const row of score.neighbors)validateRisk(row.risk,row.target);
   for(const row of score.neighbors)validateBootstrap(row.target);
   for(const row of score.neighbors){if(!Number.isInteger(row.index)||row.index<0||row.index>=r.stored||row.experience!==null&&(!Number.isSafeInteger(row.experience)||row.experience<1||row.experience>r.seen)||row.action!==(key==='negative'?-1:1)||!Number.isFinite(row.reward)||Math.abs(row.reward)>1||!Number.isFinite(row.distance)||row.distance<0||row.distance>p.maxDistance+1e-9||!Array.isArray(row.features)||row.features.length!==17||row.features.some(value=>!Number.isFinite(value)||Math.abs(value)>1.000001))throw Error('Invalid episodic recalled experience');if((row.target?.kind==='td')!==(p.returnMode==='td'))throw Error('Episodic recalled target mode mismatch');if(row.target)validateEpisodicTarget(row.target,row.reward);}
  }
 }
 if(state.lastCorrection!==undefined&&(!Number.isFinite(state.lastCorrection)||Math.abs(state.lastCorrection)>(p.moveMode==='levels'?2:p.actuator==='move'?p.moveGain:p.turnGain)+1e-9))throw Error('Invalid episodic correction');
 for(const key of memoryKeys)if((memory.config[key]??(['recencyHalfLife','priorStrength'].includes(key)?0:undefined))!==(p[key]??(key==='priorStrength'?0:undefined)))throw Error('Episodic memory configuration mismatch');
 for(const item of state.pending)if(p.reserveRisk&&p.riskLearning?(!Number.isFinite(item.riskReturn)||item.riskReturn<0||item.riskReturn>item.weight+1e-9):item.riskReturn!==undefined)throw Error('Invalid episodic reserve-risk queue');
 for(const item of state.pending)if(!Array.isArray(item.features)||item.features.length!==17||item.features.some(value=>!Number.isFinite(value)||Math.abs(value)>1.000001)||![-1,1].includes(item.action)||!Number.isInteger(item.elapsed)||item.elapsed<0||item.elapsed>=p.creditTicks||!Number.isFinite(item.return)||!Number.isFinite(item.weight)||item.weight<0||Math.abs(item.return)>item.weight+1e-9||!Number.isFinite(item.nextDiscount)||item.nextDiscount<0||item.nextDiscount>1)throw Error('Invalid episodic credit queue');
}
