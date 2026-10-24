import {World,RNG,INPUTS} from '../engine.mjs';
import {actorParameters,installActorGenome,createActorBrain,clearActorActivity,observeActor,actActor,learnActor} from './trace-actor.mjs';
export const TASK_STAGES=Object.freeze([
 {id:'cue',name:'Learn an unknown food cue',trainTrials:128,testTrials:96,trainDelay:[3,8],testDelay:[10,16],noise:0,distractors:0},
 {id:'memory',name:'Remember through a longer delay',trainTrials:160,testTrials:96,trainDelay:[10,24],testDelay:[28,48],noise:.005,distractors:0},
 {id:'distraction',name:'Retain a cue through distractions',trainTrials:192,testTrials:96,trainDelay:[20,45],testDelay:[50,80],noise:.01,distractors:3},
 {id:'long-memory',name:'Longer noisy memory',trainTrials:256,testTrials:96,trainDelay:[40,70],testDelay:[85,140],noise:.025,distractors:5}
]);
export function interval95(values){const n=values.length,mean=values.reduce((a,b)=>a+b,0)/n;if(n<2)return{mean,ci95:[null,null],n};const sd=Math.sqrt(values.reduce((sum,x)=>sum+(x-mean)**2,0)/(n-1)),t=n>=30?2.045:n>=20?2.093:n>=10?2.262:3.182,half=t*sd/Math.sqrt(n);return{mean,ci95:[mean-half,mean+half],n};}
function schedule(seed,count,range,noise,distractors){
  const rng=new RNG(seed),rows=[];
  for(let i=0;i<count;i++){const side=rng.next()<.5?-1:1,delay=Math.floor(rng.range(range[0],range[1]+1)),amplitude=rng.range(.45,1);
    const gap=Array.from({length:delay},(_,tick)=>{const values=Array(INPUTS.length).fill(0);if(noise){values[1]=rng.normal()*noise;values[2]=rng.normal()*noise;}if(distractors&&tick%Math.max(1,Math.floor(delay/distractors))===0)values[[0,3,5,6,9,10,11,12,13][Math.floor(rng.next()*9)]]=rng.range(-1,1);return values;});
    rows.push({side,amplitude,gap});
  }return rows;
}
function trial(genome,brain,row,mapping,params,{training=false,learning=true,resetAtChoice=false}={}){
  clearActorActivity(genome,brain);
  const cue=Array(INPUTS.length).fill(0);cue[row.side<0?1:2]=row.amplitude;
  for(let i=0;i<4;i++)observeActor(genome,brain,cue,params);
  for(const values of row.gap)observeActor(genome,brain,values,params);
  if(resetAtChoice)clearActorActivity(genome,brain);
  observeActor(genome,brain,Array(INPUTS.length).fill(0),params);
  const output=actActor(genome,brain,{mode:'binary',sample:training,channels:[0],parameters:params})[0],correct=output===row.side*mapping;
  if(training)learnActor(genome,brain,correct?1:-1,learning,params);
  return Number(correct);
}
export function evaluateSeed(seed,stage,parameters={},arms=['learned','frozen','reset','memory-reset','reflex']){
  const params=actorParameters(parameters),world=new World({seed,founders:2,capacity:2,mutation:false,seasonal:false});
  const genome=installActorGenome(world.flies[0].genome,{scaffold:false,parameters:params});
  const training=schedule(seed^0x17a71,stage.trainTrials,stage.trainDelay,stage.noise,stage.distractors);
  const heldout=schedule(seed^0x79abc,stage.testTrials,stage.testDelay,stage.noise,stage.distractors);
  // Balanced, preassigned task rules across consecutive seed IDs. No rule label enters the controller.
  const mapping=seed%2===0?1:-1,results={};
  for(const arm of arms){
    let brain=createActorBrain(genome,seed^0x51f15e);
    if(arm==='reflex')for(let i=0;i<genome.edges.length;i++){const edge=genome.edges[i];if(edge.to===17&&edge.from===40)brain.plastic[i]=-2;if(edge.to===17&&edge.from===41)brain.plastic[i]=2;}
    for(const row of training)trial(genome,brain,row,mapping,params,{training:true,learning:!['frozen','reflex'].includes(arm)});
    if(arm==='reset')brain=createActorBrain(genome,seed^0x51f15e);
    const scores=heldout.map(row=>trial(genome,brain,row,mapping,params,{resetAtChoice:arm==='memory-reset'}));
    results[arm]={successes:scores.reduce((a,b)=>a+b,0),trials:scores.length,accuracy:scores.reduce((a,b)=>a+b,0)/scores.length};
  }
  return{seed,mapping,stage:stage.id,arms:results};
}
export function evaluateSeeds(seeds,stage,parameters={},arms){
  const rows=seeds.map(seed=>evaluateSeed(seed,stage,parameters,arms)),compare=arm=>interval95(rows.map(row=>row.arms.learned.accuracy-row.arms[arm].accuracy));
  const summary={learned:interval95(rows.map(row=>row.arms.learned.accuracy))};
  for(const arm of Object.keys(rows[0].arms).filter(arm=>arm!=='learned'))summary[`learnedMinus${arm}`]=compare(arm);
  return{stage:stage.id,parameters:actorParameters(parameters),rows,summary};
}
