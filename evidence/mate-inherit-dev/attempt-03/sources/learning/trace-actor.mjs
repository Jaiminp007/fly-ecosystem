// Experimental compact controller with explicit sensory traces and a stochastic readout.
// This is engineered working-memory scaffolding, not a biological connectome or RSI.
export const ACTOR_DEFAULTS=Object.freeze({learningScale:2,traceRetention:.985,eligibilityDecay:.7,exploration:.3});
export const ACTOR_BOUNDS=Object.freeze({learningScale:[.1,12],traceRetention:[.8,.9995],eligibilityDecay:[0,.99],exploration:[.05,1],plasticOutputs:[1,31],traceNormalization:[0,1]});
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
// Genomes are inherited immutable topology during a lifetime. Keep this derived
// topology outside checkpoints; preserve edge order and arithmetic exactly.
const incomingCache=new WeakMap();
function hiddenIncoming(genome){
  let cached=incomingCache.get(genome);
  if(!cached||cached.nodeCount!==genome.nodes.length||cached.edgeCount!==genome.edges.length){
    const incoming=new Map(genome.nodes.filter(node=>node.kind==='hidden'&&!node.memory).map(node=>[node.id,[]]));
    for(let index=0;index<genome.edges.length;index++)incoming.get(genome.edges[index].to)?.push(index);
    const hidden=genome.nodes.filter(node=>node.kind==='hidden').map(node=>({node,incoming:node.memory?null:incoming.get(node.id).map(index=>({edge:genome.edges[index],index}))})),features=genome.nodes.filter(node=>node.kind!=='output'),outputEdges=[],otherEdges=[];
    for(let index=0;index<genome.edges.length;index++){const edge=genome.edges[index],output=edge.to-genome.actor.inputs;if(output>=0&&output<genome.actor.outputs)outputEdges.push({edge,index,output});else otherEdges.push(index);}
    cached={nodeCount:genome.nodes.length,edgeCount:genome.edges.length,hidden,features,outputEdges,otherEdges};incomingCache.set(genome,cached);
  }
  return cached;
}
export function actorParameters(values={}){
  if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid actor parameters');
  for(const key of Object.keys(values))if(!Object.hasOwn(ACTOR_BOUNDS,key))throw Error(`Unknown actor parameter: ${key}`);
  const result={...ACTOR_DEFAULTS,...values};
  for(const[key,[min,max]]of Object.entries(ACTOR_BOUNDS)){if(['plasticOutputs','traceNormalization'].includes(key)&&result[key]===undefined)continue;if(!Number.isFinite(result[key])||result[key]<min||result[key]>max||['plasticOutputs','traceNormalization'].includes(key)&&!Number.isInteger(result[key]))throw Error(`Invalid actor parameter: ${key}`);}
  if(result.traceNormalization===0)delete result.traceNormalization;
  return result;
}
export function installActorGenome(genome,{inputs=17,outputs=5,scaffold=true,parameters={}}={}){
  const params=actorParameters(parameters),g=structuredClone(genome),start=inputs+outputs;
  g.nodes=g.nodes.filter(node=>node.id<start);g.edges=[];
  for(const kind of ['fast','slow'])for(let channel=0;channel<inputs;channel++){
    const id=start+(kind==='slow'?inputs:0)+channel;
    g.nodes.push({id,kind:'hidden',bias:0,memory:kind,channel});
    const retention=kind==='fast'?.8:params.traceRetention;
    g.edges.push({from:channel,to:id,w:params.traceNormalization?1-retention:1},{from:id,to:id,w:retention});
  }
  const features=g.nodes.filter(node=>node.kind!=='output');
  for(const feature of features)for(let output=0;output<outputs;output++)g.edges.push({from:feature.id,to:inputs+output,w:0});
  if(scaffold){
    const set=(from,output,value)=>{g.edges.find(edge=>edge.from===from&&edge.to===inputs+output).w=value;};
    set(1,0,-2);set(2,0,2);set(7,0,-.35);set(8,0,.35);set(10,0,1.8);set(11,0,-1.8);
    set(16,1,.9);set(3,1,-.5);set(16,2,1.2);set(16,3,.8);
  }
  g.actor={version:1,inputs,outputs,...(params.traceNormalization?{traceNormalization:1}:{})};return g;
}
export function createActorBrain(genome,seed=1){
  return {activity:Object.fromEntries(genome.nodes.map(node=>[node.id,0])),plastic:genome.edges.map(()=>0),eligibility:genome.edges.map(()=>0),baseline:0,
    actor:{rngState:(seed>>>0)||1,steps:0,updates:0,lastMeans:Array(genome.actor.outputs).fill(0),...(genome.actor.traceNormalization?{traceNormalization:1}:{})}};
}
function uniform(brain){let x=brain.actor.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;brain.actor.rngState=x>>>0;return brain.actor.rngState/4294967296;}
function normal(brain){return Math.sqrt(-2*Math.log(Math.max(1e-12,uniform(brain))))*Math.cos(2*Math.PI*uniform(brain));}
export function clearActorActivity(genome,brain){for(const node of genome.nodes)brain.activity[node.id]=0;brain.eligibility.fill(0);}
export function observeActor(genome,brain,inputs,parameters=ACTOR_DEFAULTS){
  const topology=hiddenIncoming(genome);
  // Every trace reads only its own old activation. Earlier hidden updates
  // cannot write this unique node ID, so a full activity copy is unnecessary.
  for(let i=0;i<genome.actor.inputs;i++)brain.activity[i]=inputs[i]||0;
  for(const row of topology.hidden){const node=row.node;
    if(node.memory){const retention=node.memory==='fast'?.8:parameters.traceRetention,input=inputs[node.channel]||0;brain.activity[node.id]=clip(retention*(brain.activity[node.id]||0)+(genome.actor.traceNormalization?(1-retention)*input:input),-1,1);}
    else {let total=node.bias;for(const {edge,index} of row.incoming){total+=(edge.w+brain.plastic[index])*(brain.activity[edge.from]||0);}brain.activity[node.id]=Math.tanh(total);}
  }
}
export function learnActor(genome,brain,reward,enabled=true,parameters=ACTOR_DEFAULTS){
  const advantage=clip(reward-brain.baseline,-1,1);brain.baseline=.98*brain.baseline+.02*reward;
  if(!enabled)return;
  const featureNorm=Math.max(1,hiddenIncoming(genome).features.reduce((sum,node)=>sum+(brain.activity[node.id]||0)**2,0));
  const rate=genome.traits.learningRate*parameters.learningScale/featureNorm;
  for(const {edge,index} of hiddenIncoming(genome).outputEdges){
    if(!((parameters.plasticOutputs??31)&(1<<(edge.to-genome.actor.inputs))))continue;
    brain.plastic[index]=clip(brain.plastic[index]*(1-genome.traits.memoryDecay)+rate*advantage*brain.eligibility[index],-3,3);
  }
  brain.actor.updates++;
}
export function actActor(genome,brain,{mode='gaussian',sample=true,channels=null,parameters=ACTOR_DEFAULTS}={}){
  const count=genome.actor.outputs,means=Array(count).fill(0),scores=Array(count).fill(0),actions=Array(count).fill(0);
  const enabled=channels?new Set(channels):null;
  const topology=hiddenIncoming(genome);
  for(const {edge,index,output}of topology.outputEdges)means[output]+=(edge.w+brain.plastic[index])*(brain.activity[edge.from]||0);
  for(let output=0;output<count;output++){
    const mean=clip(means[output],-4,4);
    if(mode==='binary'){
      const probability=1/(1+Math.exp(-mean)),choice=sample?Number(uniform(brain)<probability):Number(probability>=.5);
      actions[output]=choice?1:-1;scores[output]=sample?choice-probability:0;
    }else{const noise=sample?normal(brain):0;actions[output]=Math.tanh(mean+parameters.exploration*noise);scores[output]=sample?noise/parameters.exploration:0;}
  }
  for(const i of topology.otherEdges)brain.eligibility[i]=0;
  for(const {edge,index,output}of topology.outputEdges){
    if(enabled&&!enabled.has(output)){brain.eligibility[index]=0;continue;}
    brain.eligibility[index]=clip(parameters.eligibilityDecay*brain.eligibility[index]+scores[output]*(brain.activity[edge.from]||0),-10,10);
  }
  for(let output=0;output<count;output++)brain.activity[genome.actor.inputs+output]=actions[output];
  brain.actor.lastMeans=means;brain.actor.steps++;return actions;
}
export function actorStep(genome,brain,inputs,reward,learning,parameters=ACTOR_DEFAULTS){
  learnActor(genome,brain,reward,learning,parameters);observeActor(genome,brain,inputs,parameters);return actActor(genome,brain,{parameters});
}
