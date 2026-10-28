import {World} from '../engine.mjs';
import {evaluateContext} from '../learning/context-tasks.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {dirname,join,resolve,basename} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referencePath=resolve(process.argv[2]||''),directory=resolve(process.argv[3]||`evidence/episodic-context-replication/${randomUUID()}`);
const referenceBytes=await readFile(referencePath),reference=JSON.parse(referenceBytes),parent=reference.protocol;
if(!reference.locked?.parameters||parent.experiment!=='cruise-context-and-policy-value'||parent.environments.stable.ecology!=='baseline'||parent.environments.relocation.ecology!=='relocation')throw Error('Provide the completed contextual-policy study; this repeats the same environments, regardless of whether its gate passed');
const parentRows=JSON.parse(await readFile(join(dirname(referencePath),'heldout.json')));for(const [control,comparisons]of Object.entries(reference.comparisons))for(const [environment,metrics]of Object.entries(comparisons))for(const key of ['energy','population'])if(!isDeepStrictEqual(interval95(parentRows.map(row=>row.environments[environment].learned[key]-row.environments[environment][control][key])),metrics[key]))throw Error('Parent raw outcomes/comparisons mismatch');
await mkdir(directory,{recursive:true});
const read=async name=>{try{return JSON.parse(await readFile(join(directory,name)));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const save=async(name,value)=>{const path=join(directory,name);await writeFile(path+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(path+'.tmp',path);};
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','learning/context-tasks.mjs','scripts/replicate-context-policy.mjs'],sourceSha256={};
for(const name of sourceFiles){sourceSha256[name]=createHash('sha256').update(await readFile(name)).digest('hex');if(parent.sourceSha256[name]&&parent.sourceSha256[name]!==sourceSha256[name])throw Error('Locked algorithm source changed: '+name);}
const referenceSha256=createHash('sha256').update(referenceBytes).digest('hex');
let protocol=await read('protocol.json');
if(protocol){if(!isDeepStrictEqual(protocol.sourceSha256,sourceSha256)||protocol.referenceSha256!==referenceSha256)throw Error('Source/reference changed; use archived sources for a resume');if(protocol.seedCount!==100||protocol.heldoutSeeds.length!==100||new Set(protocol.heldoutSeeds).size!==100||protocol.locked.id!==reference.locked.id||!isDeepStrictEqual(protocol.locked.parameters,reference.locked.parameters)||!isDeepStrictEqual(protocol.environments,parent.environments)||!isDeepStrictEqual(protocol.gates,parent.gates)||!isDeepStrictEqual(protocol.actorParameters,parent.actorParameters)||!isDeepStrictEqual(protocol.requiredControls,parent.requiredControls)||protocol.founders!==parent.founders||protocol.horizonTicks!==parent.horizonTicks)throw Error('Locked replication protocol changed');}
else{
 const used=new Set();
 for(const root of ['evidence/episodic-body','evidence/episodic-credit','evidence/episodic-confirmation','evidence/episodic-adaptation','evidence/episodic-risk','evidence/episodic-retention','evidence/episodic-context-value','evidence/episodic-context-replication']){
  let entries;try{entries=await readdir(root,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')continue;throw e;}
  for(const entry of entries)if(entry.isDirectory()){let p;try{p=JSON.parse(await readFile(join(root,entry.name,'protocol.json')));}catch(e){if(e.code==='ENOENT')continue;throw e;}for(const key of ['seeds','developmentSeeds','heldoutSeeds'])for(const seed of p[key]||[])used.add(seed);}
 }
 const seeds=[],offset=parseInt(randomUUID().slice(0,8),16)>>>0;for(let i=0;seeds.length<100;i++){const seed=((offset+i*7919)>>>0)||1;if(!used.has(seed)&&!seeds.includes(seed))seeds.push(seed);}
 protocol={schema:1,at:new Date().toISOString(),experiment:'independent-context-policy-replication',referencePath,referenceSha256,referencePassed:reference.passed,sourceSha256,heldoutSeeds:seeds,seedCount:100,locked:{id:reference.locked.id,parameters:reference.locked.parameters,lockedAt:new Date().toISOString(),parentLockedAt:reference.locked.lockedAt},incumbent:parent.incumbent,actorParameters:parent.actorParameters,founders:parent.founders,horizonTicks:parent.horizonTicks,environments:parent.environments,gates:parent.gates,requiredControls:parent.requiredControls,selection:'No candidate selection or tuning. Repeat exactly the policy locked before the parent 30-seed evaluation on 100 new seed pairs per environment. The parent full gate failed; this is a new independent fixed-size replication of a partial signal, not a claim that the parent passed. Never pool the two studies to rescue either gate. No extra seeds or reselection after opening this replication.',interpretation:'Same nutrient, ecology, bodies, prices, horizon, acquisition controls and acceptance rules as the parent. Not an increase in environmental difficulty or an RSI result. If this replication fails, do not keep extending its sample until passing; return to diagnosis or a separately specified intervention. Cue-memory checks are separate from whole-body retention.'};
 await save('locked-selection.json',protocol.locked);await writeFile(join(directory,'parent-heldout.json'),JSON.stringify(parentRows,null,2)+'\n');
 for(const name of sourceFiles){const dest=join(directory,'sources',name);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,await readFile(name));}
 await writeFile(join(directory,'reference-study.json'),referenceBytes);await save('protocol.json',protocol);
}
if(await read('results.json')){console.log(JSON.stringify({directory,alreadyComplete:true}));process.exit(0);}
await save('runner.json',{pid:process.pid,status:'running',startedAt:new Date().toISOString()});
const body=(parameters,learning=true)=>({controller:'episodic-actor',parameters,learning}),incumbent=protocol.incumbent;
const controls={frozen:body(incumbent,false),noMemory:body({...incumbent,memoryLearning:false}),neural:{controller:'trace-actor',learning:true},incumbent:body(incumbent)};
function run(seed,environment,profile){
 const w=new World({seed,founders:protocol.founders,capacity:240,controller:profile.controller,learning:profile.learning,reproduction:false,mutation:false,actorParameters:protocol.actorParameters,...environment,...(profile.parameters?{episodicParameters:profile.parameters}:{})}),initial=w.flies.reduce((s,f)=>s+f.energy,0),founderHash=createHash('sha256').update(JSON.stringify(w.flies.map(({brain,...f})=>f))).digest('hex');
 w.advance(protocol.horizonTicks);if(Math.abs(w.metrics().accountingError)>1e-6)throw Error('Energy accounting failed');
 return{ticks:w.tick,population:w.flies.length,energy:(w.flies.reduce((s,f)=>s+f.energy,0)-initial)/protocol.founders,food:w.totals.foodEaten,expenditure:w.totals.dissipated,founderHash,accountingResidual:w.metrics().accountingError};
}
function paired(seed,profiles){return Object.fromEntries(Object.entries(protocol.environments).map(([name,environment])=>{let hash;const arms={};for(const[key,p]of Object.entries(profiles)){const result=run(seed,environment,p);if(hash&&result.founderHash!==hash)throw Error('Founder mismatch');hash=result.founderHash;arms[key]=result;}return[name,arms];}));}
const compare=(rows,candidate,control)=>Object.fromEntries(Object.keys(protocol.environments).map(environment=>[environment,Object.fromEntries(['energy','population'].map(key=>[key,interval95(rows.map(row=>row.environments[environment][candidate][key]-row.environments[environment][control][key]))]))]));
const memoryOptions=p=>Object.fromEntries(['capacity','neighbors','bandwidth','maxDistance','exploration','replacement','recencyHalfLife','featureMode'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));
const memoryPass=m=>{const s=m.summary,g=protocol.gates;return s.aAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionChangeLowerBound;};
const locked=protocol.locked;
const profiles={learned:body(locked.parameters),...controls,fullRange:body({...locked.parameters,moveMode:'residual',moveGain:2}),...(locked.parameters.bootstrapMode==='expected'?{noExpected:body({...locked.parameters,bootstrapMode:'greedy'})}:{}),...(locked.parameters.featureMode!=='mixed'?{mixedFeatures:body({...locked.parameters,featureMode:'mixed'})}:{}),...(locked.parameters.featureMode==='navigation'?{localFeatures:body({...locked.parameters,featureMode:'local'})}:{})};
const rows=await read('heldout.json')||[];if(rows.some(r=>!protocol.heldoutSeeds.includes(r.seed))||new Set(rows.map(r=>r.seed)).size!==rows.length)throw Error('Invalid replication rows');
for(const seed of protocol.heldoutSeeds){if(rows.some(r=>r.seed===seed))continue;rows.push({seed,environments:paired(seed,profiles)});await save('heldout.json',rows);console.log(JSON.stringify({directory,phase:'heldout',completed:rows.length,total:protocol.heldoutSeeds.length}));}
let memory=await read('memory.json');if(!memory){memory=evaluateContext(protocol.heldoutSeeds,protocol.actorParameters,undefined,memoryOptions(locked.parameters));await save('memory.json',memory);}
const comparisons=Object.fromEntries(Object.keys(profiles).filter(k=>k!=='learned').map(k=>[k,compare(rows,'learned',k)])),g=protocol.gates;
const habitatPassed=protocol.requiredControls.every(c=>Object.values(comparisons[c]).every(v=>v.energy.ci95[0]>g.energyDifferenceLowerBound&&v.population.mean>=g.populationDifferenceMeanMinimum)),memoryPassed=memoryPass(memory),incumbentPassed=comparisons.incumbent.stable.energy.ci95[0]>g.stableIncumbentEnergyLowerBound&&comparisons.incumbent.stable.population.mean>=0&&comparisons.incumbent.relocation.energy.ci95[0]>g.relocationIncumbentEnergyLowerBound&&comparisons.incumbent.relocation.population.mean>=0;
for(const name of sourceFiles)if(createHash('sha256').update(await readFile(name)).digest('hex')!==sourceSha256[name])throw Error('Source changed during study');
const result={protocol,locked,comparisons,habitatPassed,memoryPassed,incumbentPassed,passed:habitatPassed&&memoryPassed&&incumbentPassed,completedAt:new Date().toISOString()};await save('results.json',result);await save('runner.json',{pid:process.pid,status:'complete',completedAt:result.completedAt});console.log(JSON.stringify({directory,locked:locked.id,habitatPassed,memoryPassed,incumbentPassed,passed:result.passed,comparisons},null,2));
