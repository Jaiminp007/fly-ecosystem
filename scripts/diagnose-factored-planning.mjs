import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';

// Reused failed cases, frozen acquired models, and privileged teacher forcing.
// None of the diagnostic future states/actions/outcomes train a model or policy.
const referenceDirectory=resolve(process.argv[2]||'evidence/factored-prediction/cab9ade1-38d0-451a-a903-d785ec789278');
const directory=resolve(process.argv[3]||`evidence/planning-diagnosis/${randomUUID()}`);
const read=async file=>JSON.parse(await readFile(join(referenceDirectory,file),'utf8'));
const original=await read('results.json'),p=original.protocol,reference=await read('reference-protocol.json');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const[file,sha]of Object.entries(p.sourceSha256))assert.equal(hash(await readFile(join(referenceDirectory,'sources',file))),sha);
for(const[file,sha]of Object.entries(p.worldSourceSha256))assert.equal(hash(await readFile(join(p.worldSources,file))),sha);
const {World}=await import(pathToFileURL(join(p.worldSources,'engine.mjs')).href);
const {createPredictiveModel,predictTransition,learnTransition}=await import(pathToFileURL(join(referenceDirectory,'sources/learning/predictive-model.mjs')).href);
// Same declared world-level interval convention, without importing task-world
// dependencies absent from the predictor-only archive.
function interval95(values){const n=values.length,mean=values.reduce((sum,x)=>sum+x,0)/n;if(n<2)return{mean,ci95:[null,null],n};const sd=Math.sqrt(values.reduce((sum,x)=>sum+(x-mean)**2,0)/(n-1)),t=n>=30?2.045:n>=20?2.093:n>=10?2.262:3.182,half=t*sd/Math.sqrt(n);return{mean,ci95:[mean-half,mean+half],n};}
const clip=x=>Math.max(-1,Math.min(1,x)),sign=x=>Math.abs(x)<1e-9?0:Math.sign(x);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`Mismatch ${a} / ${b}`);
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const source=await readFile(new URL(import.meta.url));
const protocol={at:new Date().toISOString(),experiment:'failed-factored-plan-error-decomposition',referenceDirectory,referenceSha256:hash(await readFile(join(referenceDirectory,'results.json'))),sourceSha256:hash(source),seeds:p.seeds,environments:p.environments,discount:.99,horizon:p.planningHorizon,stages:['heldActions','actualActionSchedule','teacherForced','actualReward','energy'],interpretation:'Fixed reused failure diagnosis, not policy selection or qualification. Every predictor is reconstructed from only its own prior factual transitions and frozen during forks. Actual future action schedules, sensory states, and rewards are privileged diagnostic inputs and cannot be deployed as predictors. Stage gaps form an additive numerical decomposition, not independent causal estimates. No fork outcomes train any model. No live policy, difficulty or qualification gate changes.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'diagnose-source.mjs'),source);
await writeFile(join(directory,'runner.json'),JSON.stringify({pid:process.pid,status:'running'})+'\n');
console.log(JSON.stringify({directory,phase:'start'}));
const advance=s=>{let x=s;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;},forced={};
for(let s=1;s<1_000_000&&Object.keys(forced).length<2;s++){const a=advance(s),b=advance(a);if(a/4294967296<reference.parameters.exploration)forced[b/4294967296<.5?-1:1]??=s;}
assert.ok(forced[-1]&&forced[1]);
const makeConfig=(seed,settings)=>({seed,founders:reference.founders,capacity:240,reproduction:false,mutation:false,...settings,controller:'episodic-actor',learning:true,actorParameters:{...reference.actorParameters},episodicParameters:{...reference.parameters,memoryLearning:true,neuralLearning:true}});
const rows=[];
for(const recorded of original.rows){
  const world=new World(makeConfig(recorded.seed,p.environments[recorded.environment]));
  const ids=[...new Set(recorded.plans.map(c=>c.agentId))];
  const states=new Map(ids.map(id=>[id,{model:createPredictiveModel({learningRate:p.learningRate,...p.definitions.factored}),pending:null}]));
  const cases=[];
  for(let tick=0;tick<p.horizonTicks;tick++){
    const before=[...world.flies];if(!world.step())break;
    for(const fly of before){const s=states.get(fly.id);if(!s)continue;
      if(s.pending)learnTransition(s.model,s.pending.observation,s.pending.action,{reward:s.pending.reward,nextObservation:[...fly.lastInputs]});
      s.pending=world.flies.includes(fly)?{observation:[...fly.lastInputs],action:[...fly.lastActions],reward:fly.reward}:null;
    }
    for(const c of recorded.plans.filter(c=>c.tick===world.tick)){
      const model=states.get(c.agentId).model,modelHash=hash(JSON.stringify(model));assert.equal(modelHash,c.modelSha256);assert.equal(model.seen,c.modelSeen);
      const checkpoint=world.checkpoint(),initialEnergy=world.flies.find(f=>f.id===c.agentId).energy;
      const natural=World.restore(checkpoint),target=natural.flies.find(f=>f.id===c.agentId);natural.step();assert.deepEqual(target.lastInputs,c.query);
      const branches={};
      for(const[choice,id]of [[-1,'slow'],[1,'fast']]){
        const option=c.options.find(o=>o.id===id),fork=World.restore(checkpoint),f=fork.flies.find(f=>f.id===c.agentId);f.brain.episodic.memory.rngState=forced[choice];
        const steps=[];
        for(let j=0;j<protocol.horizon;j++){
          assert.ok(fork.flies.includes(f),'Diagnosis requires complete living-agent fork');const energyBefore=f.energy;fork.step();assert.ok(fork.flies.includes(f));
          if(j===0){assert.equal(f.brain.episodic.lastDecision.choice,choice);f.brain.episodic.memory.rngState=target.brain.episodic.memory.rngState;assert.deepEqual(f.lastInputs,c.query);assert.deepEqual(f.lastActions,option.action);}
          const energyDelta=f.energy-energyBefore,intake=energyDelta+f.lastEnergyCost;close(f.reward,clip(energyDelta));close(f.lastFood,Math.min(1,intake));
          close(f.lastActions[1],option.action[1]);
          steps.push({tick:fork.tick,observation:[...f.lastInputs],action:[...f.lastActions],reward:f.reward,energyBefore,energyAfter:f.energy,energyDelta,cost:f.lastEnergyCost,intake});
        }
        const ending=fork.checkpoint(),endpoint=f.energy-initialEnergy;close(endpoint,c.effects[id].energyChange);
        // Peek only to obtain s_(last+1), keeping the recorded ending unchanged.
        const peek=World.restore(ending),next=peek.flies.find(f=>f.id===c.agentId);peek.step();
        const returns={heldActions:0,actualActionSchedule:0,teacherForced:0,actualReward:0,energy:endpoint};
        let held=[...c.query],scheduled=[...c.query],power=1;
        for(let j=0;j<steps.length;j++){
          const step=steps[j],truthNext=j+1<steps.length?steps[j+1].observation:[...next.lastInputs];
          const heldPrediction=predictTransition(model,held,option.action),scheduledPrediction=predictTransition(model,scheduled,step.action),teacherPrediction=predictTransition(model,step.observation,step.action);
          step.diagnostic={heldObservation:held,scheduledObservation:scheduled,heldPrediction,scheduledPrediction,teacherPrediction,nextObservation:truthNext,power};
          returns.heldActions+=power*heldPrediction.reward;returns.actualActionSchedule+=power*scheduledPrediction.reward;returns.teacherForced+=power*teacherPrediction.reward;returns.actualReward+=power*step.reward;
          held=heldPrediction.nextObservation;scheduled=scheduledPrediction.nextObservation;power*=protocol.discount;
        }
        close(returns.heldActions,c.plan.options.find(o=>o.id===id).predictedReturn);
        close(steps.reduce((sum,s)=>sum+s.energyDelta,0),endpoint);
        branches[id]={returns,steps,endingSha256:hash(JSON.stringify(ending))};
        if(target.brain.episodic.lastDecision.choice===choice){
          assert.equal(branches[id].endingSha256,c.factualForkSha256);
          const normalized=structuredClone(ending),d=normalized.world.flies.find(f=>f.id===c.agentId).brain.episodic.lastDecision;
          if(c.reasonNormalization)d.reason=c.reasonNormalization.to;
          assert.equal(hash(JSON.stringify(normalized)),c.normalizedFactualForkSha256);
        }
      }
      const differences=Object.fromEntries(protocol.stages.map(stage=>[stage,branches.fast.returns[stage]-branches.slow.returns[stage]]));
      close(differences.energy,c.actualDifference);close(differences.heldActions,c.predictedDifference);
      const gaps={heldMotorAssumption:differences.heldActions-differences.actualActionSchedule,freeDynamics:differences.actualActionSchedule-differences.teacherForced,rewardHead:differences.teacherForced-differences.actualReward,objective:differences.actualReward-differences.energy};
      close(Object.values(gaps).reduce((sum,v)=>sum+v,0),differences.heldActions-differences.energy);
      assert.equal(hash(JSON.stringify(model)),modelHash);
      cases.push({tick:c.tick,agentId:c.agentId,modelSha256:modelHash,branches,differences,gaps,incumbentDifference:c.incumbentDifference,usedForTraining:false,usedForControl:false});
    }
  }
  assert.equal(hash(JSON.stringify(world.checkpoint())),recorded.worldSha256);
  for(const[id,s]of states)assert.equal(hash(JSON.stringify(s.model)),recorded.acquisition[id].factored.sha256);
  assert.equal(cases.length,recorded.plans.length);
  rows.push({seed:recorded.seed,environment:recorded.environment,exactWorld:true,exactModelHashes:true,cases});
  await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows})+'\n');console.log(JSON.stringify({directory,completed:rows.length,total:original.rows.length}));
}
const mean=values=>values.reduce((sum,x)=>sum+x,0)/values.length;
const summaries=Object.fromEntries(Object.keys(p.environments).map(environment=>{
  const selected=rows.filter(r=>r.environment===environment),all=selected.flatMap(r=>r.cases);
  const stages=Object.fromEntries(protocol.stages.map(stage=>[stage,{
    gain:interval95(selected.map(r=>mean(r.cases.map(c=>sign(c.differences[stage])*c.differences.energy*.5)))),
    gainMinusIncumbent:interval95(selected.map(r=>mean(r.cases.map(c=>(sign(c.differences[stage])-sign(c.incumbentDifference))*c.differences.energy*.5)))),
    absoluteEffectError:interval95(selected.map(r=>mean(r.cases.map(c=>Math.abs(c.differences[stage]-c.differences.energy))))),
    nonzeroEffectRankingAgreement:mean(all.filter(c=>sign(c.differences.energy)!==0).map(c=>sign(c.differences[stage])===sign(c.differences.energy)?1:sign(c.differences[stage])===0?.5:0))
  }]));
  const gaps=Object.fromEntries(Object.keys(all[0].gaps).map(key=>[key,{signed:interval95(selected.map(r=>mean(r.cases.map(c=>c.gaps[key])))),absolute:interval95(selected.map(r=>mean(r.cases.map(c=>Math.abs(c.gaps[key])))))}]));
  const byHorizon=Array.from({length:protocol.horizon},(_,j)=>({step:j+1,...Object.fromEntries(['heldObservation','scheduledObservation'].map(key=>[key+'MSE',mean(all.flatMap(c=>Object.values(c.branches).map(b=>mean(b.steps[j].observation.map((v,k)=>(v-b.steps[j].diagnostic[key][k])**2)))))])),teacherRewardMSE:mean(all.flatMap(c=>Object.values(c.branches).map(b=>(b.steps[j].reward-b.steps[j].diagnostic.teacherPrediction.reward)**2)))}));
  return[environment,{cases:all.length,stages,gaps,byHorizon}];
}));
const result={protocol,rows,summaries,ecologicalQualification:false,integrationSupported:false,completedAt:new Date().toISOString()};
await writeFile(join(directory,'results.json'),JSON.stringify(result)+'\n');await writeFile(join(directory,'runner.json'),JSON.stringify({pid:process.pid,status:'complete'})+'\n');console.log(JSON.stringify({directory,summaries},null,2));
