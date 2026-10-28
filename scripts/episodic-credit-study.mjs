import {World} from '../engine.mjs';
import {evaluateContext} from '../learning/context-tasks.mjs';
import {episodicBodyParameters} from '../learning/episodic-actor.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';

// Development selects one policy. The independent confirmation is never used
// to select again, and resuming must use the exact saved source and protocol.
const referencePath=process.argv[2];
if(!referencePath)throw Error('Usage: node scripts/episodic-credit-study.mjs <feature-study/results.json> [resume-directory] [candidate-file]');
const reference=JSON.parse(await readFile(referencePath,'utf8'));
if(!reference.selected?.parameters||!reference.protocol?.heldoutSeeds)throw Error('Expected a completed episodic feature study');
const directory=resolve(process.argv[3]||`evidence/episodic-credit/${randomUUID()}`);
await mkdir(directory,{recursive:true});
const read=async name=>{try{return JSON.parse(await readFile(join(directory,name),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const save=async(name,value)=>{const path=join(directory,name);await writeFile(path+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(path+'.tmp',path);};
const candidatePath=process.argv[4];
const candidateDefinitions=candidatePath?JSON.parse(await readFile(candidatePath,'utf8')):null;
if(candidatePath&&(!Array.isArray(candidateDefinitions)||candidateDefinitions.length<1||candidateDefinitions.length>12||candidateDefinitions.some(row=>!row||!/^[a-z0-9-]+$/.test(row.id)||row.id==='neural'||row.id.endsWith('-frozen')||row.id.endsWith('-noMemory'))||new Set(candidateDefinitions.map(row=>row.id)).size!==candidateDefinitions.length))throw Error('Invalid candidate list');
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/context-tasks.mjs','learning/tasks.mjs','scripts/episodic-credit-study.mjs',...(candidatePath?[candidatePath]:[])];
const sourceSha256={};for(const file of sourceFiles)sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
let protocol=await read('protocol.json');
if(protocol){
 if(JSON.stringify(protocol.sourceSha256)!==JSON.stringify(sourceSha256)||protocol.referenceSha256!==createHash('sha256').update(await readFile(referencePath)).digest('hex'))throw Error('Study sources or reference changed; refusing to mix runs');
}else{
 const excluded=new Set();
 for(const root of ['evidence/episodic-body','evidence/episodic-credit']){
  try{for(const entry of await readdir(root,{withFileTypes:true}))if(entry.isDirectory()){
   try{const prior=JSON.parse(await readFile(join(root,entry.name,'protocol.json'),'utf8'));for(const key of ['seeds','developmentSeeds','heldoutSeeds'])for(const seed of prior[key]||[])excluded.add(seed);}catch(error){if(error.code!=='ENOENT')throw error;}
  }}catch(error){if(error.code!=='ENOENT')throw error;}
 }
 const offset=parseInt(randomUUID().slice(0,8),16)>>>0,seeds=[];
 for(let i=0;seeds.length<40;i++){const seed=((offset+7919*i)>>>0)||1;if(!excluded.has(seed)&&!seeds.includes(seed))seeds.push(seed);}
 const base=episodicBodyParameters(reference.selected.parameters);
 const candidates=(candidateDefinitions||[{id:'previous',decisionTicks:4,creditTicks:16,turnGain:.25},{id:'aligned-4',decisionTicks:4,creditTicks:4,turnGain:.25},{id:'aligned-4-small',decisionTicks:4,creditTicks:4,turnGain:.1},{id:'aligned-8',decisionTicks:8,creditTicks:8,turnGain:.25},{id:'aligned-16',decisionTicks:16,creditTicks:16,turnGain:.25},{id:'aligned-16-small',decisionTicks:16,creditTicks:16,turnGain:.1}]).map(({id,...settings})=>({id,parameters:episodicBodyParameters({...base,...settings})}));
 protocol={schema:1,createdAt:new Date().toISOString(),referencePath:resolve(referencePath),referenceSha256:createHash('sha256').update(await readFile(referencePath)).digest('hex'),sourceSha256,developmentSeeds:seeds.slice(0,10),heldoutSeeds:seeds.slice(10),candidates,actorParameters:reference.protocol.actorParameters,environment:reference.protocol.environment,horizonTicks:1800,founders:24,selection:'Prefer candidates with nonnegative mean ending-population differences versus both matched learning-off and neural controls. Rank those by the smaller of the two mean energy differences. If none meet population guards, lock the best energy candidate for an explicitly failed-development exploratory confirmation. No reselection after held-out data.',gates:{energyDifferenceLowerBound:0,populationDifferenceMeanMinimum:0,memoryAccuracyLowerBound:.8,retentionChangeLowerBound:-.05},controls:['matched learning-disabled from birth','previous episodic policy','existing learning neural controller','zero-correction with active memory','same-capacity FIFO'],interpretation:'A bounded human-designed temporal-credit experiment, not self-modification or RSI. Rewards are observed food minus actual cost; no correct-action labels enter the habitat controller. Parameter selection retrains fresh agents; this is distinct from continual retention in one body. Context memory is evaluated separately. Fresh seed confirmation follows one locked selection. Reproduction and mutation are disabled to isolate acquired behavior. Failed confirmations remain final for this campaign.'};
 for(const file of sourceFiles){const path=join(directory,'sources',file);await mkdir(dirname(path),{recursive:true});await writeFile(path,await readFile(file));}
 protocol.experiment=candidates.every(candidate=>candidate.parameters.moveMode==='levels')?'speed-levels':candidates.every(candidate=>candidate.parameters.returnMode==='td')?'future-value':candidates.every(candidate=>candidate.parameters.actuator==='move')?'movement-speed':candidatePath?'local-sensory-retrieval':'temporal-credit';
 if(candidatePath){protocol.candidatePath=candidatePath;protocol.hypothesis='Same-seed diagnosis of the failed temporal-credit study found large mate/clock contributions to retrieved feature distances. Compare full mixed sensory retrieval with local retrieval that excludes mates, clocks, age, energy and bias. Neural inputs are unchanged. This is a human-designed representation ablation, not autonomous feature discovery.';}
 protocol.requiredControls=protocol.experiment==='speed-levels'?['frozen','neural','noMemory','fullRange']:protocol.experiment==='future-value'?['frozen','neural','noMemory','observedWindow']:protocol.experiment==='movement-speed'?['frozen','neural','noMemory']:['frozen','neural'];
 if(protocol.experiment==='movement-speed'){
  protocol.hypothesis='Previous turn-correction policies failed. Test whether controlling movement speed around fixed inherited steering offers a more useful learning interface. Preserve the motor sample RNG and disable neural plasticity for steering and movement. Compare memory on/off separately from the global learning-off control. Candidates include hybrid and memory-only acquisition; this is human-written experimental design, not agent-generated self-modification.';
  protocol.selection='Prefer candidates with nonnegative mean ending-population differences versus matched global learning-off, existing neural, and matched memory-disabled controls. Rank those by the smallest mean energy difference against these controls. If none meet population guards, lock the best energy candidate for explicitly exploratory confirmation. No reselection on held-out data.';
  protocol.controls.push('memory disabled while preserving the candidate neural-learning setting');
 }
 if(protocol.experiment==='future-value'){
  protocol.hypothesis='The prior movement-memory policy failed cost-inclusive acquisition controls, and same-seed fork diagnosis found frequent short/long horizon ranking changes. Compare observed-window targets with an optional normalized bootstrapped value target. This is a human-written algorithm experiment, not autonomous self-modification.';
  protocol.valueTarget='(1 - discount) * sum(discount^i * observedReward_i) + discount^N * max(next-state recalled action values). At death, the estimated future contribution is zero. Action and credit windows are aligned. Both value and action retrievals incur the declared energy cost.';
  protocol.selection='Prefer candidates with nonnegative mean ending-population differences versus globally frozen, existing neural, memory-disabled, and matched observed-window controls. Rank those by the smallest mean energy difference across all required controls. If none meet the population guards, lock the best energy candidate for explicitly exploratory confirmation. No reselection on held-out data.';
  protocol.controls.push('memory disabled while preserving the candidate neural-learning setting','matched movement policy using observed-window targets');
 }
 if(protocol.experiment==='speed-levels'){
  protocol.hypothesis='Exact cost replays of the failed value policy attributed most additional spending to movement. Test bounded nonzero cruising-speed choices with unchanged energy prices and inherited bodies. Every acquisition control receives the same choices. A full-range comparator keeps the selected learning rule but restores the previous stop/full-speed interface. This is a human-designed control-interface experiment, not RSI.';
  protocol.selection='Prefer candidates with nonnegative mean ending-population differences against globally frozen, existing neural, memory-disabled, and matched full-range controls. Rank by the smallest mean energy difference across these controls. If no population-eligible candidate exists, lock the best score for explicitly exploratory confirmation. No reselection on held-out data.';
  protocol.controls.push('memory disabled with the same cruising speeds','matched learning rule using the previous stop/full-speed interface');
 }
 await save('protocol.json',protocol);
}
const existing=await read('results.json');if(existing){console.log(JSON.stringify({directory,alreadyCompleted:true,passed:existing.passed}));process.exit(0);}
const started=performance.now();
function run(seed,controller,learning,parameters){
 const world=new World({seed,founders:protocol.founders,capacity:240,controller,learning,actorParameters:protocol.actorParameters,reproduction:false,mutation:false,...protocol.environment,...(controller==='episodic-actor'?{episodicParameters:parameters}:{})});
 const hash=createHash('sha256').update(JSON.stringify(world.flies.map(({brain,...fly})=>fly))).digest('hex'),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),start=performance.now(),founders=[...world.flies];
 world.advance(protocol.horizonTicks);const metrics=world.metrics();
 if(Math.abs(metrics.accountingError)>1e-6)throw Error('Energy accounting failed');
 const retrieval=founders.map(fly=>fly.brain.episodic?.lastDecision).filter(Boolean);
 return{seed,founderHash:hash,ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/protocol.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated,accountingResidual:metrics.accountingError,stored:founders.reduce((sum,fly)=>sum+(fly.brain.episodic?.memory.records.length||0),0),seen:founders.reduce((sum,fly)=>sum+(fly.brain.episodic?.memory.seen||0),0),finalRetrievalReasons:Object.fromEntries(['retrieval','exploration','tie'].map(reason=>[reason,retrieval.filter(decision=>decision.reason===reason).length])),wallSeconds:(performance.now()-start)/1000};
}
function paired(seed,profiles){let hash;return Object.fromEntries(Object.entries(profiles).map(([name,p])=>{const result=run(seed,p.controller,p.learning,p.parameters);if(hash&&hash!==result.founderHash)throw Error('Founder mismatch');hash=result.founderHash;return[name,result];}));}
function compare(rows,candidate,control){return Object.fromEntries(['energy','population'].map(key=>[key,interval95(rows.map(row=>row.arms[candidate][key]-row.arms[control][key]))]));}
const body=(parameters,learning=true)=>({controller:'episodic-actor',learning,parameters}),neural={controller:'trace-actor',learning:true};
let development=await read('development.json')||[];
for(const seed of protocol.developmentSeeds){
 if(development.some(row=>row.seed===seed))continue;
 const profiles={neural};for(const candidate of protocol.candidates){profiles[candidate.id]=body(candidate.parameters);profiles[candidate.id+'-frozen']=body(candidate.parameters,false);if(protocol.requiredControls.includes('noMemory'))profiles[candidate.id+'-noMemory']=body({...candidate.parameters,memoryLearning:false});if(protocol.requiredControls.includes('observedWindow'))profiles[candidate.id+'-observedWindow']=body({...candidate.parameters,returnMode:'mean'});if(protocol.requiredControls.includes('fullRange'))profiles[candidate.id+'-fullRange']=body({...candidate.parameters,moveMode:'residual',moveGain:2});}
 development.push({seed,arms:paired(seed,profiles)});await save('development.json',development);console.log(JSON.stringify({phase:'development',completed:development.length,total:protocol.developmentSeeds.length,directory}));
}
let locked=await read('locked-selection.json');
if(!locked){
 const rankings=protocol.candidates.map(candidate=>{const frozen=compare(development,candidate.id,candidate.id+'-frozen'),old=compare(development,candidate.id,'neural'),comparisons={frozen,neural:old,...(protocol.requiredControls.includes('noMemory')?{noMemory:compare(development,candidate.id,candidate.id+'-noMemory')}:{}) ,...(protocol.requiredControls.includes('observedWindow')?{observedWindow:compare(development,candidate.id,candidate.id+'-observedWindow')}:{}) ,...(protocol.requiredControls.includes('fullRange')?{fullRange:compare(development,candidate.id,candidate.id+'-fullRange')}:{})};return{...candidate,comparisons,eligible:Object.values(comparisons).every(row=>row.population.mean>=0),score:Math.min(...Object.values(comparisons).map(row=>row.energy.mean))};});
 rankings.sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score);
 locked={...rankings[0],lockedAt:new Date().toISOString(),rankings};await save('locked-selection.json',locked);console.log(JSON.stringify({phase:'locked',id:locked.id,eligible:locked.eligible,score:locked.score}));
}
const profiles={learned:body(locked.parameters),frozen:body(locked.parameters,false),previous:body(reference.selected.parameters),neural,noCorrection:body({...locked.parameters,...(locked.parameters.actuator==='move'?{moveMode:'residual',moveGain:0}:{turnGain:0})}),fifo:body({...locked.parameters,replacement:'fifo'}),...(protocol.requiredControls.includes('noMemory')?{noMemory:body({...locked.parameters,memoryLearning:false})}:{}),...(protocol.requiredControls.includes('observedWindow')?{observedWindow:body({...locked.parameters,returnMode:'mean'})}:{}),...(protocol.requiredControls.includes('fullRange')?{fullRange:body({...locked.parameters,moveMode:'residual',moveGain:2})}:{})};
let rows=await read('heldout.json')||[];
for(const seed of protocol.heldoutSeeds){
 if(rows.some(row=>row.seed===seed))continue;
 rows.push({seed,arms:paired(seed,profiles)});await save('heldout.json',rows);console.log(JSON.stringify({phase:'heldout',completed:rows.length,total:protocol.heldoutSeeds.length,directory}));
}
// The temporal-credit parameters do not enter the discrete context task. Still
// evaluate on the untouched seeds, rather than importing a previous success.
let memory=await read('memory.json');
if(!memory){memory=evaluateContext(protocol.heldoutSeeds,protocol.actorParameters,undefined,{capacity:locked.parameters.capacity,neighbors:locked.parameters.neighbors,bandwidth:locked.parameters.bandwidth,maxDistance:locked.parameters.maxDistance,exploration:locked.parameters.exploration,replacement:locked.parameters.replacement,featureMode:locked.parameters.featureMode});await save('memory.json',memory);}
const comparisons=Object.fromEntries(Object.keys(profiles).filter(name=>name!=='learned').map(name=>[name,compare(rows,'learned',name)])),s=memory.summary,g=protocol.gates;
const memoryPassed=s.aAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionChangeLowerBound;
const habitatPassed=(protocol.requiredControls||['frozen','neural']).every(name=>comparisons[name].energy.ci95[0]>g.energyDifferenceLowerBound&&comparisons[name].population.mean>=g.populationDifferenceMeanMinimum);
for(const file of sourceFiles)if(createHash('sha256').update(await readFile(file)).digest('hex')!==protocol.sourceSha256[file])throw Error('Study source changed while evaluating; refusing a mixed-source result');
const report={protocol,locked,comparisons,memoryPassed,habitatPassed,passed:memoryPassed&&habitatPassed,completedAt:new Date().toISOString(),wallSecondsThisInvocation:(performance.now()-started)/1000};
await save('results.json',report);console.log(JSON.stringify({directory,...report},null,2));
