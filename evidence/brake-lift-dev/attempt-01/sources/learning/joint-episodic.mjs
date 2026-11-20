import {createActorBrain,learnActor,observeActor,actActor} from './trace-actor.mjs';
import {createEpisodicMemory,episodicFeatures,inspectEpisodic,rememberEpisodic,restoreEpisodicMemory,validateEpisodicTarget} from './episodic.mjs';

export const JOINT_ACTIONS=Object.freeze([
 Object.freeze({id:0,speed:-1,turn:-1}),Object.freeze({id:1,speed:-1,turn:1}),
 Object.freeze({id:2,speed:1,turn:-1}),Object.freeze({id:3,speed:1,turn:1})
]);
const memoryKeys=['capacity','neighbors','bandwidth','maxDistance','exploration','replacement','recencyHalfLife'];
const validFeatures=(features,length)=>Array.isArray(features)&&features.length===length&&features.every(v=>Number.isFinite(v)&&Math.abs(v)<=1.000001);
const action=id=>Number.isInteger(id)&&id>=0&&id<JOINT_ACTIONS.length?JOINT_ACTIONS[id]:undefined;
function random(memory){let x=memory.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;memory.rngState=x>>>0;return memory.rngState/4294967296;}
export function jointFeatures(features,speed){
 if(!validFeatures(features,17)||![-1,1].includes(speed))throw Error('Invalid joint observation/action context');
 // The final coordinate is an ACTION tag, not a sensory observation. Its two
 // values are farther apart than the joint controller's permitted radius.
 return [...features,speed];
}
export function inspectJoint(memory,features){
 if(memory.config.dimensions!==18||memory.config.maxDistance>=2)throw Error('Invalid joint memory domain');
 const slow=inspectEpisodic(memory,jointFeatures(features,-1)),fast=inspectEpisodic(memory,jointFeatures(features,1));
 return{stored:memory.records.length,seen:memory.seen,options:JOINT_ACTIONS.map(a=>({...a,...(a.speed<0?slow:fast)[a.turn<0?'negative':'positive']}))};
}
export function chooseJoint(memory,features,{sample=false,randomTies=true,capture=null}={}){
 const retrieval=inspectJoint(memory,features),explore=sample?random(memory):1,draw=sample?random(memory):0;
 const best=Math.max(...retrieval.options.map(o=>o.estimate)),ties=retrieval.options.filter(o=>o.estimate===best);
 const exploration=sample&&explore<memory.config.exploration,choice=exploration?Math.floor(draw*JOINT_ACTIONS.length):ties[sample&&randomTies?Math.floor(draw*ties.length):0].id;
 const reason=exploration?'exploration':ties.length>1?'tie':'retrieval';
 if(capture)capture({choice,reason,retrieval});return action(choice);
}
export function createJointBrain(genome,seed,p){
 const brain=createActorBrain(genome,seed);
 brain.episodic={schema:2,actuator:'joint',featureMode:p.featureMode,returnMode:'td',bootstrapMode:p.bootstrapMode,moveMode:p.moveMode,turnGain:p.turnGain,...(p.moveMode==='levels'?{speedLevels:[p.slowSpeed,p.fastSpeed]}:{}),steps:0,choice:null,lastCorrection:0,lastMoveCorrection:0,lookupRecordsThisStep:0,pending:[],memory:createEpisodicMemory({...Object.fromEntries(memoryKeys.map(k=>[k,p[k]])),dimensions:18},((seed^0x517a9)>>>0)||1)};
 return brain;
}
function accumulate(state,reward,discount){for(const item of state.pending){item.return+=item.nextDiscount*reward;item.weight+=item.nextDiscount;item.nextDiscount*=discount;item.elapsed++;}}
function store(state,p,items,future,step,terminal=false){
 for(const item of items){
  const target={kind:'td',observed:(1-p.discount)*item.return,estimatedFuture:terminal?0:item.nextDiscount*future,discountPower:item.nextDiscount,horizon:item.elapsed,terminal,...(p.bootstrapMode==='expected'?{bootstrapMode:'expected',exploration:p.exploration}:{})},value=Math.max(-1,Math.min(1,target.observed+target.estimatedFuture));
  const chosen=action(item.choice);rememberEpisodic(state.memory,item.features,chosen.turn,value,target);
  state.lastUpdate={step,choice:item.choice,action:chosen.turn,speed:chosen.speed,value,target:{...target}};
 }
}
export function jointActorStep(genome,brain,inputs,reward,learning,actorParameters,p){
 const s=brain.episodic;s.lookupRecordsThisStep=0;
 if(learning&&p.memoryLearning)accumulate(s,reward,p.discount);else s.pending=[];
 learnActor(genome,brain,reward,learning&&p.neuralLearning,{...actorParameters,plasticOutputs:(actorParameters.plasticOutputs??31)&~3});
 observeActor(genome,brain,inputs,actorParameters);const outputs=actActor(genome,brain,{parameters:actorParameters});
 if(s.pending.some(item=>item.elapsed>=p.creditTicks)){
  const features=episodicFeatures(genome,brain,p.featureMode),r=inspectJoint(s.memory,features);s.lookupRecordsThisStep+=2*s.memory.records.length;
  const maximum=Math.max(...r.options.map(o=>o.estimate)),future=p.bootstrapMode==='expected'?(1-p.exploration)*maximum+p.exploration*r.options.reduce((sum,o)=>sum+o.estimate,0)/r.options.length:maximum;
  store(s,p,s.pending.filter(item=>item.elapsed>=p.creditTicks),future,s.steps+1);s.pending=s.pending.filter(item=>item.elapsed<p.creditTicks);
 }
 if(s.steps%p.decisionTicks===0){
  const features=episodicFeatures(genome,brain,p.featureMode);s.lookupRecordsThisStep+=2*s.memory.records.length;
  const chosen=chooseJoint(s.memory,features,{sample:true,capture:d=>{s.lastDecision={step:s.steps+1,actuator:'joint',returnMode:'td',bootstrapMode:p.bootstrapMode,features:[...features],...d};}});s.choice=chosen.id;
  if(learning&&p.memoryLearning)s.pending.push({choice:chosen.id,features:jointFeatures(features,chosen.speed),return:0,weight:0,nextDiscount:1,elapsed:0});
 }
 const chosen=action(s.choice),baseTurn=outputs[0],baseMove=outputs[1];outputs[0]=Math.max(-1,Math.min(1,baseTurn+p.turnGain*chosen.turn));outputs[1]=p.moveMode==='levels'?2*(chosen.speed<0?p.slowSpeed:p.fastSpeed)-1:Math.max(-1,Math.min(1,baseMove+p.moveGain*chosen.speed));
 s.lastCorrection=outputs[0]-baseTurn;s.lastMoveCorrection=outputs[1]-baseMove;brain.activity[genome.actor.inputs]=outputs[0];brain.activity[genome.actor.inputs+1]=outputs[1];s.steps++;return outputs;
}
export function finishJointTerminal(brain,reward,learning,p){
 const s=brain.episodic;if(!learning||!p.memoryLearning)return;accumulate(s,reward,p.discount);store(s,p,s.pending,0,s.steps,true);s.pending=[];
}
export function validateJointBrain(brain,p){
 const s=brain?.episodic;
 if(s?.schema!==2||s.actuator!=='joint'||s.returnMode!=='td'||s.featureMode!==p.featureMode||s.bootstrapMode!==p.bootstrapMode||s.moveMode!==p.moveMode||s.turnGain!==p.turnGain||!Number.isSafeInteger(s.steps)||s.steps<0||s.steps!==brain.actor?.steps||(s.steps===0?s.choice!==null:!action(s.choice)))throw Error('Invalid joint actor state');
 if(!Number.isInteger(s.lookupRecordsThisStep)||s.lookupRecordsThisStep<0||s.lookupRecordsThisStep>4*p.capacity||!Number.isFinite(s.lastCorrection)||Math.abs(s.lastCorrection)>p.turnGain+1e-9||!Number.isFinite(s.lastMoveCorrection)||Math.abs(s.lastMoveCorrection)>(p.moveMode==='levels'?2:p.moveGain)+1e-9)throw Error('Invalid joint executed outputs');
 if(p.moveMode==='levels'&&(!Array.isArray(s.speedLevels)||s.speedLevels.length!==2||s.speedLevels[0]!==p.slowSpeed||s.speedLevels[1]!==p.fastSpeed))throw Error('Joint speed levels mismatch');
 const memory=restoreEpisodicMemory(s.memory);if(memory.config.dimensions!==18||memory.config.maxDistance>=2||memoryKeys.some(k=>memory.config[k]!==p[k]))throw Error('Joint memory configuration mismatch');
 const checkTarget=(target,value)=>{validateEpisodicTarget(target,value);if(target.horizon>p.creditTicks||Math.abs(target.discountPower-p.discount**target.horizon)>1e-9||(target.bootstrapMode??'greedy')!==p.bootstrapMode||p.bootstrapMode==='expected'&&target.exploration!==p.exploration)throw Error('Joint target policy mismatch');};
 if(new Set(memory.records.map(r=>r.experience)).size!==memory.records.length)throw Error('Duplicate joint experience IDs');
 for(const r of memory.records){if(!Number.isSafeInteger(r.experience)||r.experience<1||r.experience>memory.seen||![-1,1].includes(r.features[17])||r.risk!==undefined)throw Error('Invalid joint action tag');checkTarget(r.target,r.reward);}
 if(!Array.isArray(s.pending)||s.pending.length>1)throw Error('Invalid joint credit queue');
 for(const item of s.pending){if(!action(item.choice)||!validFeatures(item.features,18)||item.features[17]!==action(item.choice).speed||!Number.isInteger(item.elapsed)||item.elapsed<0||item.elapsed>=p.creditTicks||!Number.isFinite(item.return)||!Number.isFinite(item.weight)||item.weight<0||Math.abs(item.return)>item.weight+1e-9||!Number.isFinite(item.nextDiscount)||Math.abs(item.nextDiscount-p.discount**item.elapsed)>1e-9||Math.abs(item.weight-(1-p.discount**item.elapsed)/(1-p.discount))>1e-9)throw Error('Invalid joint credit item');}
 if(s.lastUpdate){const u=s.lastUpdate;if(!Number.isSafeInteger(u.step)||u.step<1||u.step>s.steps||!action(u.choice)||u.action!==action(u.choice).turn||u.speed!==action(u.choice).speed)throw Error('Invalid joint value update');checkTarget(u.target,u.value);}
 if(s.lastDecision){
  const d=s.lastDecision,r=d.retrieval;if(d.actuator!=='joint'||d.returnMode!=='td'||d.bootstrapMode!==p.bootstrapMode||!Number.isSafeInteger(d.step)||d.step<1||d.step>s.steps||s.steps-d.step>=p.decisionTicks||d.choice!==s.choice||!['tie','exploration','retrieval'].includes(d.reason)||!validFeatures(d.features,17)||!Number.isInteger(r?.stored)||r.stored<0||r.stored>p.capacity||!Number.isSafeInteger(r.seen)||r.seen<r.stored||r.seen>memory.seen||!Array.isArray(r.options)||r.options.length!==4)throw Error('Invalid joint decision');
  for(let i=0;i<4;i++){const o=r.options[i],a=action(i);if(o.id!==i||o.turn!==a.turn||o.speed!==a.speed||!Number.isFinite(o.estimate)||Math.abs(o.estimate)>1.000001||!Array.isArray(o.neighbors)||o.neighbors.length>p.neighbors)throw Error('Invalid joint action estimate');for(const n of o.neighbors){if(!Number.isInteger(n.index)||n.index<0||n.index>=r.stored||!Number.isSafeInteger(n.experience)||n.experience<1||n.experience>r.seen||n.action!==a.turn||!validFeatures(n.features,18)||n.features[17]!==a.speed||!Number.isFinite(n.distance)||n.distance<0||n.distance>p.maxDistance+1e-9||n.risk!==undefined)throw Error('Invalid joint recalled experience');checkTarget(n.target,n.reward);}}
 }else if(s.steps>0)throw Error('Missing joint decision');
}
