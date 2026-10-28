import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const directory=resolve(process.argv[2]||''),load=async path=>JSON.parse(await readFile(path,'utf8'));
const r=await load(join(directory,'results.json')),p=await load(join(directory,'protocol.json'));
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.deepEqual(r.protocol,p);assert.equal(p.experiment,'failed-factored-plan-error-decomposition');
assert.equal(hash(await readFile(join(directory,'diagnose-source.mjs'))),p.sourceSha256);
const bytes=await readFile(join(p.referenceDirectory,'results.json'));assert.equal(hash(bytes),p.referenceSha256);
const original=JSON.parse(bytes),op=original.protocol,ref=await load(join(p.referenceDirectory,'reference-protocol.json'));
for(const[file,sha]of Object.entries(op.sourceSha256))assert.equal(hash(await readFile(join(p.referenceDirectory,'sources',file))),sha);
for(const[file,sha]of Object.entries(op.worldSourceSha256))assert.equal(hash(await readFile(join(op.worldSources,file))),sha);
assert.equal(r.rows.length,original.rows.length);assert.deepEqual(p.seeds,op.seeds);assert.deepEqual(p.environments,op.environments);assert.equal(p.discount,.99);assert.equal(p.horizon,op.planningHorizon);
assert.deepEqual(p.stages,['heldActions','actualActionSchedule','teacherForced','actualReward','energy']);assert.equal(r.ecologicalQualification,false);assert.equal(r.integrationSupported,false);
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-10,`Numeric mismatch ${a} / ${b}`);
const vectorNear=(a,b)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i]));};
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length,sign=x=>Math.abs(x)<1e-9?0:Math.sign(x),clip=(x,a,b)=>Math.max(a,Math.min(b,x));
function interval(values){const n=values.length,m=mean(values),t=n>=30?2.045:n>=20?2.093:n>=10?2.262:3.182,half=t*Math.sqrt(values.reduce((s,x)=>s+(x-m)**2,0)/(n-1))/Math.sqrt(n);return{mean:m,ci95:[m-half,m+half],n};}
const checkInterval=(stored,values)=>{const computed=interval(values);near(stored.mean,computed.mean);vectorNear(stored.ci95,computed.ci95);assert.equal(stored.n,computed.n);};
// Independent implementation: no imports of predictor, diagnostic or statistics.
const fresh=()=>({schema:1,kind:'factored-transition',config:{learningRate:op.learningRate,actionConditioned:true,rewardActionConditioned:false},seen:0,weights:Array.from({length:18},()=>Array(57).fill(0))});
const encode=(o,a)=>[1,...o,...a,...o.map(v=>v*a[1]),...o.map(v=>v*a[0])];
function predict(m,o,a){const x=encode(o,a),z=encode(o,Array(5).fill(0)),raw=m.weights.map((weights,h)=>weights.reduce((s,w,i)=>s+w*(h===0?z:x)[i],0));return{reward:clip(raw[0],-1,1),nextObservation:o.map((v,i)=>clip(v+clip(raw[i+1],-2,2),-1,1))};}
function update(m,o,a,reward,next){const pred=predict(m,o,a),x=encode(o,a),z=encode(o,Array(5).fill(0)),n=Math.max(1,x.reduce((s,v)=>s+v*v,0)),rn=Math.max(1,z.reduce((s,v)=>s+v*v,0)),errors=[reward-pred.reward,...next.map((v,i)=>v-pred.nextObservation[i])];for(let h=0;h<18;h++)for(let i=0;i<57;i++)m.weights[h][i]=clip(m.weights[h][i]+op.learningRate*errors[h]*(h===0?z:x)[i]/(h===0?rn:n),-4,4);m.seen++;}
const {World}=await import(pathToFileURL(join(op.worldSources,'engine.mjs')).href);
const advance=s=>{let x=s;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;},forced={};
for(let s=1;s<1_000_000&&Object.keys(forced).length<2;s++){const a=advance(s),b=advance(a);if(a/4294967296<ref.parameters.exploration)forced[b/4294967296<.5?-1:1]??=s;}
const replay=[];let cases=0,steps=0;
for(const row of r.rows){
  const recorded=original.rows.find(o=>o.seed===row.seed&&o.environment===row.environment);assert.ok(recorded);assert.equal(row.cases.length,recorded.plans.length);assert.ok(row.exactWorld&&row.exactModelHashes);
  const world=new World({seed:row.seed,founders:ref.founders,capacity:240,reproduction:false,mutation:false,...op.environments[row.environment],controller:'episodic-actor',learning:true,actorParameters:{...ref.actorParameters},episodicParameters:{...ref.parameters,memoryLearning:true,neuralLearning:true}});
  const states=new Map([...new Set(row.cases.map(c=>c.agentId))].map(id=>[id,{model:fresh(),pending:null}]));
  for(let tick=0;tick<op.horizonTicks;tick++){
    const before=[...world.flies];if(!world.step())break;
    for(const f of before){const s=states.get(f.id);if(!s)continue;if(s.pending)update(s.model,s.pending.o,s.pending.a,s.pending.reward,f.lastInputs);s.pending=world.flies.includes(f)?{o:[...f.lastInputs],a:[...f.lastActions],reward:f.reward}:null;}
    for(const c of row.cases.filter(c=>c.tick===world.tick)){
      cases++;assert.equal(c.usedForTraining,false);assert.equal(c.usedForControl,false);
      const orig=recorded.plans.find(o=>o.tick===c.tick&&o.agentId===c.agentId);assert.ok(orig);
      const model=states.get(c.agentId).model;assert.equal(hash(JSON.stringify(model)),c.modelSha256);assert.equal(c.modelSha256,orig.modelSha256);
      const checkpoint=world.checkpoint(),natural=World.restore(checkpoint),target=natural.flies.find(f=>f.id===c.agentId);natural.step();const actualReturns={};
      for(const[choice,id]of [[-1,'slow'],[1,'fast']]){
        const b=c.branches[id],option=orig.options.find(o=>o.id===id),fork=World.restore(checkpoint),f=fork.flies.find(f=>f.id===c.agentId),initialEnergy=f.energy;f.brain.episodic.memory.rngState=forced[choice];assert.equal(b.steps.length,p.horizon);
        for(let j=0;j<p.horizon;j++){
          const energyBefore=f.energy;assert.ok(fork.flies.includes(f));fork.step();assert.ok(fork.flies.includes(f));if(j===0){assert.equal(f.brain.episodic.lastDecision.choice,choice);f.brain.episodic.memory.rngState=target.brain.episodic.memory.rngState;}
          const t=b.steps[j];steps++;assert.equal(t.tick,fork.tick);assert.deepEqual(t.observation,f.lastInputs);assert.deepEqual(t.action,f.lastActions);near(t.energyBefore,energyBefore);near(t.energyAfter,f.energy);near(t.energyDelta,f.energy-energyBefore);near(t.cost,f.lastEnergyCost);near(t.intake,t.energyDelta+t.cost);near(t.reward,f.reward);near(t.reward,clip(t.energyDelta,-1,1));near(f.lastFood,Math.min(1,t.intake));near(t.action[1],option.action[1]);
        }
        assert.equal(hash(JSON.stringify(fork.checkpoint())),b.endingSha256);near(f.energy-initialEnergy,orig.effects[id].energyChange);
        const peek=World.restore(fork.checkpoint()),peekTarget=peek.flies.find(f=>f.id===c.agentId);peek.step();
        let held=[...orig.query],scheduled=[...orig.query],power=1;const returns={heldActions:0,actualActionSchedule:0,teacherForced:0,actualReward:0,energy:f.energy-initialEnergy};
        for(let j=0;j<b.steps.length;j++){
          const t=b.steps[j],d=t.diagnostic,h=predict(model,held,option.action),s=predict(model,scheduled,t.action),tf=predict(model,t.observation,t.action),truthNext=j+1<b.steps.length?b.steps[j+1].observation:peekTarget.lastInputs;
          vectorNear(d.heldObservation,held);vectorNear(d.scheduledObservation,scheduled);assert.deepEqual(d.nextObservation,truthNext);near(d.power,power);
          for(const[key,pred]of [['heldPrediction',h],['scheduledPrediction',s],['teacherPrediction',tf]]){near(d[key].reward,pred.reward);vectorNear(d[key].nextObservation,pred.nextObservation);}
          returns.heldActions+=power*h.reward;returns.actualActionSchedule+=power*s.reward;returns.teacherForced+=power*tf.reward;returns.actualReward+=power*t.reward;held=h.nextObservation;scheduled=s.nextObservation;power*=p.discount;
        }
        for(const stage of p.stages)near(returns[stage],b.returns[stage]);near(returns.heldActions,orig.plan.options.find(o=>o.id===id).predictedReturn);near(returns.energy,b.steps.reduce((s,t)=>s+t.energyDelta,0));actualReturns[id]=returns;
      }
      for(const stage of p.stages)near(c.differences[stage],actualReturns.fast[stage]-actualReturns.slow[stage]);
      near(c.differences.energy,orig.actualDifference);near(c.differences.heldActions,orig.predictedDifference);near(c.incumbentDifference,orig.incumbentDifference);
      const expected={heldMotorAssumption:c.differences.heldActions-c.differences.actualActionSchedule,freeDynamics:c.differences.actualActionSchedule-c.differences.teacherForced,rewardHead:c.differences.teacherForced-c.differences.actualReward,objective:c.differences.actualReward-c.differences.energy};
      for(const[key,v]of Object.entries(expected))near(c.gaps[key],v);near(Object.values(c.gaps).reduce((s,x)=>s+x,0),c.differences.heldActions-c.differences.energy);
    }
  }
  assert.equal(hash(JSON.stringify(world.checkpoint())),recorded.worldSha256);for(const[id,s]of states)assert.equal(hash(JSON.stringify(s.model)),recorded.acquisition[id].factored.sha256);
  replay.push({seed:row.seed,environment:row.environment,exactWorld:true,independentAcquiredModels:true,cases:row.cases.length});console.log(JSON.stringify({directory,replayed:replay.length,total:r.rows.length}));
}
for(const[env,summary]of Object.entries(r.summaries)){
  const selected=r.rows.filter(row=>row.environment===env),all=selected.flatMap(row=>row.cases);assert.equal(summary.cases,all.length);
  for(const stage of p.stages){const s=summary.stages[stage];checkInterval(s.gain,selected.map(row=>mean(row.cases.map(c=>sign(c.differences[stage])*c.differences.energy/2))));checkInterval(s.gainMinusIncumbent,selected.map(row=>mean(row.cases.map(c=>(sign(c.differences[stage])-sign(c.incumbentDifference))*c.differences.energy/2))));checkInterval(s.absoluteEffectError,selected.map(row=>mean(row.cases.map(c=>Math.abs(c.differences[stage]-c.differences.energy)))));near(s.nonzeroEffectRankingAgreement,mean(all.filter(c=>sign(c.differences.energy)!==0).map(c=>sign(c.differences[stage])===sign(c.differences.energy)?1:sign(c.differences[stage])===0?.5:0)));}
  for(const[key,s]of Object.entries(summary.gaps)){checkInterval(s.signed,selected.map(row=>mean(row.cases.map(c=>c.gaps[key]))));checkInterval(s.absolute,selected.map(row=>mean(row.cases.map(c=>Math.abs(c.gaps[key])))));}
  summary.byHorizon.forEach((s,j)=>{assert.equal(s.step,j+1);for(const key of ['heldObservation','scheduledObservation'])near(s[key+'MSE'],mean(all.flatMap(c=>Object.values(c.branches).map(b=>mean(b.steps[j].observation.map((v,k)=>(v-b.steps[j].diagnostic[key][k])**2))))));near(s.teacherRewardMSE,mean(all.flatMap(c=>Object.values(c.branches).map(b=>(b.steps[j].reward-b.steps[j].diagnostic.teacherPrediction.reward)**2))));});
}
const source=await readFile(new URL(import.meta.url));await writeFile(join(directory,'audit-source.mjs'),source);
const audit={at:new Date().toISOString(),auditorSha256:hash(source),worlds:replay.length,cases,physicalSteps:steps,replay,checks:['source/reference hashes','all baseline worlds and acquired founder hashes','independent numeric learner and forecasts at every recorded case','all slow/fast physical step sequences and ending hashes','energy/reward accounting and additive decomposition','seed-level intervals and ranking/gain summaries'],limitations:['Diagnostic reuse of failed cases cannot qualify a candidate.','Teacher-forced states and future motor schedules are privileged inputs.','Decomposition gaps are correlated numerical differences, not isolated causal effects.'],integrationSupported:false,ecologicalQualification:false};
await writeFile(join(directory,'audit.json'),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2));
