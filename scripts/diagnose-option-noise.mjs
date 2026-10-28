import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';

// Fixed reuse diagnostic, never a resampled qualification of the failed model.
const referenceDirectory=resolve(process.argv[2]||'evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf'),directory=resolve(process.argv[3]||`evidence/option-noise/${randomUUID()}`);
const hash=x=>createHash('sha256').update(x).digest('hex'),bytes=await readFile(join(referenceDirectory,'results.json')),original=JSON.parse(bytes),p=original.protocol,ref=JSON.parse(await readFile(join(referenceDirectory,'reference-protocol.json')));
for(const[file,sha]of Object.entries(p.worldSourceSha256))assert.equal(hash(await readFile(join(p.worldSources,file))),sha);
const {World}=await import(pathToFileURL(join(p.worldSources,'engine.mjs')).href);
const source=await readFile(new URL(import.meta.url));await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const protocol={at:new Date().toISOString(),experiment:'fixed-option-future-motor-noise-diagnosis',referenceDirectory,referenceSha256:hash(bytes),sourceSha256:hash(source),worldSources:p.worldSources,worldSourceSha256:p.worldSourceSha256,seeds:p.seeds,environments:p.environments,futureStreams:8,horizon:p.modelConfig.horizon,interpretation:'Reused failed action cases only. Preserve every initial target input, complete first motor vector and acquired brain. After the first physical step, replace only the target actor exploration RNG with eight predeclared hash-derived streams, shared between slow and fast branches. The physics RNG, other agents and episodic stream are not reseeded. Stream zero separately reproduces the original factual pair. No future outcomes train any model. This measures conditional variability from target future motor sampling, not all environmental stochasticity or a new candidate qualification. No gate is recomputed or changed.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');await writeFile(join(directory,'diagnose-source.mjs'),source);await writeFile(join(directory,'runner.json'),JSON.stringify({pid:process.pid,status:'running'})+'\n');console.log(JSON.stringify({directory,phase:'start'}));
const advance=s=>{let x=s;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;},forced={};for(let s=1;s<1_000_000&&Object.keys(forced).length<2;s++){const a=advance(s),b=advance(a);if(a/4294967296<ref.parameters.exploration)forced[b/4294967296<.5?-1:1]??=s;}
const sign=x=>Math.abs(x)<1e-9?0:Math.sign(x),mean=a=>a.reduce((s,x)=>s+x,0)/a.length,variance=a=>a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`Mismatch ${a} / ${b}`);
function interval(a){const n=a.length,m=mean(a),t=n>=30?2.045:n>=20?2.093:n>=10?2.262:3.182,half=t*Math.sqrt(variance(a)/n);return{mean:m,ci95:[m-half,m+half],n};}
const rows=[];
for(const recorded of original.rows){
  const world=new World({seed:recorded.seed,founders:ref.founders,capacity:240,reproduction:false,mutation:false,...p.environments[recorded.environment],controller:'episodic-actor',learning:true,actorParameters:{...ref.actorParameters},episodicParameters:{...ref.parameters,memoryLearning:true,neuralLearning:true}}),cases=[];
  for(let tick=0;tick<p.horizonTicks;tick++){
    if(!world.step())break;
    for(const c of recorded.plans.filter(c=>c.tick===world.tick)){
      const checkpoint=world.checkpoint(),initialEnergy=world.flies.find(f=>f.id===c.agentId).energy,natural=World.restore(checkpoint),target=natural.flies.find(f=>f.id===c.agentId);natural.step();assert.deepEqual(target.lastInputs,c.query);
      const streams=Array.from({length:protocol.futureStreams},(_,index)=>parseInt(hash(`option-noise:${recorded.seed}:${recorded.environment}:${c.tick}:${c.agentId}:${index}`).slice(0,8),16)||1),pairs=[];
      assert.equal(new Set(streams).size,streams.length);
      for(const actorSeed of [null,...streams]){
        const effects={};
        for(const choice of [-1,1]){
          const fork=World.restore(checkpoint),fly=fork.flies.find(f=>f.id===c.agentId);fly.brain.episodic.memory.rngState=forced[choice];fork.step();assert.equal(fly.brain.episodic.lastDecision.choice,choice);assert.deepEqual(fly.lastInputs,c.query);
          assert.deepEqual(fly.lastActions,target.lastActions.map((value,index)=>index===1?2*(choice<0?ref.parameters.slowSpeed:ref.parameters.fastSpeed)-1:value));
          fly.brain.episodic.memory.rngState=target.brain.episodic.memory.rngState;const originalActorState=fly.brain.actor.rngState;if(actorSeed!==null)fly.brain.actor.rngState=actorSeed;
          const firstActions=[...fly.lastActions],futureActions=[];for(let j=1;j<protocol.horizon;j++){fork.step();futureActions.push([...fly.lastActions]);}
          const id=choice<0?'slow':'fast',effect={energyChange:(fork.flies.find(f=>f.id===c.agentId)?.energy||0)-initialEnergy,alive:fork.flies.includes(fly),originalActorState,firstActions,futureActions,endingSha256:hash(JSON.stringify(fork.checkpoint()))};
          if(actorSeed===null){near(effect.energyChange,c.effects[id].energyChange);assert.equal(effect.alive,c.effects[id].alive);if(choice===target.brain.episodic.lastDecision.choice)assert.equal(effect.endingSha256,c.rawFactualSha256);}
          effects[id]=effect;
        }
        pairs.push({actorSeed,effects,difference:effects.fast.energyChange-effects.slow.energyChange});
      }
      const repeated=pairs.slice(1).map(pair=>pair.difference),expectedDifference=mean(repeated),factualDifference=pairs[0].difference;near(factualDifference,c.actualDifference);
      cases.push({tick:c.tick,agentId:c.agentId,query:c.query,streams,pairs,factualDifference,expectedDifference,withinVariance:variance(repeated),range:[Math.min(...repeated),Math.max(...repeated)],factualSignAgreement:sign(factualDifference)===sign(expectedDifference),reversalRate:mean(repeated.map(value=>sign(value)!==sign(factualDifference)?1:0)),policyDifference:c.policyDifference,incumbentDifference:c.incumbentDifference,modelGainOnFactual:c.gain,modelGainOnMean:sign(c.policyDifference)*expectedDifference/2,incumbentGainOnMean:sign(c.incumbentDifference)*expectedDifference/2,oracleMeanGain:Math.abs(expectedDifference)/2,clairvoyantNoiseGain:mean(repeated.map(Math.abs))/2,usedForTraining:false,usedForControl:false});
    }
  }
  assert.equal(hash(JSON.stringify(world.checkpoint())),recorded.worldSha256);rows.push({seed:recorded.seed,environment:recorded.environment,exactBaseline:true,cases});await writeFile(join(directory,'progress.json'),JSON.stringify({protocol,rows})+'\n');console.log(JSON.stringify({directory,completed:rows.length,total:original.rows.length}));
}
const summaries=Object.fromEntries(Object.keys(p.environments).map(env=>{const selected=rows.filter(row=>row.environment===env),all=selected.flatMap(row=>row.cases),within=mean(all.map(c=>c.withinVariance)),betweenObserved=variance(all.map(c=>c.expectedDifference));return[env,{cases:all.length,meanWithinVariance:within,meanWithinSD:mean(all.map(c=>Math.sqrt(c.withinVariance))),observedBetweenMeanVariance:betweenObserved,estimatedBetweenCaseVariance:Math.max(0,betweenObserved-within/protocol.futureStreams),factualSignAgreement:mean(all.map(c=>+c.factualSignAgreement)),meanReversalRate:mean(all.map(c=>c.reversalRate)),fractionRangesSpanZero:mean(all.map(c=>c.range[0]<0&&c.range[1]>0?1:0)),...Object.fromEntries(['modelGainOnFactual','modelGainOnMean','incumbentGainOnMean','oracleMeanGain','clairvoyantNoiseGain'].map(key=>[key,interval(selected.map(row=>mean(row.cases.map(c=>c[key]))))]))}];}));
const result={protocol,rows,summaries,originalActionGatePassed:original.actionPassed,qualificationRecomputed:false,integrationSupported:false,ecologicalQualification:false,completedAt:new Date().toISOString()};await writeFile(join(directory,'results.json'),JSON.stringify(result)+'\n');await writeFile(join(directory,'runner.json'),JSON.stringify({pid:process.pid,status:'complete'})+'\n');console.log(JSON.stringify({directory,summaries},null,2));
