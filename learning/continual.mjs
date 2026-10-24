import {World,RNG,INPUTS} from '../engine.mjs';
import {actorParameters,installActorGenome,createActorBrain,clearActorActivity,observeActor,actActor,learnActor} from './trace-actor.mjs';
import {interval95} from './tasks.mjs';

export const CONTINUAL_PROTOCOL=Object.freeze({trainTrialsPerTask:256,testTrialsPerTask:96,trainDelay:[30,70],testDelay:[80,130],noise:.015,taskAChannels:[1,2],taskBChannels:[7,8],interpretation:'Sequential acquisition of two unknown cue associations on disjoint sensory channels in one lifetime. Acquired weights persist from A to B. Activity/eligibility reset between episodes. This tests limited skill retention with engineered traces; it does not establish general continual learning or ecological transfer.'});
function schedule(seed,count,delayRange){
 const rng=new RNG(seed);return Array.from({length:count},()=>({side:rng.next()<.5?-1:1,amplitude:rng.range(.45,1),noise:Array.from({length:Math.floor(rng.range(delayRange[0],delayRange[1]+1))},()=>[rng.normal()*CONTINUAL_PROTOCOL.noise,rng.normal()*CONTINUAL_PROTOCOL.noise])}));
}
function trial(genome,brain,row,channels,mapping,parameters,{training=false,learning=true,memoryReset=false}={}){
 clearActorActivity(genome,brain);
 const cue=Array(INPUTS.length).fill(0);cue[channels[row.side<0?0:1]]=row.amplitude;
 for(let i=0;i<4;i++)observeActor(genome,brain,cue,parameters);
 for(const noise of row.noise){const observation=Array(INPUTS.length).fill(0);channels.forEach((channel,index)=>{observation[channel]=noise[index];});observeActor(genome,brain,observation,parameters);}
 if(memoryReset)clearActorActivity(genome,brain);
 observeActor(genome,brain,Array(INPUTS.length).fill(0),parameters);
 const action=actActor(genome,brain,{mode:'binary',sample:training,channels:[0],parameters})[0],correct=Number(action===row.side*mapping);
 if(training)learnActor(genome,brain,correct?1:-1,learning,parameters);
 return correct;
}
export function evaluateContinualSeed(seed,values={}){
 const parameters=actorParameters(values),protocol=CONTINUAL_PROTOCOL;
 const world=new World({seed,founders:2,capacity:2,mutation:false,seasonal:false});
 const genome=installActorGenome(world.flies[0].genome,{scaffold:false,parameters});
 const data={trainA:schedule(seed^0x13579,protocol.trainTrialsPerTask,protocol.trainDelay),trainB:schedule(seed^0x2468a,protocol.trainTrialsPerTask,protocol.trainDelay),testA:schedule(seed^0x6741b,protocol.testTrialsPerTask,protocol.testDelay),testB:schedule(seed^0x513a7,protocol.testTrialsPerTask,protocol.testDelay)};
 const mapping=seed%2===0?1:-1,arms={};
 const score=(brain,key,channels,rule,memoryReset=false)=>data[key].reduce((sum,row)=>sum+trial(genome,brain,row,channels,rule,parameters,{memoryReset}),0)/data[key].length;
 for(const learning of [true,false]){
  const brain=createActorBrain(genome,seed^0x15a17);
  for(const row of data.trainA)trial(genome,brain,row,protocol.taskAChannels,mapping,parameters,{training:true,learning});
  const aBefore=score(brain,'testA',protocol.taskAChannels,mapping);
  for(const row of data.trainB)trial(genome,brain,row,protocol.taskBChannels,-mapping,parameters,{training:true,learning});
  const aAfter=score(brain,'testA',protocol.taskAChannels,mapping),bAfter=score(brain,'testB',protocol.taskBChannels,-mapping);
  arms[learning?'learned':'frozen']={aBefore,aAfter,bAfter};
  if(learning){
   const reset=createActorBrain(genome,seed^0x15a17),memoryReset=structuredClone(brain);
   arms.reset={aAfter:score(reset,'testA',protocol.taskAChannels,mapping),bAfter:score(reset,'testB',protocol.taskBChannels,-mapping)};
   arms.memoryReset={aAfter:score(memoryReset,'testA',protocol.taskAChannels,mapping,true),bAfter:score(memoryReset,'testB',protocol.taskBChannels,-mapping,true)};
  }
 }
 return{seed,mappingA:mapping,mappingB:-mapping,arms};
}
export function evaluateContinual(seeds,parameters={}){
 const rows=seeds.map(seed=>evaluateContinualSeed(seed,parameters));
 return{protocol:CONTINUAL_PROTOCOL,parameters:actorParameters(parameters),rows,summary:{aBefore:interval95(rows.map(row=>row.arms.learned.aBefore)),aAfter:interval95(rows.map(row=>row.arms.learned.aAfter)),bAfter:interval95(rows.map(row=>row.arms.learned.bAfter)),aRetentionChange:interval95(rows.map(row=>row.arms.learned.aAfter-row.arms.learned.aBefore)),comparisons:Object.fromEntries(['frozen','reset','memoryReset'].map(arm=>[arm,Object.fromEntries(['aAfter','bAfter'].map(key=>[key,interval95(rows.map(row=>row.arms.learned[key]-row.arms[arm][key]))]))]))}};
}
