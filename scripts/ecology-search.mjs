import {World,RNG} from '../engine.mjs';
import {actorParameters,ACTOR_BOUNDS} from '../learning/trace-actor.mjs';
import {TASK_STAGES,evaluateSeeds,interval95} from '../learning/tasks.mjs';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const args=process.argv.slice(2),value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const root=resolve(value('--directory','runs/autonomy')),directory=join(root,'ecology'),rounds=Number(value('--rounds','2'));
if(!Number.isInteger(rounds)||rounds<1||rounds>64)throw Error('Rounds must be 1–64');
const stages=[{id:'scarcity',nutrient:.4,ecology:'baseline'},{id:'relocation',nutrient:.4,ecology:'relocation'},{id:'severe-relocation',nutrient:.2,ecology:'relocation'}];
const atomic=async(path,body)=>{await writeFile(path+'.tmp',JSON.stringify(body,null,2)+'\n');await rename(path+'.tmp',path);};
await mkdir(directory,{recursive:true});
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','scripts/ecology-search.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
let state;
if(!args.includes('--new'))try{state=JSON.parse(await readFile(join(directory,'state.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(state&&JSON.stringify(state.sourceSha256)!==JSON.stringify(sourceSha256))throw Error('Ecology search source changed. Start a new campaign; earlier evidence is preserved.');
if(!state||args.includes('--new')){
 const cue=JSON.parse(await readFile(join(root,'state.json'),'utf8'));
 for(const file of ['engine.mjs','learning/trace-actor.mjs'])if(cue.sourceSha256[file]!==sourceSha256[file])throw Error('Reevaluate the cue curriculum after model-source changes before ecology search.');
 if(cue.status!=='task-milestones-met')throw Error('Complete the independent engineered-task gates before ecology search.');
 const id=randomUUID(),seedOffset=parseInt(id.slice(0,6),16)%25000*100000;
 state={schema:1,id,parentCueCampaign:cue.id,sourceSha256,seedOffset,parameters:actorParameters(cue.parameters),round:0,stage:0,history:[],promotions:0,rngState:parseInt(id.slice(0,8),16)||1,status:'running',protocol:{stages,horizonTicks:1800,founders:24,developmentSeeds:6,validationSeeds:20,primary:'Net energy per founder at 180 seconds',promotion:'Candidate minus incumbent lower 95% seed-paired interval > 0.5 energy per founder; retained long-memory task accuracy >= .9',difficultyGate:'Candidate learning minus disabled-from-birth lower 95% interval > 0; no mean population regression',interpretation:'Bounded parameter search in the ecological world. This can improve settings without establishing lifetime learning; the separate learning-off comparison is required before increasing difficulty.'}};
}
const evidenceRoot=value('--evidence-directory',root===resolve('runs/autonomy')?'evidence/ecology-search':join(directory,'evidence'));
const evidence=resolve(evidenceRoot,state.id);await mkdir(evidence,{recursive:true});
let stopped=false;process.on('SIGINT',()=>{stopped=true;});process.on('SIGTERM',()=>{stopped=true;});
const pause=()=>new Promise(resolve=>setImmediate(resolve)),seeds=(offset,count)=>Array.from({length:count},(_,i)=>offset+i);
async function evaluate(parameters,seedList,environment,learning=true){
 const rows=[];
 for(const seed of seedList){
  if(stopped)break;
  const world=new World({seed,founders:24,capacity:240,controller:'trace-actor',actorParameters:parameters,learning,mutation:false,reproduction:false,challenges:'off',seasonal:false,nutrient:environment.nutrient,ecology:environment.ecology});
  const founders=createHash('sha256').update(JSON.stringify(world.flies)).digest('hex'),initial=world.flies.reduce((sum,fly)=>sum+fly.energy,0);
  let agentTicks=0,feedingTicks=0;const actionSums=Array(5).fill(0);
  for(let tick=0;tick<1800&&world.step();tick++)for(const fly of world.flies){agentTicks++;if(fly.lastFood>0)feedingTicks++;fly.lastActions.forEach((action,index)=>actionSums[index]+=action);}
  rows.push({seed,founders,ticks:world.tick,netEnergyPerFounder:(world.flies.reduce((sum,fly)=>sum+fly.energy,0)-initial)/24,population:world.flies.length,foodEaten:world.totals.foodEaten,energySpent:world.totals.dissipated,feedingFraction:feedingTicks/Math.max(1,agentTicks),meanActions:actionSums.map(sum=>sum/Math.max(1,agentTicks)),accountingResidual:world.metrics().accountingError});await pause();
 }
 return {parameters,learning,rows,score:rows.length?interval95(rows.map(row=>row.netEnergyPerFounder)):null};
}
function paired(a,b){if(a.rows.length!==b.rows.length)throw Error('Partial comparison');return interval95(a.rows.map((row,index)=>{if(row.seed!==b.rows[index].seed)throw Error('Unmatched seed order');return row.netEnergyPerFounder-b.rows[index].netEnergyPerFounder;}));}
async function save(){state.updatedAt=new Date().toISOString();await atomic(join(directory,'state.json'),state);await atomic(join(directory,'status.json'),{id:state.id,status:state.status,stage:state.stage,stageName:stages[state.stage]?.id||'Ecology stages passed',round:state.round,promotions:state.promotions,parameters:state.parameters,history:state.history.slice(-5),...(state.error?{error:state.error}:{}),protocol:state.protocol});}
try{
 state.status='running';await save();if(process.send)process.send({type:'ready',id:state.id});
 const startRound=state.round;
 while(!stopped&&state.stage<stages.length&&state.round-startRound<rounds){
  const round=state.round++,environment=stages[state.stage],offset=state.seedOffset+round*100;
  const rng=new RNG(state.rngState),candidates=[state.parameters];
  // One parameter changes per proposal, so every intervention is attributable.
  for(const[key,[min,max]]of Object.entries(ACTOR_BOUNDS)){
   // Architecture changes have their own fixed qualification study; do not
   // add an implicit proposal or consume RNG in existing search campaigns.
   if(key==='traceNormalization')continue;
   const proposal={...state.parameters};
   if(key==='plasticOutputs')proposal[key]=rng.pick([1,3,7,15,31]);
   else if(key==='traceRetention')proposal[key]=1-(1-proposal[key])*Math.exp(rng.normal()*.7);
   else if(key==='eligibilityDecay')proposal[key]+=rng.normal()*.2;
   else proposal[key]*=Math.exp(rng.normal()*.8);
   proposal[key]=Math.max(min,Math.min(max,proposal[key]));candidates.push(actorParameters(proposal));
  }
  state.rngState=rng.state;
  const entry={round,environment,parametersBefore:state.parameters,development:[],promoted:false,stagePassed:false};
  let best={parameters:state.parameters,score:-Infinity};
  for(const parameters of candidates){const result=await evaluate(parameters,seeds(offset+10000,6),environment);entry.development.push(result);if(stopped)break;if(result.score.mean>best.score)best={parameters,score:result.score.mean};}
  if(!stopped){
   const validation=seeds(offset+50000,20),candidate=await evaluate(best.parameters,validation,environment),incumbent=await evaluate(state.parameters,validation,environment),frozen=await evaluate(best.parameters,validation,environment,false);
   if(!stopped){
    if(candidate.rows.some((row,index)=>row.founders!==frozen.rows[index].founders))throw Error('Learning control founders did not match');
    const improvement=paired(candidate,incumbent),learningGain=paired(candidate,frozen),retained=evaluateSeeds(seeds(offset+70000,10),TASK_STAGES.at(-1),best.parameters,['learned']);
    entry.validation={candidate,incumbent,frozen,improvement,learningGain,retainedCueAccuracy:retained.summary.learned};
    if(improvement.ci95[0]>.5&&retained.summary.learned.ci95[0]>=.9){state.parameters=best.parameters;state.promotions++;entry.promoted=true;}
    const evaluatedCurrent=entry.promoted||JSON.stringify(best.parameters)===JSON.stringify(state.parameters);
    if(evaluatedCurrent&&learningGain.ci95[0]>0&&candidate.rows.reduce((sum,row,index)=>sum+row.population-frozen.rows[index].population,0)>=0){state.stage++;entry.stagePassed=true;}
   }
  }
  state.history.push({round,environment:environment.id,promoted:entry.promoted,stagePassed:entry.stagePassed,parameters:state.parameters,...(entry.validation?{improvement:entry.validation.improvement,learningGain:entry.validation.learningGain}:{})});
  await atomic(join(evidence,`round-${round}.json`),entry);await save();console.log(JSON.stringify(state.history.at(-1)));await pause();
 }
 state.status=stopped?'paused':state.stage===stages.length?'ecology-gates-met':'round-budget-reached';await save();await atomic(join(evidence,'results.json'),state);
}catch(error){state.status='error';state.error=error.message;await save();await atomic(join(evidence,'results.json'),state);throw error;}
