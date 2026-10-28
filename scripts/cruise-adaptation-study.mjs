import {World} from '../engine.mjs';
import {evaluateContext} from '../learning/context-tasks.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referencePath=resolve(process.argv[2]||''),directory=resolve(process.argv[3]||`evidence/episodic-adaptation/${randomUUID()}`);
const referenceBytes=await readFile(referencePath),reference=JSON.parse(referenceBytes),parent=reference.protocol;
if(!reference.passed||parent.experiment!=='independent-cruising-confirmation'||parent.environment.ecology!=='baseline')throw Error('Provide the passing stable-world independent confirmation');
await mkdir(directory,{recursive:true});
const read=async name=>{try{return JSON.parse(await readFile(join(directory,name)));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const save=async(name,value)=>{const path=join(directory,name);await writeFile(path+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(path+'.tmp',path);};
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','learning/context-tasks.mjs','scripts/cruise-adaptation-study.mjs'],sourceSha256={};
for(const name of sourceFiles)sourceSha256[name]=createHash('sha256').update(await readFile(name)).digest('hex');
const referenceSha256=createHash('sha256').update(referenceBytes).digest('hex');
let protocol=await read('protocol.json');
if(protocol){if(!isDeepStrictEqual(protocol.sourceSha256,sourceSha256)||protocol.referenceSha256!==referenceSha256)throw Error('Source/reference changed; use archived sources for a resume');}
else{
 const used=new Set();
 for(const root of ['evidence/episodic-body','evidence/episodic-credit','evidence/episodic-confirmation','evidence/episodic-adaptation']){
  let entries;try{entries=await readdir(root,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')continue;throw e;}
  for(const entry of entries)if(entry.isDirectory()){let p;try{p=JSON.parse(await readFile(join(root,entry.name,'protocol.json')));}catch(e){if(e.code==='ENOENT')continue;throw e;}for(const key of ['seeds','developmentSeeds','heldoutSeeds'])for(const seed of p[key]||[])used.add(seed);}
 }
 const seeds=[],offset=parseInt(randomUUID().slice(0,8),16)>>>0;for(let i=0;seeds.length<42;i++){const seed=((offset+i*7919)>>>0)||1;if(!used.has(seed)&&!seeds.includes(seed))seeds.push(seed);}
 const candidates=[];for(const returnMode of ['td','mean'])for(const replacement of ['reservoir','hybrid'])for(const recencyHalfLife of [0,32])candidates.push({id:`${returnMode}-${replacement}-recent${recencyHalfLife}`,parameters:{...parent.parameters,returnMode,replacement,recencyHalfLife}});
 protocol={schema:1,at:new Date().toISOString(),experiment:'cruise-recent-long-memory',referencePath,referenceSha256,sourceSha256,developmentSeeds:seeds.slice(0,12),heldoutSeeds:seeds.slice(12),candidates,incumbent:parent.parameters,actorParameters:parent.actorParameters,founders:parent.founders,horizonTicks:parent.horizonTicks,environments:{stable:parent.environment,relocation:{...parent.environment,ecology:'relocation'}},gates:{...parent.gates,stableIncumbentEnergyLowerBound:-.5,relocationIncumbentEnergyLowerBound:0},requiredControls:['frozen','noMemory','neural','fullRange'],selection:'Full 2×2×2 factorial over observed-window versus TD, reservoir versus quarter-recent/three-quarter-long memory, and zero versus 32-experience recency half-life. First prefer candidates meeting development cue retention and nonnegative mean population differences versus globally frozen, memory disabled and neural in BOTH worlds. Rank eligible candidates by the smaller of stable/relocation minimum mean energy differences versus those controls. Tie break by ID. Lock one candidate before opening held-out data; never reselect. A failed development screen still locks the highest-ranked exploratory policy; this does not count as passing.',interpretation:'Human-designed adaptation experiment, not RSI. Reproduction/mutation disabled, matched inherited founders and unchanged energy prices/total memory bound. No environmental stage increase. Held-out gate requires energy lower bound >0 and nonnegative population mean against all four required controls in BOTH worlds, separate cue retention, stable incumbent noninferiority (-0.5 energy/founder lower bound), and positive relocation advantage over incumbent. Separate cue retention does not establish continual retention in one moving body.'};
 for(const name of sourceFiles){const dest=join(directory,'sources',name);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,await readFile(name));}
 await writeFile(join(directory,'reference-study.json'),referenceBytes);await save('protocol.json',protocol);
}
if(await read('results.json')){console.log(JSON.stringify({directory,alreadyComplete:true}));process.exit(0);}
await save('runner.json',{pid:process.pid,status:'running',startedAt:new Date().toISOString()});
const body=(parameters,learning=true)=>({controller:'episodic-actor',parameters,learning}),incumbent=protocol.incumbent;
const controls={frozen:body(incumbent,false),noMemory:body({...incumbent,memoryLearning:false}),neural:{controller:'trace-actor',learning:true}};
function run(seed,environment,profile){
 const w=new World({seed,founders:protocol.founders,capacity:240,controller:profile.controller,learning:profile.learning,reproduction:false,mutation:false,actorParameters:protocol.actorParameters,...environment,...(profile.parameters?{episodicParameters:profile.parameters}:{})}),initial=w.flies.reduce((s,f)=>s+f.energy,0),founderHash=createHash('sha256').update(JSON.stringify(w.flies.map(({brain,...f})=>f))).digest('hex');
 w.advance(protocol.horizonTicks);if(Math.abs(w.metrics().accountingError)>1e-6)throw Error('Energy accounting failed');
 return{ticks:w.tick,population:w.flies.length,energy:(w.flies.reduce((s,f)=>s+f.energy,0)-initial)/protocol.founders,food:w.totals.foodEaten,expenditure:w.totals.dissipated,founderHash,accountingResidual:w.metrics().accountingError};
}
function paired(seed,profiles){return Object.fromEntries(Object.entries(protocol.environments).map(([name,environment])=>{let hash;const arms={};for(const[key,p]of Object.entries(profiles)){const result=run(seed,environment,p);if(hash&&result.founderHash!==hash)throw Error('Founder mismatch');hash=result.founderHash;arms[key]=result;}return[name,arms];}));}
const compare=(rows,candidate,control)=>Object.fromEntries(Object.keys(protocol.environments).map(environment=>[environment,Object.fromEntries(['energy','population'].map(key=>[key,interval95(rows.map(row=>row.environments[environment][candidate][key]-row.environments[environment][control][key]))]))]));
const memoryOptions=p=>Object.fromEntries(['capacity','neighbors','bandwidth','maxDistance','exploration','replacement','recencyHalfLife','featureMode'].map(k=>[k,p[k]]));
const memoryPass=m=>{const s=m.summary,g=protocol.gates;return s.aAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionChangeLowerBound;};
const development=await read('development.json')||[];
for(const seed of protocol.developmentSeeds){if(development.some(r=>r.seed===seed))continue;const profiles={...controls,...Object.fromEntries(protocol.candidates.map(c=>[c.id,body(c.parameters)]))};development.push({seed,environments:paired(seed,profiles)});await save('development.json',development);console.log(JSON.stringify({directory,phase:'development',completed:development.length,total:protocol.developmentSeeds.length}));}
let locked=await read('locked-selection.json');
if(!locked){
 const memory=await read('development-memory.json')||{};for(const c of protocol.candidates)if(!memory[c.id]){memory[c.id]=evaluateContext(protocol.developmentSeeds,protocol.actorParameters,undefined,memoryOptions(c.parameters));await save('development-memory.json',memory);}
 const rankings=protocol.candidates.map(c=>{const comparisons=Object.fromEntries(Object.keys(controls).map(control=>[control,compare(development,c.id,control)])),metrics=Object.values(comparisons).flatMap(c=>Object.values(c));return{...c,memoryPassed:memoryPass(memory[c.id]),eligible:memoryPass(memory[c.id])&&metrics.every(v=>v.population.mean>=0),score:Math.min(...metrics.map(v=>v.energy.mean)),comparisons};});
 rankings.sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||a.id.localeCompare(b.id));locked={...rankings[0],rankings,lockedAt:new Date().toISOString()};await save('locked-selection.json',locked);console.log(JSON.stringify({directory,phase:'locked',id:locked.id,eligible:locked.eligible,score:locked.score}));
}
const profiles={learned:body(locked.parameters),...controls,incumbent:body(incumbent),fullRange:body({...locked.parameters,moveMode:'residual',moveGain:2}),reservoir:body({...locked.parameters,replacement:'reservoir',recencyHalfLife:0}),fifo:body({...locked.parameters,replacement:'fifo',recencyHalfLife:0})};
const rows=await read('heldout.json')||[];
for(const seed of protocol.heldoutSeeds){if(rows.some(r=>r.seed===seed))continue;rows.push({seed,environments:paired(seed,profiles)});await save('heldout.json',rows);console.log(JSON.stringify({directory,phase:'heldout',completed:rows.length,total:protocol.heldoutSeeds.length}));}
let memory=await read('memory.json');if(!memory){memory=evaluateContext(protocol.heldoutSeeds,protocol.actorParameters,undefined,memoryOptions(locked.parameters));await save('memory.json',memory);}
const comparisons=Object.fromEntries(Object.keys(profiles).filter(k=>k!=='learned').map(k=>[k,compare(rows,'learned',k)])),g=protocol.gates;
const habitatPassed=protocol.requiredControls.every(c=>Object.values(comparisons[c]).every(v=>v.energy.ci95[0]>g.energyDifferenceLowerBound&&v.population.mean>=g.populationDifferenceMeanMinimum)),memoryPassed=memoryPass(memory),incumbentPassed=comparisons.incumbent.stable.energy.ci95[0]>g.stableIncumbentEnergyLowerBound&&comparisons.incumbent.stable.population.mean>=0&&comparisons.incumbent.relocation.energy.ci95[0]>g.relocationIncumbentEnergyLowerBound&&comparisons.incumbent.relocation.population.mean>=0;
for(const name of sourceFiles)if(createHash('sha256').update(await readFile(name)).digest('hex')!==sourceSha256[name])throw Error('Source changed during study');
const result={protocol,locked,comparisons,habitatPassed,memoryPassed,incumbentPassed,passed:habitatPassed&&memoryPassed&&incumbentPassed,completedAt:new Date().toISOString()};await save('results.json',result);await save('runner.json',{pid:process.pid,status:'complete',completedAt:result.completedAt});console.log(JSON.stringify({directory,locked:locked.id,habitatPassed,memoryPassed,incumbentPassed,passed:result.passed,comparisons},null,2));
