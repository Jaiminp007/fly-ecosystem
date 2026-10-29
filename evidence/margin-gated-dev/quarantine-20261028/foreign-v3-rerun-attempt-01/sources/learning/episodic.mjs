// Experimental discrete-action episodic controller. Stores observed features,
// actual actions and labelled reward/value targets, with no correct-label input.
const defaults={capacity:128,neighbors:8,bandwidth:.25,maxDistance:.6,exploration:.1,replacement:'reservoir',recencyHalfLife:0,dimensions:17,priorStrength:0};
const uint32=value=>Number.isInteger(value)&&value>0&&value<=0xffffffff;
function random(memory,key){let x=memory[key];x^=x<<13;x^=x>>>17;x^=x<<5;memory[key]=x>>>0;return memory[key]/4294967296;}
export function createEpisodicMemory(values={},seed=1){
 for(const key of Object.keys(values))if(!Object.hasOwn(defaults,key))throw Error(`Unknown episodic setting: ${key}`);
 const config={...defaults,...values};
 if(!Number.isFinite(config.priorStrength)||config.priorStrength<0||config.priorStrength>16)throw Error('Invalid episodic priorStrength');
 // Keep the disabled option absent for exact legacy checkpoint bytes.
 if(config.priorStrength===0)delete config.priorStrength;
 if(!Number.isInteger(config.capacity)||config.capacity<16||config.capacity>512||!Number.isInteger(config.neighbors)||config.neighbors<1||config.neighbors>16||config.neighbors>config.capacity||![17,18].includes(config.dimensions)||!['reservoir','fifo','hybrid'].includes(config.replacement))throw Error('Invalid episodic memory configuration');
 if(!Number.isFinite(config.recencyHalfLife)||config.recencyHalfLife!==0&&config.recencyHalfLife<1||config.recencyHalfLife>4096)throw Error('Invalid episodic recencyHalfLife');
 for(const[key,min,max]of [['bandwidth',.05,1],['maxDistance',.1,2],['exploration',.01,.5]])if(!Number.isFinite(config[key])||config[key]<min||config[key]>max)throw Error(`Invalid episodic ${key}`);
 if(!uint32(seed))throw Error('Invalid episodic seed');
 return{schema:1,config,seen:0,records:[],rngState:seed,retentionRngState:((seed^0x9e3779b9)>>>0)||1};
}
export function episodicFeatures(genome,brain,mode='slow'){
 if(!['slow','fast','current','mixed','local','navigation'].includes(mode))throw Error('Invalid episodic feature mode');
 // Experimental navigation representation: food, obstacle probes, scent and
 // previous intake. Exclude mates, clocks, age, energy and constant bias from
 // the retrieval metric. The neural controller still receives every input.
 const localChannels=new Set([0,1,2,3,10,11,12,13]),navigationChannels=new Set([...localChannels,4,16]);
 // Navigation preserves the existing energy sensor and bias anchor while
 // masking mate, age and clock channels. It uses no map or future outcome.
 const values=Array.from({length:genome.actor.inputs},(_,channel)=>{if(mode==='local'&&!localChannels.has(channel)||mode==='navigation'&&!navigationChannels.has(channel))return 0;const node=genome.nodes.find(node=>node.memory===(mode==='fast'?'fast':'slow')&&node.channel===channel),trace=node?brain.activity[node.id]||0:0,current=brain.activity[channel]||0;return mode==='current'?current:['mixed','local','navigation'].includes(mode)?.75*current+.25*trace:trace;});
 const norm=Math.sqrt(values.reduce((sum,value)=>sum+value*value,0));return values.map(value=>norm>1e-9?value/norm:0);
}
function validateFeatures(memory,features){if(!Array.isArray(features)||features.length!==memory.config.dimensions||features.some(value=>!Number.isFinite(value)||Math.abs(value)>1.000001))throw Error('Invalid episodic feature vector');}
export function inspectEpisodic(memory,features,{reserveRisk=false,riskWeight=0}={}){
 validateFeatures(memory,features);
 if(typeof reserveRisk!=='boolean'||!Number.isFinite(riskWeight)||riskWeight<0||riskWeight>2)throw Error('Invalid episodic risk selection');
 const halfLife=memory.config.recencyHalfLife??0;
 const nearby=memory.records.map((record,index)=>{const distance=record.features.reduce((sum,value,index)=>sum+(value-features[index])**2,0);return{record,index,distance,...(halfLife?{logCost:distance/(2*memory.config.bandwidth**2)+Math.LN2*(memory.seen-(record.experience??memory.seen))/halfLife}:{})};}).filter(row=>row.distance<=memory.config.maxDistance**2);
 const estimate=action=>{
  const selected=nearby.filter(row=>row.record.action===action).sort((a,b)=>halfLife?a.logCost-b.logCost:a.distance-b.distance).slice(0,memory.config.neighbors);
  // Subtracting a common log weight preserves the weighted mean and prevents
  // old but contextually relevant skills from underflowing to an empty recall.
  const offset=halfLife&&selected.length?selected[0].logCost:0;
  let numerator=0,denominator=0,riskNumerator=0;for(const row of selected){const weight=halfLife?Math.exp(-(row.logCost-offset)):Math.exp(-row.distance/(2*memory.config.bandwidth**2));numerator+=weight*row.record.reward;denominator+=weight;if(reserveRisk)riskNumerator+=weight*(row.record.risk?.value??0);}
  const estimate=denominator?numerator/denominator:0,riskEstimate=denominator?riskNumerator/denominator:0;
  return{estimate,...(reserveRisk?{riskEstimate,score:estimate-riskWeight*riskEstimate}:{}),neighbors:selected.map(row=>({index:row.index,experience:row.record.experience??null,distance:Math.sqrt(row.distance),action:row.record.action,reward:row.record.reward,features:[...row.record.features],...(row.record.target?{target:{...row.record.target}}:{}),...(row.record.risk?{risk:{...row.record.risk}}:{})}))};
 };
 const negative=estimate(-1),positive=estimate(1),priorStrength=memory.config.priorStrength??0;
 if(priorStrength>0){
  if(reserveRisk)throw Error('Pooled prior does not support reserve-risk selection');
  // Share a data-derived local prior between action estimates. We reuse the
  // selected records from the already charged scan; no fabricated experience
  // or extra stored label is added. Relative weights share one offset across
  // actions, so one nearby example has unit support regardless of recency.
  const groups=[negative,positive].map(score=>score.neighbors.map(row=>({...row,logCost:row.distance**2/(2*memory.config.bandwidth**2)+(halfLife?Math.LN2*(memory.seen-(row.experience??memory.seen))/halfLife:0)})));
  const offset=Math.min(...groups.flat().map(row=>row.logCost));
  const sums=groups.map(rows=>rows.reduce((sum,row)=>{const weight=Math.exp(-(row.logCost-offset));sum.weight+=weight;sum.value+=weight*row.reward;return sum;},{weight:0,value:0}));
  const support=sums[0].weight+sums[1].weight,priorEstimate=support?(sums[0].value+sums[1].value)/support:0;
  for(const [index,score]of [negative,positive].entries()){
   const mass=sums[index];score.rawEstimate=score.estimate;score.supportWeight=mass.weight;score.priorEstimate=priorEstimate;score.priorWeight=priorStrength;
   score.estimate=(mass.value+priorStrength*priorEstimate)/(mass.weight+priorStrength);
  }
  // With only one supported action, both pooled values are mathematically
  // identical. Preserve an exact tie instead of a roundoff-based preference.
  if(!sums[0].weight||!sums[1].weight)negative.estimate=positive.estimate=priorEstimate;
  else if(negative.rawEstimate===positive.rawEstimate)negative.estimate=positive.estimate=negative.rawEstimate;
 }
 return{negative,positive,stored:memory.records.length,seen:memory.seen};
}
export function chooseEpisodic(memory,features,{sample=false,randomTies=false,capture=null,reserveRisk=false,riskWeight=0}={}){
 validateFeatures(memory,features);
 if(typeof reserveRisk!=='boolean'||!Number.isFinite(riskWeight)||riskWeight<0||riskWeight>2)throw Error('Invalid episodic risk selection');
 const inspect=()=>inspectEpisodic(memory,features,{reserveRisk,riskWeight}),score=row=>row.score??row.estimate;
 const finish=(choice,reason,retrieval)=>{if(capture)capture({choice,reason,retrieval:retrieval??inspect()});return choice;};
 if(sample&&randomTies){const explore=random(memory,'rngState'),choice=random(memory,'rngState');if(explore<memory.config.exploration)return finish(choice<.5?-1:1,'exploration');const scores=inspect();if(score(scores.positive)===score(scores.negative))return finish(choice<.5?-1:1,'tie',scores);return finish(score(scores.positive)>score(scores.negative)?1:-1,'retrieval',scores);}
 if(sample&&random(memory,'rngState')<memory.config.exploration)return finish(random(memory,'rngState')<.5?-1:1,'exploration');
 const scores=inspect();return finish(score(scores.positive)>=score(scores.negative)?1:-1,score(scores.positive)===score(scores.negative)?'tie':'retrieval',scores);
}
export function validateEpisodicRisk(risk){
 if(!risk||risk.kind!=='reserve-deficit'||!Number.isFinite(risk.threshold)||risk.threshold<.05||risk.threshold>.75||typeof risk.terminal!=='boolean'||!Number.isInteger(risk.horizon)||risk.horizon<1||risk.horizon>64||!Number.isFinite(risk.discountPower)||risk.discountPower<0||risk.discountPower>1||!Number.isFinite(risk.observed)||risk.observed<0||risk.observed>1-risk.discountPower+1e-9||!Number.isFinite(risk.estimatedFuture)||risk.estimatedFuture<0||risk.estimatedFuture>risk.discountPower+1e-9||risk.terminal&&risk.estimatedFuture!==risk.discountPower||!Number.isFinite(risk.value)||risk.value<0||risk.value>1+1e-9||Math.abs(risk.value-risk.observed-risk.estimatedFuture)>1e-9)throw Error('Invalid episodic reserve-risk target');
}
export function validateEpisodicTarget(target,value){
 if(!Number.isFinite(value)||Math.abs(value)>1||!target||target.kind!=='td'||typeof target.terminal!=='boolean'||!Number.isInteger(target.horizon)||target.horizon<1||target.horizon>64||!Number.isFinite(target.discountPower)||target.discountPower<0||target.discountPower>1||!Number.isFinite(target.observed)||Math.abs(target.observed)>1-target.discountPower+1e-9||!Number.isFinite(target.estimatedFuture)||Math.abs(target.estimatedFuture)>target.discountPower+1e-9||target.terminal&&target.estimatedFuture!==0||Math.abs(value-Math.max(-1,Math.min(1,target.observed+target.estimatedFuture)))>1e-9)throw Error('Invalid episodic value target');
 if(!['greedy','expected'].includes(target.bootstrapMode??'greedy')||(target.bootstrapMode==='expected'?(!Number.isFinite(target.exploration)||target.exploration<.01||target.exploration>.5):target.exploration!==undefined))throw Error('Invalid episodic bootstrap target');
}
export function rememberEpisodic(memory,features,action,reward,target=null,risk=null){
 validateFeatures(memory,features);if(![-1,1].includes(action)||!Number.isFinite(reward)||Math.abs(reward)>1)throw Error('Invalid episodic experience');
 if(target!==null)validateEpisodicTarget(target,reward);
 if(risk!==null)validateEpisodicRisk(risk);
 memory.seen++;const record={features:[...features],action,reward,experience:memory.seen,...(target?{target:{...target}}:{}),...(risk?{risk:{...risk}}:{})};
 if(memory.config.replacement==='hybrid'){
  // One quarter is a FIFO of the newest experiences. The remaining slots
  // uniformly sample experiences displaced from it, without duplicating them.
  const recent=Math.floor(memory.config.capacity/4),long=memory.config.capacity-recent;
  if(memory.records.length<recent)memory.records.push(record);
  else{const displaced=memory.records.shift();memory.records.splice(recent-1,0,record);if(memory.records.length<memory.config.capacity)memory.records.push(displaced);else{const index=Math.floor(random(memory,'retentionRngState')*(memory.seen-recent));if(index<long)memory.records[recent+index]=displaced;}}
 }
 else if(memory.records.length<memory.config.capacity)memory.records.push(record);
 else if(memory.config.replacement==='fifo'){memory.records.shift();memory.records.push(record);}
 else{const index=Math.floor(random(memory,'retentionRngState')*memory.seen);if(index<memory.config.capacity)memory.records[index]=record;}
}
export function restoreEpisodicMemory(data){
 if(data?.schema!==1||!uint32(data.rngState)||!uint32(data.retentionRngState)||!Number.isSafeInteger(data.seen)||data.seen<0)throw Error('Invalid episodic checkpoint');
 const expected=createEpisodicMemory(data.config,data.rngState);
 if(!Array.isArray(data.records)||data.records.length>expected.config.capacity||data.records.length>data.seen)throw Error('Invalid episodic records');
 for(const record of data.records){validateFeatures(expected,record.features);if(![-1,1].includes(record.action)||!Number.isFinite(record.reward)||Math.abs(record.reward)>1||record.experience!==undefined&&(!Number.isSafeInteger(record.experience)||record.experience<1||record.experience>data.seen))throw Error('Invalid episodic record');if(record.target!==undefined)validateEpisodicTarget(record.target,record.reward);if(record.risk!==undefined)validateEpisodicRisk(record.risk);}
 if((expected.config.recencyHalfLife>0||expected.config.replacement==='hybrid')&&data.records.some(record=>record.experience===undefined))throw Error('Recency memory requires experience IDs');
 if(expected.config.replacement==='hybrid'){
  const recent=Math.min(data.seen,Math.floor(expected.config.capacity/4)),ids=data.records.map(r=>r.experience);
  if(data.records.length!==Math.min(data.seen,expected.config.capacity)||new Set(ids).size!==ids.length||ids.slice(0,recent).some((id,i)=>id!==data.seen-recent+1+i)||ids.slice(recent).some(id=>id>data.seen-recent))throw Error('Invalid hybrid memory partition');
 }
 return structuredClone(data);
}
