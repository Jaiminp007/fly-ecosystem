import {World,RNG,INPUTS} from '../engine.mjs';
import {actorParameters,installActorGenome,createActorBrain,clearActorActivity,observeActor,actActor,learnActor} from './trace-actor.mjs';
import {interval95} from './tasks.mjs';
import {createEpisodicMemory,episodicFeatures,chooseEpisodic,rememberEpisodic,inspectEpisodic} from './episodic.mjs';
import {chooseJoint,inspectJoint,jointFeatures} from './joint-episodic.mjs';

export const CONTEXT_PROTOCOL=Object.freeze({version:2,cueTicks:1,trainTrialsPerContext:256,mixedTrainingTrials:512,testTrialsPerContext:96,trainDelay:[30,70],testDelay:[80,130],trainAmplitude:[.7,1],testAmplitude:[.45,.7],noise:.01,cueChannels:[1,2],contextChannels:[12,13],interpretation:'The same left/right sensory cue requires opposite actions in two explicitly observed contexts. Cue and context disappear before the choice. Train A, train B without clearing acquired state, then measure forgetting. A later mixed-training phase separately diagnoses representational capacity; it cannot rescue a failed sequential-retention claim. Version 2 presents cues once to avoid saturating traces across the amplitude range.'});
function schedule(seed,count,range,amplitudes,context=null){
 const rng=new RNG(seed);
 return Array.from({length:count},(_,index)=>({context:context??(index%2),side:(Math.floor(index/2)%2)*2-1,amplitude:rng.range(...amplitudes),contextAmplitude:rng.range(...amplitudes),noise:Array.from({length:Math.floor(rng.range(range[0],range[1]+1))},()=>Array.from({length:4},()=>rng.normal()*CONTEXT_PROTOCOL.noise))}));
}
function trial(genome,brain,row,mapping,parameters,{training=false,learning=true,contextReset=false,memoryReset=false,memory=null,capture=null,featureMode='slow',joint=false}={}){
 const p=CONTEXT_PROTOCOL;clearActorActivity(genome,brain);
 const cue=Array(INPUTS.length).fill(0);cue[p.cueChannels[row.side<0?0:1]]=row.amplitude;cue[p.contextChannels[row.context]]=row.contextAmplitude;
 for(let i=0;i<p.cueTicks;i++)observeActor(genome,brain,cue,parameters);
 for(const noise of row.noise){const inputs=Array(INPUTS.length).fill(0);[...p.cueChannels,...p.contextChannels].forEach((channel,index)=>{inputs[channel]=noise[index];});observeActor(genome,brain,inputs,parameters);}
 if(memoryReset)clearActorActivity(genome,brain);
 if(contextReset)for(const node of genome.nodes)if(p.contextChannels.includes(node.channel))brain.activity[node.id]=0;
 observeActor(genome,brain,Array(INPUTS.length).fill(0),parameters);
 const features=memory?episodicFeatures(genome,brain,featureMode):null;
 const jointChoice=memory&&joint?chooseJoint(memory,features,{sample:training}):null;
 const choice=jointChoice?jointChoice.turn:memory?chooseEpisodic(memory,features,{sample:training}):actActor(genome,brain,{mode:'binary',sample:training,channels:[0],parameters})[0],correct=Number(choice===row.side*mapping*(row.context===0?1:-1));
 if(capture&&memory)capture({cue:{side:row.side,context:row.context,amplitude:row.amplitude,contextAmplitude:row.contextAmplitude},delayTicks:row.noise.length,features,choice,...(jointChoice?{jointChoice}:{}),reward:correct?1:-1,retrieval:joint?inspectJoint(memory,features):inspectEpisodic(memory,features)});
 if(training){if(memory){if(learning)rememberEpisodic(memory,jointChoice?jointFeatures(features,jointChoice.speed):features,choice,correct?1:-1);}else learnActor(genome,brain,correct?1:-1,learning,parameters);}
 return correct;
}
export function evaluateContextSeed(seed,values={},buildGenome=genome=>genome,memoryOptions=null,{captureLimit=0}={}){
 const parameters=actorParameters(values),p=CONTEXT_PROTOCOL;
 const donor=new World({seed,founders:2,capacity:2,mutation:false,seasonal:false}).flies[0].genome;
 const genome=buildGenome(installActorGenome(donor,{scaffold:false,parameters}),seed);
 const data={a:schedule(seed^0x71051,p.trainTrialsPerContext,p.trainDelay,p.trainAmplitude,0),b:schedule(seed^0x34157,p.trainTrialsPerContext,p.trainDelay,p.trainAmplitude,1),mixed:schedule(seed^0x77411,p.mixedTrainingTrials,p.trainDelay,p.trainAmplitude),test:schedule(seed^0x67193,p.testTrialsPerContext*2,p.testDelay,p.testAmplitude)};
 // Shuffle each prebalanced training block; a periodic schedule must not reveal the answer.
 for(const key of ['a','b','mixed']){const rng=new RNG(seed^key.charCodeAt(0));for(let i=data[key].length-1;i>0;i--){const j=Math.floor(rng.next()*(i+1));[data[key][i],data[key][j]]=[data[key][j],data[key][i]];}}
 const mapping=seed%2===0?1:-1,arms={},decisions=[];let checkpoint;
 const {featureMode='slow',joint=false,...baseMemoryConfig}=memoryOptions||{};
 if(typeof joint!=='boolean')throw Error('Invalid context action domain');
 const memoryConfig={...baseMemoryConfig,...(joint?{dimensions:18}:{})};
 const execute=(brain,row,options={})=>trial(genome,brain,row,mapping,parameters,{...options,featureMode,joint});
 const score=(brain,options={})=>{const rows=data.test.map(row=>({context:row.context,correct:execute(brain,row,options)}));return{a:rows.filter(row=>row.context===0).reduce((sum,row)=>sum+row.correct,0)/p.testTrialsPerContext,b:rows.filter(row=>row.context===1).reduce((sum,row)=>sum+row.correct,0)/p.testTrialsPerContext,combined:rows.reduce((sum,row)=>sum+row.correct,0)/rows.length};};
 for(const learning of [true,false]){
  const brain=createActorBrain(genome,seed^0x47151);
  const memory=memoryOptions?createEpisodicMemory(memoryConfig,((seed^0x7415a)>>>0)||1):null;
  for(const row of data.a)execute(brain,row,{training:true,learning,memory});
  const beforeB=score(structuredClone(brain),{memory:structuredClone(memory)});
  for(const row of data.b)execute(brain,row,{training:true,learning,memory});
  if(learning&&captureLimit&&memory)checkpoint={brain:structuredClone(brain),memory:structuredClone(memory),genome:structuredClone(genome)};
  const afterB=score(structuredClone(brain),{memory:structuredClone(memory),...(learning&&captureLimit?{capture:decision=>{if(decisions.length<captureLimit)decisions.push(decision);}}:{})});
  for(const row of data.mixed)execute(brain,row,{training:true,learning,memory});
  arms[learning?'learned':'frozen']={beforeB,afterB,afterMixed:score(structuredClone(brain),{memory:structuredClone(memory)}),...(memory?{storedExperiences:memory.records.length,experiencesSeen:memory.seen,memoryBytes:new TextEncoder().encode(JSON.stringify(memory)).length}:{})};
  if(learning){
   arms.reset={afterMixed:score(createActorBrain(genome,seed^0x47151),{memory:memoryOptions?createEpisodicMemory(memoryConfig,((seed^0x7415a)>>>0)||1):null})};
   arms.memoryReset={afterMixed:score(structuredClone(brain),{memoryReset:true,memory:structuredClone(memory)})};
   arms.contextReset={afterMixed:score(structuredClone(brain),{contextReset:true,memory:structuredClone(memory)})};
  }
 }
 return{seed,mapping,neurons:genome.nodes.length,connections:genome.edges.length,arms,...(captureLimit?{decisions,checkpoint}:{})};
}
export function evaluateContext(seeds,parameters={},buildGenome,memoryOptions=null){
 const rows=seeds.map(seed=>evaluateContextSeed(seed,parameters,buildGenome,memoryOptions));
 const summary={aBeforeB:interval95(rows.map(row=>row.arms.learned.beforeB.a)),aAfterB:interval95(rows.map(row=>row.arms.learned.afterB.a)),bAfterB:interval95(rows.map(row=>row.arms.learned.afterB.b)),aRetentionChange:interval95(rows.map(row=>row.arms.learned.afterB.a-row.arms.learned.beforeB.a)),afterMixed:interval95(rows.map(row=>row.arms.learned.afterMixed.combined)),controls:Object.fromEntries(['frozen','reset','memoryReset','contextReset'].map(arm=>[arm,interval95(rows.map(row=>row.arms.learned.afterMixed.combined-row.arms[arm].afterMixed.combined))]))};
 return{protocol:memoryOptions?.joint?{...CONTEXT_PROTOCOL,memoryActionDomain:'speed-conditioned-turn',featureDimensions:18,actionCount:4,interpretation:CONTEXT_PROTOCOL.interpretation+' Joint-memory component: reward depends on the executed turn, with a freely chosen speed tag. This checks four-choice retrieval/retention, not coordination or survival in the habitat.'}:CONTEXT_PROTOCOL,parameters:actorParameters(parameters),rows,summary};
}
