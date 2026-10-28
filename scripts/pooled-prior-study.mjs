import {World} from '../engine.mjs';
import {evaluateContext} from '../learning/context-tasks.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,join,dirname} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referencePath=resolve(process.argv[2]||'evidence/episodic-confirmation/b3ee4b6f-557e-455f-b98b-513c19fc7173/results.json'),directory=resolve(process.argv[3]||`evidence/pooled-prior/${randomUUID()}`);
const referenceBytes=await readFile(referencePath),reference=JSON.parse(referenceBytes),parent=reference.protocol;
if(!reference.passed||parent.experiment!=='independent-cruising-confirmation'||parent.environment.ecology!=='baseline')throw Error('Provide the passing stable cruising reference');
await mkdir(directory,{recursive:true});
const read=async name=>{try{return JSON.parse(await readFile(join(directory,name),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const save=async(name,data)=>{const path=join(directory,name);await writeFile(path+'.tmp',JSON.stringify(data,null,2)+'\n');await rename(path+'.tmp',path);};
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','learning/context-tasks.mjs','scripts/pooled-prior-study.mjs'],sourceSha256={};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');for(const file of sourceFiles)sourceSha256[file]=hash(await readFile(file));
const diagnosisPaths=['evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/retrieval-diagnosis.json','evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7/results.json','evidence/neural-memory-interaction/be518e8d-b6cd-471d-945d-ab399c101bf7/outcomes.json'],diagnosisSha256={};
for(const path of diagnosisPaths)diagnosisSha256[path]=hash(await readFile(path));
let protocol=await read('protocol.json');
if(protocol){if(!isDeepStrictEqual(protocol.sourceSha256,sourceSha256)||protocol.referenceSha256!==hash(referenceBytes)||!isDeepStrictEqual(protocol.diagnosisSha256,diagnosisSha256))throw Error('Source/reference/diagnosis changed; use archived sources for resume');}
else {
  const used=new Set(),seedRegistries=[];
  const inspect=async path=>{let bytes;try{bytes=await readFile(path);}catch(error){if(error.code==='ENOENT')return;throw error;}const data=JSON.parse(bytes);seedRegistries.push({path,sha256:hash(bytes)});for(const key of ['seeds','developmentSeeds','heldoutSeeds','probeSeeds'])for(const seed of data[key]||[])used.add(seed);if(Number.isInteger(data.seed))used.add(data.seed);};
  for(const root of await readdir('evidence',{withFileTypes:true}))if(root.isDirectory()){const path=join('evidence',root.name);await inspect(join(path,'protocol.json'));for(const entry of await readdir(path,{withFileTypes:true}))if(entry.isDirectory())await inspect(join(path,entry.name,'protocol.json'));}
  const seeds=[],offset=parseInt(randomUUID().slice(0,8),16)>>>0;for(let i=0;seeds.length<42;i++){const seed=((offset+i*7919)>>>0)||1;if(!used.has(seed)&&!seeds.includes(seed))seeds.push(seed);}
  protocol={schema:1,at:new Date().toISOString(),experiment:'pooled-local-return-prior',referencePath,referenceSha256:hash(referenceBytes),diagnosisSha256,sourceSha256,seedRegistries,developmentSeeds:seeds.slice(0,12),heldoutSeeds:seeds.slice(12),candidates:[1,4].map(priorStrength=>({id:'prior-'+priorStrength,parameters:{...parent.parameters,priorStrength}})),incumbent:parent.parameters,actorParameters:parent.actorParameters,founders:parent.founders,horizonTicks:parent.horizonTicks,environments:{stable:parent.environment,relocation:{...parent.environment,ecology:'relocation'}},requiredControls:['frozen','noMemory','neural','fullRange'],gates:{...parent.gates,stableIncumbentEnergyLowerBound:-.5,relocationIncumbentEnergyLowerBound:0},selection:'Two fixed strengths of shared local outcome prior. Prefer cue-retention passing candidates with nonnegative mean population differences versus candidate-specific frozen/memory-disabled and shared incumbent/neural controls in BOTH worlds, stable mean energy >= -0.5 versus incumbent, and positive relocation mean energy versus incumbent. Rank by worst mean energy versus frozen/memory-disabled/neural in both worlds plus relocating incumbent; tie by ID. Lock once before held-out evaluation. An ineligible fallback is exploratory and cannot qualify even if later gates pass.',interpretation:'New human-designed retrieval intervention, not RSI. Action-specific kNN weighted means are shrunk toward their pooled local outcome mean, using relative support weights with a shared numerical offset. Missing action experience inherits the observed local prior instead of assumed zero. The prior uses only already retrieved records and creates no new stored experience or oracle action label. Same record bound, sensory representation, TD windows, motor levels, inherited bodies and physical prices. One existing charged scan per action lookup and one per TD query; pooled arithmetic reuses the selected record statistics. No reproduction/mutation or environment promotion. Qualification requires all existing matched energy/survival guards in BOTH worlds, incumbent preservation/improvement, and separate cue-memory retention. Cue task does not test habitat TD bootstrapping or whole-body continual learning. Do not extend a failed held-out sample.'};
  for(const file of sourceFiles){const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,await readFile(file));}
  for(const [index,path]of diagnosisPaths.entries())await writeFile(join(directory,'diagnosis-'+index+'.json'),await readFile(path));
  protocol.priorBoundary='With both actions supported, shrinking toward their shared weighted mean preserves their ordering for unchanged stored targets; the intervention changes value magnitudes/TD bootstraps and unsupported-action preferences, not direct discrimination of two supported actions. Unsupported actions tie exactly with the supported local value. A partial development run was stopped before held-out evaluation for this numerical tie correction; its seeds remain excluded and evidence retained.';
  await writeFile(join(directory,'reference-study.json'),referenceBytes);await save('protocol.json',protocol);
}
if(await read('results.json')){console.log(JSON.stringify({directory,alreadyComplete:true}));process.exit(0);}
await save('runner.json',{pid:process.pid,status:'running',startedAt:new Date().toISOString()});
const body=(parameters,learning=true)=>({controller:'episodic-actor',parameters,learning}),neural={controller:'trace-actor',learning:true};
function run(seed,environment,profile) {
  const world=new World({seed,founders:protocol.founders,capacity:240,controller:profile.controller,learning:profile.learning,actorParameters:protocol.actorParameters,reproduction:false,mutation:false,...environment,...(profile.parameters?{episodicParameters:profile.parameters}:{})}),initial=world.flies.reduce((s,f)=>s+f.energy,0),founderHash=hash(JSON.stringify(world.flies.map(({brain,...f})=>f)));
  const behavior={decisions:0,oneSupported:0,neitherSupported:0,zeroMissingPreferred:0,priorChangedGreedy:0};
  for(let tick=0;tick<protocol.horizonTicks;tick++){
    if(!world.step())break;
    if(profile.controller!=='episodic-actor')continue;
    for(const fly of world.flies){const s=fly.brain.episodic,d=s.lastDecision;if(d?.step!==s.steps)continue;behavior.decisions++;const {negative:a,positive:b}=d.retrieval,supported=Number(a.neighbors.length>0)+Number(b.neighbors.length>0);behavior.oneSupported+=Number(supported===1);behavior.neitherSupported+=Number(supported===0);
      behavior.zeroMissingPreferred+=Number(d.reason==='retrieval'&&((!a.neighbors.length&&b.estimate<0&&d.choice===-1)||(!b.neighbors.length&&a.estimate<0&&d.choice===1)));
      if(profile.parameters.priorStrength){const raw=Math.sign(b.rawEstimate-a.rawEstimate),pooled=Math.sign(b.estimate-a.estimate);behavior.priorChangedGreedy+=Number(raw!==pooled);}
    }
  }
  const residual=world.metrics().accountingError;if(Math.abs(residual)>1e-6)throw Error('Energy accounting failed');
  return {seed,founderHash,ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((s,f)=>s+f.energy,0)-initial)/protocol.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated,accountingResidual:residual,fullStateSha256:hash(JSON.stringify(world.checkpoint())),behavior};
}
const pair=(seed,profiles)=>Object.fromEntries(Object.entries(protocol.environments).map(([env,environment])=>{const arms=Object.fromEntries(Object.entries(profiles).map(([key,profile])=>[key,run(seed,environment,profile)]));if(new Set(Object.values(arms).map(a=>a.founderHash)).size!==1)throw Error('Founder mismatch');return[env,arms];}));
const compare=(rows,candidate,control)=>Object.fromEntries(Object.keys(protocol.environments).map(env=>[env,Object.fromEntries(['energy','population'].map(key=>[key,interval95(rows.map(row=>row.environments[env][candidate][key]-row.environments[env][control][key]))]))]));
const memoryOptions=p=>Object.fromEntries(['capacity','neighbors','bandwidth','maxDistance','exploration','replacement','recencyHalfLife','featureMode','priorStrength'].filter(key=>p[key]!==undefined).map(key=>[key,p[key]]));
const memoryPass=m=>{const s=m.summary,g=protocol.gates;return s.aAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.memoryAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionChangeLowerBound;};

let compatibility=await read('compatibility.json');
if(!compatibility){
  const outcomes=await read('diagnosis-2.json');compatibility=[];
  for(const row of outcomes.slice(0,2))for(const [env,environment]of Object.entries(protocol.environments)) {
    // Preserve the historical configuration insertion order too: the stored
    // digest hashes JSON bytes rather than a key-order canonicalization.
    const world=new World({seed:row.seed,founders:protocol.founders,capacity:240,reproduction:false,mutation:false,...environment,controller:'episodic-actor',learning:true,actorParameters:{...protocol.actorParameters},episodicParameters:{...protocol.incumbent,memoryLearning:true,neuralLearning:true}});world.advance(protocol.horizonTicks);
    const sha256=hash(JSON.stringify(world.checkpoint()));if(sha256!==row.environments[env].incumbent.fullStateSha256)throw Error('Legacy complete-state compatibility failed');compatibility.push({seed:row.seed,environment:env,exactCompleteState:true,sha256});
  }
  await save('compatibility.json',compatibility);
}
const shared={incumbent:body(protocol.incumbent),neural},developmentProfiles={...shared};
for(const c of protocol.candidates){developmentProfiles[c.id]=body(c.parameters);developmentProfiles[c.id+'-frozen']=body(c.parameters,false);developmentProfiles[c.id+'-noMemory']=body({...c.parameters,memoryLearning:false});}
const development=await read('development.json')||[];
for(const seed of protocol.developmentSeeds){if(development.some(row=>row.seed===seed))continue;development.push({seed,environments:pair(seed,developmentProfiles)});await save('development.json',development);console.log(JSON.stringify({directory,phase:'development',completed:development.length,total:protocol.developmentSeeds.length}));}
let locked=await read('locked-selection.json');
if(!locked) {
  const memory=await read('development-memory.json')||{};for(const c of protocol.candidates)if(!memory[c.id]){memory[c.id]=evaluateContext(protocol.developmentSeeds,protocol.actorParameters,undefined,memoryOptions(c.parameters));await save('development-memory.json',memory);}
  const rankings=protocol.candidates.map(c=>{const comparisons={frozen:compare(development,c.id,c.id+'-frozen'),noMemory:compare(development,c.id,c.id+'-noMemory'),incumbent:compare(development,c.id,'incumbent'),neural:compare(development,c.id,'neural')},metrics=Object.values(comparisons).flatMap(v=>Object.values(v)),ranked=[...['frozen','noMemory','neural'].flatMap(k=>Object.values(comparisons[k])),comparisons.incumbent.relocation];return{...c,memoryPassed:memoryPass(memory[c.id]),eligible:memoryPass(memory[c.id])&&metrics.every(m=>m.population.mean>=0)&&comparisons.incumbent.stable.energy.mean>=protocol.gates.stableIncumbentEnergyLowerBound&&comparisons.incumbent.relocation.energy.mean>0,score:Math.min(...ranked.map(v=>v.energy.mean)),comparisons};});
  rankings.sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||a.id.localeCompare(b.id));locked={...rankings[0],rankings,lockedAt:new Date().toISOString()};await save('locked-selection.json',locked);console.log(JSON.stringify({directory,phase:'locked',id:locked.id,eligible:locked.eligible}));
}
const profiles={learned:body(locked.parameters),frozen:body(locked.parameters,false),noMemory:body({...locked.parameters,memoryLearning:false}),...shared,fullRange:body({...locked.parameters,moveMode:'residual',moveGain:2})},rows=await read('heldout.json')||[];
for(const seed of protocol.heldoutSeeds){if(rows.some(row=>row.seed===seed))continue;rows.push({seed,environments:pair(seed,profiles)});await save('heldout.json',rows);console.log(JSON.stringify({directory,phase:'heldout',completed:rows.length,total:protocol.heldoutSeeds.length}));}
let memory=await read('memory.json');if(!memory){memory=evaluateContext(protocol.heldoutSeeds,protocol.actorParameters,undefined,memoryOptions(locked.parameters));await save('memory.json',memory);}
const comparisons=Object.fromEntries(Object.keys(profiles).filter(key=>key!=='learned').map(key=>[key,compare(rows,'learned',key)])),g=protocol.gates;
const habitatPassed=protocol.requiredControls.every(control=>Object.values(comparisons[control]).every(v=>v.energy.ci95[0]>g.energyDifferenceLowerBound&&v.population.mean>=g.populationDifferenceMeanMinimum)),incumbentPassed=comparisons.incumbent.stable.energy.ci95[0]>g.stableIncumbentEnergyLowerBound&&comparisons.incumbent.stable.population.mean>=0&&comparisons.incumbent.relocation.energy.ci95[0]>g.relocationIncumbentEnergyLowerBound&&comparisons.incumbent.relocation.population.mean>=0,memoryPassed=memoryPass(memory);
for(const file of sourceFiles)if(hash(await readFile(file))!==sourceSha256[file])throw Error('Source changed during study');
const result={protocol,locked,comparisons,memoryPassed,habitatPassed,incumbentPassed,passed:locked.eligible&&memoryPassed&&habitatPassed&&incumbentPassed,completedAt:new Date().toISOString()};await save('results.json',result);await save('runner.json',{pid:process.pid,status:'complete',completedAt:result.completedAt});console.log(JSON.stringify({directory,phase:'done',locked:locked.id,eligible:locked.eligible,memoryPassed,habitatPassed,incumbentPassed,passed:result.passed}));
