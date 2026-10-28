import {createPredictiveModel,predictTransition,learnTransition,planTransitionActions} from '../learning/predictive-model.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';

const referenceDirectory=resolve(process.argv[2]||'evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7'),directory=resolve(process.argv[3]||`evidence/predictive-transitions/${randomUUID()}`),referenceBytes=await readFile(join(referenceDirectory,'protocol.json')),reference=JSON.parse(referenceBytes),outcomeBytes=await readFile(join(referenceDirectory,'outcomes.json')),outcomes=JSON.parse(outcomeBytes),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
for(const[file,sha]of Object.entries(reference.sourceSha256))assert.equal(hash(await readFile(join(referenceDirectory,'sources',file))),sha);
const {World}=await import(pathToFileURL(join(referenceDirectory,'sources/engine.mjs')).href),sourceFiles=['learning/predictive-model.mjs','learning/tasks.mjs','scripts/predictive-transition-probe.mjs'],sourceSha256={};for(const file of sourceFiles){const bytes=await readFile(file);sourceSha256[file]=hash(bytes);const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);}
const protocol={at:new Date().toISOString(),experiment:'offline-own-experience-transition-probe',referenceDirectory,referenceSha256:hash(referenceBytes),outcomesSha256:hash(outcomeBytes),archivedSourceSha256:reference.sourceSha256,sourceSha256,seeds:reference.seeds.slice(0,6),environments:reference.environments,learningRate:.2,holdoutFromTick:900,horizonTicks:reference.horizonTicks,modelArms:['online','actionErased','frozenAtHoldout','resetAtHoldout','zero'],planningTicks:[600,1200,1700],planningHorizon:8,decisionRule:'Predictive-screen signal requires negative upper interval bounds for holdout reward MSE of online minus actionErased AND online minus last-reward persistence in BOTH environments. This does not qualify a policy. No parameter search or sample extension.',interpretation:'Each founder owns its own action-conditioned model, trained only on its actual completed consecutive observation/action/reward transitions. Next-observation targets are residuals from the current observation. Query predictions before updating from that transition; evaluate the chronological second half. The historical controller generates the trajectory unchanged. Rewards are actual own net energy increments, not counterfactual/oracle labels. Targets are stored separately from predictor inputs. Action-erased models share shape/rate; freeze/reset controls isolate acquisition history. Plans are learned fixed-action open-loop forecasts and never affect worlds or train the model. Historical seeds are reused exploratory data, not untouched policy qualification. No model metabolic price or world checkpoint integration is claimed.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'reference-protocol.json'),referenceBytes);await writeFile(join(directory,'reference-outcomes.json'),outcomeBytes);
const rows=[],fresh=()=>Object.fromEntries(protocol.modelArms.map(arm=>[arm,createPredictiveModel({learningRate:protocol.learningRate,actionConditioned:arm!=='actionErased'})])),errors=()=>Object.fromEntries([...protocol.modelArms,'persistence'].map(arm=>[arm,{count:0,rewardSquaredError:0,observationSquaredError:0}]));
for(const seed of protocol.seeds)for(const [environment,settings]of Object.entries(reference.environments)){
  const world=new World({seed,founders:reference.founders,capacity:240,reproduction:false,mutation:false,...settings,controller:'episodic-actor',learning:true,actorParameters:{...reference.actorParameters},episodicParameters:{...reference.parameters,memoryLearning:true,neuralLearning:true}}),states=new Map(world.flies.map(fly=>[fly.id,{models:fresh(),pending:null,lastReward:0,reset:false}])),totals=errors(),samples=[],plans=[];
  for(let tick=0;tick<reference.horizonTicks;tick++){
    const before=[...world.flies];if(!world.step())break;
    for(const fly of before){
      const state=states.get(fly.id),pending=state.pending;
      if(pending){
        const target={reward:pending.targetReward,nextObservation:[...fly.lastInputs]},scoring=pending.tick>=protocol.holdoutFromTick;
        for(const arm of protocol.modelArms){const prediction=pending.predictions[arm],rewardSquaredError=(prediction.reward-target.reward)**2,observationSquaredError=prediction.nextObservation.reduce((sum,value,i)=>sum+(value-target.nextObservation[i])**2,0)/17;if(scoring){const score=totals[arm];score.count++;score.rewardSquaredError+=rewardSquaredError;score.observationSquaredError+=observationSquaredError;}
          const enabled=arm!=='zero'&&(arm!=='frozenAtHoldout'||pending.tick<protocol.holdoutFromTick);learnTransition(state.models[arm],pending.observation,pending.action,target,{learning:enabled});
        }
        if(scoring){const score=totals.persistence;score.count++;score.rewardSquaredError+=(pending.persistenceReward-target.reward)**2;score.observationSquaredError+=pending.observation.reduce((sum,value,i)=>sum+(value-target.nextObservation[i])**2,0)/17;}
        if(fly.id===1&&pending.tick%300===0)samples.push({tick:pending.tick,agentId:fly.id,observation:pending.observation,action:pending.action,target,predictions:pending.predictions,persistenceReward:pending.persistenceReward,modelSeen:Object.fromEntries(Object.entries(state.models).map(([arm,model])=>[arm,model.seen]))});
      }
      if(!world.flies.includes(fly)){state.pending=null;continue;}
      if(world.tick===protocol.holdoutFromTick&&!state.reset){state.models.resetAtHoldout=createPredictiveModel({learningRate:protocol.learningRate});state.reset=true;}
      // Predictor arguments contain ONLY current observation and executed
      // action. The reward target is assigned after all predictions are made.
      const observation=[...fly.lastInputs],action=[...fly.lastActions],predictions=Object.fromEntries(Object.entries(state.models).map(([arm,model])=>[arm,predictTransition(model,observation,action)]));
      state.pending={tick:world.tick,observation,action,predictions,persistenceReward:state.lastReward,targetReward:fly.reward};state.lastReward=fly.reward;
      if(fly.id===1&&protocol.planningTicks.includes(world.tick)){
        const options=[{id:'slow',action:action.map((v,i)=>i===1?2*reference.parameters.slowSpeed-1:v)},{id:'fast',action:action.map((v,i)=>i===1?2*reference.parameters.fastSpeed-1:v)}],beforeHash=hash(JSON.stringify(state.models.online)),plan=planTransitionActions(state.models.online,observation,options,{horizon:protocol.planningHorizon});assert.equal(hash(JSON.stringify(state.models.online)),beforeHash);plans.push({tick:world.tick,agentId:fly.id,observation,options,plan,usedForControl:false});
      }
    }
  }
  const expected=outcomes.find(row=>row.seed===seed).environments[environment].incumbent,sha256=hash(JSON.stringify(world.checkpoint()));assert.equal(sha256,expected.fullStateSha256);
  const metrics=Object.fromEntries(Object.entries(totals).map(([arm,s])=>[arm,{...s,rewardMSE:s.rewardSquaredError/s.count,observationMSE:s.observationSquaredError/s.count}]));assert.ok(Object.values(metrics).every(s=>s.count===metrics.online.count&&s.count>0));
  rows.push({seed,environment,exactOriginalWorld:true,sha256,metrics,samples,plans,acquisition:Object.fromEntries([...states].map(([id,state])=>[id,Object.fromEntries(Object.entries(state.models).map(([arm,model])=>[arm,{seen:model.seen,learnedScalars:model.weights.flat().filter(x=>x!==0).length,sha256:hash(JSON.stringify(model))}]))]))});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows},null,2)+'\n');console.log(JSON.stringify({directory,seed,environment,count:metrics.online.count,exactOriginalWorld:true}));
}
const comparisons=Object.fromEntries(Object.keys(reference.environments).map(environment=>{const selected=rows.filter(row=>row.environment===environment);return[environment,Object.fromEntries(['actionErased','frozenAtHoldout','resetAtHoldout','zero','persistence'].map(arm=>[arm,Object.fromEntries(['rewardMSE','observationMSE'].map(key=>[key,interval95(selected.map(row=>row.metrics.online[key]-row.metrics[arm][key]))]))]))];}));
const predictiveSignal=Object.values(comparisons).every(env=>env.actionErased.rewardMSE.ci95[1]<0&&env.persistence.rewardMSE.ci95[1]<0);
for(const[file,sha]of Object.entries(sourceSha256))assert.equal(hash(await readFile(file)),sha);
const result={protocol,rows,comparisons,predictiveSignal,qualificationPassed:false,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({directory,phase:'done',worlds:rows.length,predictiveSignal,comparisons},null,2));
