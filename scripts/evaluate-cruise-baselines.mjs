import {World} from '../engine.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {isDeepStrictEqual} from 'node:util';

const referenceDirectory=process.argv[2];
if(!referenceDirectory)throw Error('Provide a frozen cruising-confirmation directory');
const referenceBytes=await readFile(join(referenceDirectory,'protocol.json')),reference=JSON.parse(referenceBytes),parameters=reference.parameters;
if(reference.experiment!=='independent-cruising-confirmation'||parameters.moveMode!=='levels')throw Error('Expected an independent cruising confirmation');
const directory=join(referenceDirectory,'motor-baselines');await mkdir(directory,{recursive:true});
const read=async path=>{try{return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}};
const save=async(name,value)=>{const path=join(directory,name);await writeFile(path+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(path+'.tmp',path);};
async function compare(){
 const baselines=await read(join(directory,'baselines.json'));if(!baselines)throw Error('Motor baselines are not complete');
 const learned=await read(join(referenceDirectory,'heldout.json'));
 if(!learned||learned.length!==reference.seeds.length){console.log(JSON.stringify({directory,status:'baselines-complete-awaiting-parent-outcomes',completedParent:learned?.length||0,total:reference.seeds.length}));return;}
 const rows=baselines.rows.map(row=>{const parent=learned.find(item=>item.seed===row.seed);if(!parent)throw Error('Missing parent seed');for(const arm of Object.values(row.arms))if(arm.founderHash!==parent.arms.learned.founderHash)throw Error('Motor baseline founders differ');return{seed:row.seed,learned:parent.arms.learned,arms:row.arms};});
 const comparisons=Object.fromEntries(Object.keys(rows[0].arms).map(name=>[name,Object.fromEntries(['energy','population'].map(key=>[key,interval95(rows.map(row=>row.learned[key]-row.arms[name][key]))]))]));
 const result={protocol:baselines.protocol,rows,comparisons,completedAt:new Date().toISOString(),interpretation:'Supplemental same-seed comparisons against simple motor policies. These were not part of the original four-control gate and do not change its result. No policy parameters were tuned using these outcomes. Only movement choices are fixed/reflexive; the candidate neural-learning setting is retained.'};
 await save('results.json',result);console.log(JSON.stringify({directory,comparisons},null,2));
}
if(process.argv[3]==='--compare'){await compare();process.exit(0);}
const sourceFiles=['engine.mjs','challenges.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/episodic-actor.mjs','learning/joint-episodic.mjs','learning/tasks.mjs','scripts/evaluate-cruise-baselines.mjs'],sourceSha256={};
for(const file of sourceFiles){sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');if(reference.sourceSha256[file]&&reference.sourceSha256[file]!==sourceSha256[file])throw Error('Frozen policy source changed: '+file);}
let protocol=await read(join(directory,'protocol.json'));
if(protocol){if(!isDeepStrictEqual(protocol.sourceSha256,sourceSha256)||protocol.referenceSha256!==createHash('sha256').update(referenceBytes).digest('hex'))throw Error('Baseline sources or reference changed');}
else{
 protocol={at:new Date().toISOString(),referenceDirectory,referenceSha256:createHash('sha256').update(referenceBytes).digest('hex'),sourceSha256,seeds:reference.seeds,parameters,policies:{alwaysSlow:'Select the lower speed at every decision.',alwaysFast:'Select the higher speed at every decision.',feedReflex:'Select the lower speed after a positive last-step food observation, otherwise the higher speed.'},interpretation:'Supplemental fixed/reflex motor controls on the independent seed set. Disable experience acquisition and force only the movement choice through its exploration RNG; store no synthetic rewards or memories. All world/motor/neural RNG streams begin matched, and the body and energy prices are unchanged. Other candidate neural outputs retain their declared learning setting. This is not a new parameter selection round.'};
 for(const file of sourceFiles){const path=join(directory,'sources',file);await mkdir(dirname(path),{recursive:true});await writeFile(path,await readFile(file));}await save('protocol.json',protocol);
}
const already=await read(join(directory,'baselines.json'));if(already){await compare();process.exit(0);}
const next=state=>{let x=state;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;},forced={};
for(let seed=1;seed<1000000&&Object.keys(forced).length<2;seed++){const a=next(seed),b=next(a);if(a/4294967296<parameters.exploration)forced[b/4294967296<.5?-1:1]??=seed;}
if(!forced[-1]||!forced[1])throw Error('Could not construct both explicit motor choices');
function run(seed,name){
 const world=new World({seed,founders:reference.founders,capacity:240,controller:'episodic-actor',learning:true,actorParameters:reference.actorParameters,episodicParameters:{...parameters,memoryLearning:false},reproduction:false,mutation:false,...reference.environment});
 const founderHash=createHash('sha256').update(JSON.stringify(world.flies.map(({brain,...fly})=>fly))).digest('hex'),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0),behaviour={decisions:0,slowChoices:0,fastChoices:0};
 for(let tick=0;tick<reference.horizonTicks;tick++){
  const choices=[];for(const fly of world.flies)if(fly.brain.episodic.steps%parameters.decisionTicks===0){const choice=name==='alwaysSlow'?-1:name==='alwaysFast'?1:fly.lastFood>0?-1:1;fly.brain.episodic.memory.rngState=forced[choice];choices.push({fly,choice});}
  if(!world.step())break;
  for(const {fly,choice}of choices){if(fly.brain.episodic.lastDecision.choice!==choice||fly.brain.episodic.memory.seen!==0)throw Error('Static motor control failed or acquired memory');behaviour.decisions++;behaviour[choice<0?'slowChoices':'fastChoices']++;}
 }
 if(Math.abs(world.metrics().accountingError)>1e-6)throw Error('Motor baseline energy accounting failed');
 return{seed,founderHash,ticks:world.tick,population:world.flies.length,energy:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/reference.founders,food:world.totals.foodEaten,expenditure:world.totals.dissipated,behaviour};
}
const rows=await read(join(directory,'progress.json'))||[];
for(const seed of reference.seeds){if(rows.some(row=>row.seed===seed))continue;const arms=Object.fromEntries(Object.keys(protocol.policies).map(name=>[name,run(seed,name)]));rows.push({seed,arms});await save('progress.json',rows);console.log(JSON.stringify({directory,completed:rows.length,total:reference.seeds.length}));}
for(const file of sourceFiles)if(createHash('sha256').update(await readFile(file)).digest('hex')!==sourceSha256[file])throw Error('Baseline sources changed during evaluation');
await save('baselines.json',{protocol,rows,completedAt:new Date().toISOString()});await compare();
