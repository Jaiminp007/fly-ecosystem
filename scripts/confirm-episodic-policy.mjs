import {World} from '../engine.mjs';
import {evaluateContext} from '../learning/context-tasks.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referencePath=process.argv[2],count=Number(process.argv[4]||100),stage=process.argv[5]||'confirm';
if(!referencePath||!Number.isInteger(count)||count<30||count>500||!['confirm','relocation','severe-relocation'].includes(stage))throw Error('Provide a passing results.json, optional directory, count (30–500), and stage (confirm/relocation/severe-relocation)');
const referenceBytes=await readFile(referencePath),reference=JSON.parse(referenceBytes),parent=reference.protocol;
const allowedParent=stage==='confirm'?parent.experiment==='speed-levels':stage==='relocation'?parent.experiment==='independent-cruising-confirmation'&&parent.environment.ecology==='baseline'&&parent.environment.nutrient===.4:parent.experiment==='cruising-relocation-evaluation'&&parent.environment.ecology==='relocation'&&parent.environment.nutrient===.4;
if(!reference.passed||!reference.locked?.parameters||!allowedParent)throw Error('This stage requires a passing locked policy from its declared preceding stage');
const parentRows=JSON.parse(await readFile(join(dirname(referencePath),'heldout.json'),'utf8'));
for(const control of parent.requiredControls){
 const comparison=Object.fromEntries(['energy','population'].map(key=>[key,interval95(parentRows.map(row=>row.arms.learned[key]-row.arms[control][key]))]));
 if(!isDeepStrictEqual(comparison,reference.comparisons[control])||comparison.energy.ci95[0]<=parent.gates.energyDifferenceLowerBound||comparison.population.mean<parent.gates.populationDifferenceMeanMinimum)throw Error('Parent gate does not match its raw outcomes');
}
const directory=resolve(process.argv[3]||`evidence/episodic-confirmation/${randomUUID()}`);await mkdir(directory,{recursive:true});
const read=async name=>{try{return JSON.parse(await readFile(join(directory,name),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const save=async(name,value)=>{const path=join(directory,name);await writeFile(path+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(path+'.tmp',path);};
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/context-tasks.mjs','learning/tasks.mjs','scripts/confirm-episodic-policy.mjs'],sourceSha256={};
for(const file of sourceFiles){sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');if(file!=='scripts/confirm-episodic-policy.mjs'&&parent.sourceSha256[file]&&parent.sourceSha256[file]!==sourceSha256[file])throw Error('Locked algorithm source changed: '+file);}
const referenceSha256=createHash('sha256').update(referenceBytes).digest('hex');let protocol=await read('protocol.json');
if(protocol){if(protocol.stage!==stage||protocol.seedCount!==count||protocol.referenceSha256!==referenceSha256||!isDeepStrictEqual(protocol.sourceSha256,sourceSha256))throw Error('Confirmation protocol, reference or sources changed');}
else{
 const used=new Set([...(parent.developmentSeeds||[]),...(parent.heldoutSeeds||[])]);
 for(const root of ['evidence/episodic-body','evidence/episodic-credit','evidence/episodic-confirmation']){
  let entries;try{entries=await readdir(root,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')continue;throw error;}
  for(const entry of entries)if(entry.isDirectory()){
   let p;try{p=JSON.parse(await readFile(join(root,entry.name,'protocol.json'),'utf8'));}catch(error){if(error.code==='ENOENT')continue;throw error;}
   for(const key of ['seeds','developmentSeeds','heldoutSeeds'])for(const seed of p[key]||[])used.add(seed);
  }
 }
 const offset=parseInt(randomUUID().slice(0,8),16)>>>0,seeds=[];
 for(let i=0;seeds.length<count;i++){const seed=((offset+i*7919)>>>0)||1;if(!used.has(seed)&&!seeds.includes(seed))seeds.push(seed);}
 const environment=stage==='confirm'?parent.environment:{...parent.environment,ecology:'relocation',...(stage==='severe-relocation'?{nutrient:.2}:{})};
 protocol={schema:1,at:new Date().toISOString(),referencePath:resolve(referencePath),referenceSha256,sourceSha256,stage,experiment:stage==='confirm'?'independent-cruising-confirmation':stage==='relocation'?'cruising-relocation-evaluation':'cruising-severe-relocation-evaluation',seedCount:count,seeds,heldoutSeeds:seeds,parameters:reference.locked.parameters,actorParameters:parent.actorParameters,environment,founders:parent.founders,horizonTicks:parent.horizonTicks,gates:parent.gates,requiredControls:parent.requiredControls,interpretation:'Locked-policy evaluation after a passing preceding stage. The policy, energy prices and acceptance rules are frozen before fresh seeds are evaluated. Difficulty advances only along the declared chain: independent scarcity confirmation, relocation at the same nutrient, then lower-nutrient relocation. No development stage, reselection or parameter tuning occurs. Matched global learning-off, memory-disabled, full-range and neural controls retain their meanings. The observed-window comparator is secondary. The separate discrete cue check is not whole-body continual retention. Passing establishes only the declared ecological milestone, not RSI or biological cognition.'};
 for(const file of sourceFiles){const path=join(directory,'sources',file);await mkdir(dirname(path),{recursive:true});await writeFile(path,await readFile(file));}
 await writeFile(join(directory,'reference-study.json'),referenceBytes);await save('protocol.json',protocol);
}
const existing=await read('results.json');if(existing){console.log(JSON.stringify({directory,alreadyComplete:true,passed:existing.passed}));process.exit(0);}
await save('runner.json',{pid:process.pid,startedAt:new Date().toISOString(),status:'running'});
const parameters=protocol.parameters,body=(values,learning=true)=>({controller:'episodic-actor',learning,parameters:values});
const profiles={learned:body(parameters),frozen:body(parameters,false),noMemory:body({...parameters,memoryLearning:false}),fullRange:body({...parameters,moveMode:'residual',moveGain:2}),neural:{controller:'trace-actor',learning:true},...(parameters.returnMode==='td'?{observedWindow:body({...parameters,returnMode:'mean'})}:{})};
function run(seed,profile){
 const world=new World({seed,founders:protocol.founders,capacity:240,controller:profile.controller,learning:profile.learning,actorParameters:protocol.actorParameters,reproduction:false,mutation:false,...protocol.environment,...(profile.parameters?{episodicParameters:profile.parameters}:{})});
 const founderHash=createHash('sha256').update(JSON.stringify(world.flies.map(({brain,...fly})=>fly))).digest('hex'),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),started=performance.now();world.advance(protocol.horizonTicks);
 if(Math.abs(world.metrics().accountingError)>1e-6)throw Error('Energy accounting failed');
 return{seed,founderHash,ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/protocol.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated,accountingResidual:world.metrics().accountingError,wallSeconds:(performance.now()-started)/1000};
}
const rows=await read('heldout.json')||[],started=performance.now();
for(const seed of protocol.seeds){
 if(rows.some(row=>row.seed===seed))continue;
 const arms={};let hash;for(const[name,profile]of Object.entries(profiles)){arms[name]=run(seed,profile);if(hash&&hash!==arms[name].founderHash)throw Error('Unmatched founders');hash=arms[name].founderHash;}
 rows.push({seed,arms});await save('heldout.json',rows);console.log(JSON.stringify({directory,phase:'independent-confirmation',completed:rows.length,total:protocol.seeds.length}));
}
let memory=await read('memory.json');if(!memory){memory=evaluateContext(protocol.seeds,protocol.actorParameters,undefined,{capacity:parameters.capacity,neighbors:parameters.neighbors,bandwidth:parameters.bandwidth,maxDistance:parameters.maxDistance,exploration:parameters.exploration,replacement:parameters.replacement,featureMode:parameters.featureMode});await save('memory.json',memory);}
const comparisons=Object.fromEntries(Object.keys(profiles).filter(name=>name!=='learned').map(control=>[control,Object.fromEntries(['energy','population'].map(key=>[key,interval95(rows.map(row=>row.arms.learned[key]-row.arms[control][key]))]))]));
const s=memory.summary,g=protocol.gates,memoryPassed=s.aAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionChangeLowerBound;
const habitatPassed=protocol.requiredControls.every(name=>comparisons[name].energy.ci95[0]>g.energyDifferenceLowerBound&&comparisons[name].population.mean>=g.populationDifferenceMeanMinimum);
for(const file of sourceFiles)if(createHash('sha256').update(await readFile(file)).digest('hex')!==sourceSha256[file])throw Error('Sources changed during confirmation');
const result={protocol,locked:reference.locked,comparisons,memoryPassed,habitatPassed,passed:memoryPassed&&habitatPassed,completedAt:new Date().toISOString(),wallSecondsThisInvocation:(performance.now()-started)/1000};
await save('results.json',result);await save('runner.json',{pid:process.pid,status:'complete',completedAt:result.completedAt});console.log(JSON.stringify({directory,...result},null,2));
