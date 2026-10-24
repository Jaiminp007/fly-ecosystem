import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {actorParameters} from '../learning/trace-actor.mjs';
import {TASK_STAGES,evaluateSeeds} from '../learning/tasks.mjs';
import {curriculumRound,passesGate,CURRICULUM_GATE} from '../learning/curriculum.mjs';
const args=process.argv.slice(2),value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const root=resolve(value('--directory','runs/autonomy')),roundLimit=Number(value('--rounds','12'));
if(!Number.isInteger(roundLimit)||roundLimit<1||roundLimit>64)throw Error('Rounds must be 1–64');
await mkdir(root,{recursive:true});
const atomic=async(path,data)=>{await writeFile(path+'.tmp',JSON.stringify(data,null,2)+'\n');await rename(path+'.tmp',path);};
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','learning/tasks.mjs','learning/curriculum.mjs','scripts/autonomous-learning.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
let state;
if(!args.includes('--new'))try{state=JSON.parse(await readFile(join(root,'state.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(state&&JSON.stringify(state.sourceSha256)!==JSON.stringify(sourceSha256))throw Error('Source changed since campaign checkpoint. Start a new campaign; earlier evidence is preserved.');
if(!state||args.includes('--new')){const id=randomUUID(),seedOffset=parseInt(id.slice(0,6),16)%30000*100000;state={schema:1,id,startedAt:new Date().toISOString(),sourceSha256,seedOffset,stage:0,round:0,rngState:parseInt(id.slice(0,8),16)||1,parameters:actorParameters(),proposalScale:.8,promotions:0,history:[],status:'running',protocol:{stages:TASK_STAGES,gates:CURRICULUM_GATE,proposalCount:4,seedPairsPerGate:10,heldoutSeedPairs:30,interpretation:'Engineered sensory traces plus reward-trained readouts. Bounded automated parameter search; no self-written algorithms, RSI, human cognition or biological evolution demonstrated.',references:['https://doi.org/10.1007/BF00992696','https://arxiv.org/abs/1112.5309']}};}
const evidenceRoot=value('--evidence-directory',root===resolve('runs/autonomy')?'evidence/autonomous-learning':join(root,'evidence'));
const evidence=resolve(evidenceRoot,state.id);await mkdir(evidence,{recursive:true});
let stopped=false;process.on('SIGINT',()=>{stopped=true;});process.on('SIGTERM',()=>{stopped=true;});
const start=performance.now(),startRound=state.round,priorWallSeconds=state.wallSeconds||0;
async function save(){
 state.updatedAt=new Date().toISOString();state.wallSeconds=priorWallSeconds+(performance.now()-start)/1000;state.sourceSha256=sourceSha256;
 await atomic(join(root,'state.json'),state);await atomic(join(root,'status.json'),{schema:1,id:state.id,status:state.status,updatedAt:state.updatedAt,stage:state.stage,stageName:TASK_STAGES[state.stage]?.name||'Engineered task curriculum completed',totalStages:TASK_STAGES.length,round:state.round,promotions:state.promotions,parameters:state.parameters,gates:state.protocol.gates,history:state.history.slice(-8),heldout:state.heldout?.map(result=>({stage:result.stage,summary:result.summary})),evidenceDirectory:evidence,...(state.error?{error:state.error}:{}),interpretation:state.protocol.interpretation});
}
try{
 state.status=state.heldout?.length===TASK_STAGES.length?(state.heldout.every(result=>passesGate(result,{heldOut:true}))?'task-milestones-met':'heldout-not-confirmed'):'running';await save();if(process.send)process.send({type:'ready',id:state.id});
 while(!stopped&&state.stage<TASK_STAGES.length&&state.round-startRound<roundLimit){
   console.log(JSON.stringify({round:state.round,stage:TASK_STAGES[state.stage].id,parameters:state.parameters}));
   await curriculumRound(state,{shouldStop:()=>stopped,record:entry=>atomic(join(evidence,`round-${entry.round}.json`),entry)});
   await save();await new Promise(resolve=>setImmediate(resolve));
 }
 if(state.stage===TASK_STAGES.length&&(!state.heldout||state.heldout.length<TASK_STAGES.length)){
   state.status='heldout-evaluation';await save();state.heldout ||= [];
   for(const stage of TASK_STAGES.slice(state.heldout.length)){const seeds=Array.from({length:30},(_,i)=>state.seedOffset+900000+i);state.heldout.push(evaluateSeeds(seeds,stage,state.parameters));await new Promise(resolve=>setImmediate(resolve));if(stopped)break;}
   state.status=state.heldout.length<TASK_STAGES.length?'paused':state.heldout.every(result=>passesGate(result,{heldOut:true}))?'task-milestones-met':'heldout-not-confirmed';
 }else if(stopped)state.status='paused';else if(state.stage<TASK_STAGES.length)state.status='round-budget-reached';
 await save();await atomic(join(evidence,'results.json'),state);
 console.log(JSON.stringify({status:state.status,stagesPassed:state.stage,promotions:state.promotions,parameters:state.parameters,heldout:state.heldout?.map(result=>({stage:result.stage,summary:result.summary}))},null,2));
}catch(error){state.status='error';state.error=error.message;await save();await atomic(join(evidence,'results.json'),state);throw error;}
