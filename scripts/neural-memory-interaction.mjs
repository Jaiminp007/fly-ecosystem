import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

const referencePath=resolve(process.argv[2]||'evidence/episodic-confirmation/b3ee4b6f-557e-455f-b98b-513c19fc7173/results.json');
const directory=resolve(process.argv[3]||`evidence/neural-memory-interaction/${randomUUID()}`);
const bytes=await readFile(referencePath),reference=JSON.parse(bytes),parent=reference.protocol;
if(!reference.passed||parent.experiment!=='independent-cruising-confirmation'||parent.environment.ecology!=='baseline')throw Error('A passing stable cruising reference is required');
await mkdir(directory,{recursive:true});
const read=async name=>{try{return JSON.parse(await readFile(join(directory,name),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const save=async(name,value)=>{const path=join(directory,name);await writeFile(path+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(path+'.tmp',path);};
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/neural-memory-interaction.mjs'],sourceSha256={};
for(const file of sourceFiles)sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const referenceSha256=createHash('sha256').update(bytes).digest('hex');
const diagnosticPath='evidence/episodic-joint/ec24a07d-b3be-4a7d-839a-3a17e9f4f3ac/results.json',diagnosticBytes=await readFile(diagnosticPath),diagnosticSha256=createHash('sha256').update(diagnosticBytes).digest('hex');
let protocol=await read('protocol.json');
if(protocol) {
  if(protocol.experiment!=='neural-memory-factorial-diagnostic'||!isDeepStrictEqual(protocol.sourceSha256,sourceSha256)||protocol.referenceSha256!==referenceSha256||protocol.diagnosticSha256!==diagnosticSha256||protocol.seedCount!==32)throw Error('Protocol/source/reference changed; use archived sources for a resume');
} else {
  const used=new Set(),registries=[];
  const inspect=async path=>{let data;try{const b=await readFile(path);data=JSON.parse(b);registries.push({path,sha256:createHash('sha256').update(b).digest('hex')});}catch(error){if(error.code==='ENOENT')return;throw error;}for(const key of ['seeds','developmentSeeds','heldoutSeeds','probeSeeds'])for(const seed of data[key]||[])used.add(seed);if(Number.isInteger(data.seed))used.add(data.seed);};
  for(const root of await readdir('evidence',{withFileTypes:true}))if(root.isDirectory()) {
    const path=join('evidence',root.name);await inspect(join(path,'protocol.json'));
    for(const entry of await readdir(path,{withFileTypes:true}))if(entry.isDirectory())await inspect(join(path,entry.name,'protocol.json'));
  }
  const seeds=[],offset=parseInt(randomUUID().slice(0,8),16)>>>0;
  for(let i=0;seeds.length<32;i++){const seed=((offset+i*7919)>>>0)||1;if(!used.has(seed)&&!seeds.includes(seed))seeds.push(seed);}
  protocol={schema:1,experiment:'neural-memory-factorial-diagnostic',at:new Date().toISOString(),referencePath,referenceSha256,diagnosticPath,diagnosticSha256,sourceSha256,seedCount:seeds.length,seeds,seedRegistries:registries,previouslyRegisteredSeeds:used.size,parameters:parent.parameters,actorParameters:parent.actorParameters,founders:parent.founders,horizonTicks:parent.horizonTicks,environments:{stable:parent.environment,relocation:{...parent.environment,ecology:'relocation'}},arms:{incumbent:{memoryLearning:true,neuralLearning:true},memoryOnly:{memoryLearning:true,neuralLearning:false},neuralOnly:{memoryLearning:false,neuralLearning:true},neither:{memoryLearning:false,neuralLearning:false},frozen:{memoryLearning:true,neuralLearning:false,learning:false},eatOnly:{memoryLearning:true,neuralLearning:true,plasticOutputs:4},signalOnly:{memoryLearning:true,neuralLearning:true,plasticOutputs:16},fullRange:{memoryLearning:true,neuralLearning:false,moveMode:'residual',moveGain:2},neural:{controller:'trace-actor'}},primaryContrasts:{memoryWithNeural:['incumbent','neuralOnly'],memoryWithoutNeural:['memoryOnly','neither'],removeNeuralWithMemory:['memoryOnly','incumbent'],removeNeuralWithoutMemory:['neither','neuralOnly']},secondaryContrasts:{eatLearning:['eatOnly','memoryOnly'],signalLearning:['signalOnly','memoryOnly'],memoryOnlyVsFrozen:['memoryOnly','frozen'],memoryOnlyVsFullRange:['memoryOnly','fullRange'],memoryOnlyVsNeural:['memoryOnly','neural']},endpointKeys:['energy','population','foodPerFounder','spentPerFounder','signalCostPerFounder'],hypothesis:'Remaining neural-output updates may interfere with episodic speed control. This is unestablished: evaluate a memory-learning × neural-learning factorial with the confirmed mixed-feature speed policy, plus eating-only and signaling-only masks. No feature, TD target, speed level, body or energy-price changes.',decisionRule:'Fixed diagnostic, no policy selection and no difficulty promotion. Report paired seed-level intervals in both environments. An interference signal requires positive relocation lower bounds for removing neural learning with memory AND for the difference of memory effects (without neural minus with neural), no mean relocation population loss for removing neural learning, and stable removal energy lower bound above -0.5 with no mean stable population loss. A positive result motivates a separate locked-policy confirmation on fresh seeds; it does not adopt a policy. No sample extension after results. Secondary mask/behavior intervals are descriptive and not multiplicity-adjusted.',interpretation:'All founders, inherited topology, exploration settings and physical prices match. Neural motor updates are already frozen by episodic control. Turning/movement actions remain unchanged by the mask directly; learning masks change other readouts only. Mating updates have no direct ecological effect with reproduction disabled but remain in the incumbent. Memory-enabled learning has its declared storage/lookup costs. No cue component or whole-body continual-retention claim is made. This human-specified diagnostic does not establish RSI.'};
  for(const file of sourceFiles){const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,await readFile(file));}
  await writeFile(join(directory,'reference-study.json'),bytes);await writeFile(join(directory,'reference-heldout.json'),await readFile(join(dirname(referencePath),'heldout.json')));await writeFile(join(directory,'joint-diagnosis.json'),diagnosticBytes);await save('protocol.json',protocol);
}
if(await read('results.json')){console.log(JSON.stringify({directory,alreadyComplete:true}));process.exit(0);}
await save('runner.json',{pid:process.pid,status:'running',startedAt:new Date().toISOString()});

function config(seed,environment,arm) {
  const profile=protocol.arms[arm];
  return {seed,founders:protocol.founders,capacity:240,reproduction:false,mutation:false,...environment,controller:profile.controller||'episodic-actor',learning:profile.learning??true,actorParameters:{...protocol.actorParameters,...(profile.plasticOutputs?{plasticOutputs:profile.plasticOutputs}:{})},...(profile.controller?{}:{episodicParameters:{...protocol.parameters,...Object.fromEntries(Object.entries(profile).filter(([key])=>!['controller','learning','plasticOutputs'].includes(key)))}})};
}
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function run(seed,environment,arm,{behavior=true}={}) {
  const world=new World(config(seed,environment,arm)),founders=[...world.flies],initial=founders.reduce((s,f)=>s+f.energy,0),founderHash=hash(founders.map(({brain,...fly})=>fly)),initialActorRngHash=hash(founders.map(f=>f.brain.actor.rngState));
  const observed={agentSteps:0,eatPositive:0,eatExtreme:0,signal:0,cappedFoodSignal:0,spent:0};
  for(let tick=0;tick<protocol.horizonTicks;tick++) {
    const agents=behavior?[...world.flies]:null;if(!world.step())break;
    if(agents)for(const fly of agents){observed.agentSteps++;observed.eatPositive+=Number(fly.lastActions[2]>0);observed.eatExtreme+=Number(Math.abs(fly.lastActions[2])>.98);observed.signal+=fly.signal;observed.cappedFoodSignal+=fly.lastFood;observed.spent+=fly.lastEnergyCost;}
  }
  const metrics=world.metrics(),state=world.checkpoint(),{config:ignored,...causalState}=state.world;
  if(Math.abs(metrics.accountingError)>1e-6)throw Error('Energy ledger failed for '+arm);
  const plastic=Array.from({length:5},()=>({count:0,absolute:0,nonzero:0}));
  for(const fly of founders)for(let index=0;index<fly.genome.edges.length;index++) {
    const output=fly.genome.edges[index].to-fly.genome.actor.inputs;
    if(output>=0&&output<plastic.length){const row=plastic[output],value=fly.brain.plastic[index];row.count++;row.absolute+=Math.abs(value);row.nonzero+=Number(value!==0);}
  }
  return {seed,founderHash,ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((s,f)=>s+f.energy,0)-initial)/protocol.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated,foodPerFounder:world.totals.foodEaten/protocol.founders,spentPerFounder:world.totals.dissipated/protocol.founders,signalCostPerFounder:world.totals.signalCost/protocol.founders,accountingResidual:metrics.accountingError,deathCauses:world.totals.deathCauses||{energy:0,age:0},initialActorRngHash,fullStateSha256:hash(state),nonConfigStateSha256:hash(causalState),plasticByOutput:plastic.map(row=>({...row,meanAbsolute:row.absolute/Math.max(1,row.count)})),behavior:behavior?{...observed,eatPositiveFraction:observed.eatPositive/Math.max(1,observed.agentSteps),eatExtremeFraction:observed.eatExtreme/Math.max(1,observed.agentSteps),meanSignal:observed.signal/Math.max(1,observed.agentSteps)}:null,relocations:world.events.filter(e=>e.kind==='resource-shift').map(e=>({tick:e.tick,centers:e.centers,nextTick:e.nextTick}))};
}

// Verify the current default policy against the historical reference before
// analyzing a different setting. No learned-versus-frozen result is hardcoded.
let compatibility=await read('compatibility.json');
if(!compatibility) {
  const parentRows=await read('reference-heldout.json');compatibility=[];
  for(const row of parentRows.slice(0,3)) {
    const actual=run(row.seed,protocol.environments.stable,'incumbent',{behavior:false}),expected=row.arms.learned;
    for(const key of ['founderHash','ticks','population','energy','food','expenditure','accountingResidual'])if(actual[key]!==expected[key])throw Error('Reference replay differs at '+key);
    compatibility.push({seed:row.seed,exactRecordedEndpoints:true});
  }
  const seed=protocol.seeds[0],world=new World(config(seed,protocol.environments.relocation,'memoryOnly'));world.advance(901);const restored=World.restore(world.checkpoint());world.advance(899);restored.advance(899);
  if(!isDeepStrictEqual(world.checkpoint(),restored.checkpoint()))throw Error('Memory-only checkpoint continuation differs');
  compatibility.push({seed,exactMemoryOnlyContinuation:true});await save('compatibility.json',compatibility);
}
const rows=await read('outcomes.json')||[];
for(const seed of protocol.seeds) {
  if(rows.some(row=>row.seed===seed))continue;
  const environments={};
  for(const [name,environment] of Object.entries(protocol.environments)) {
    const arms={};let founderHash;
    for(const arm of Object.keys(protocol.arms)) {
      arms[arm]=run(seed,environment,arm);
      if(founderHash&&arms[arm].founderHash!==founderHash)throw Error('Unmatched inherited founders');founderHash=arms[arm].founderHash;
      const nonzero=arms[arm].plasticByOutput.map(row=>row.nonzero);
      if(arm!=='neural'&&(nonzero[0]||nonzero[1]))throw Error('Episodic neural motor weights changed');
      if(['memoryOnly','neither','frozen','fullRange'].includes(arm)&&nonzero.some(Boolean))throw Error('Disabled neural learning changed a weight');
      if(arm==='eatOnly'&&nonzero.some((n,i)=>i!==2&&n)||arm==='signalOnly'&&nonzero.some((n,i)=>i!==4&&n))throw Error('Plastic output mask changed another readout');
    }
    if(arms.neither.nonConfigStateSha256!==arms.frozen.nonConfigStateSha256)throw Error('Both-off and globally frozen world states differ beyond configuration');
    environments[name]=arms;
  }
  rows.push({seed,environments});await save('outcomes.json',rows);console.log(JSON.stringify({directory,phase:'factorial',completed:rows.length,total:protocol.seeds.length}));
}
const paired=(left,right)=>Object.fromEntries(Object.keys(protocol.environments).map(environment=>[environment,Object.fromEntries(protocol.endpointKeys.map(key=>[key,interval95(rows.map(row=>row.environments[environment][left][key]-row.environments[environment][right][key]))]))]));
const comparisons=Object.fromEntries(Object.entries({...protocol.primaryContrasts,...protocol.secondaryContrasts}).map(([name,[left,right]])=>[name,paired(left,right)]));
const interaction=Object.fromEntries(Object.keys(protocol.environments).map(environment=>[environment,Object.fromEntries(protocol.endpointKeys.map(key=>[key,interval95(rows.map(row=>{const a=row.environments[environment];return (a.memoryOnly[key]-a.neither[key])-(a.incumbent[key]-a.neuralOnly[key]);}))]))]));
const removal=comparisons.removeNeuralWithMemory;
const interferenceSignal=removal.relocation.energy.ci95[0]>0&&interaction.relocation.energy.ci95[0]>0&&removal.relocation.population.mean>=0&&removal.stable.energy.ci95[0]>-.5&&removal.stable.population.mean>=0;
for(const file of sourceFiles)if(createHash('sha256').update(await readFile(file)).digest('hex')!==sourceSha256[file])throw Error('Sources changed during diagnostic');
const result={protocol,comparisons,interaction,interferenceSignal,qualificationPassed:false,decision:interferenceSignal?'Specify a separate fixed-policy confirmation on fresh seeds; no adoption.':'This diagnostic does not establish the proposed neural-interference mechanism; do not promote or extend this sample.',completedAt:new Date().toISOString()};
await save('results.json',result);await save('runner.json',{pid:process.pid,status:'complete',completedAt:result.completedAt});console.log(JSON.stringify({directory,phase:'done',interferenceSignal,decision:result.decision}));
