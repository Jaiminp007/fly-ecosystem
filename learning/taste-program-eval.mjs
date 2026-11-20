// Embodied evaluation of a taste-learning program (code + step/replays/memory/prior).
// Score per history = mean over families A,B,C of each fly's discrimination
// P(accept|good)-P(accept|bad), over flies alive at the end of phase C
// (acquisition and retention together; read before return-A).
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from './odor-routed-experiment.mjs';
import {predictTargetTaste,tasteExampleListeners} from './odor-routed-taste.mjs';
import {makeCueCodebook} from './cue-foraging.mjs';
import {advanceRng} from './intervention-study.mjs';

export function makeHistories(bankSeed,count){
  let rng=bankSeed>>>0||1;const next=()=>(rng=advanceRng(rng))>>>0||1;
  return Array.from({length:count},()=>({seed:next(),cueSeed:next(),resourceSeeds:[next(),next(),next(),next()],probeSeeds:{A:next(),B:next(),transfer:next()}}));
}
// Valence rule ("odor chemistry"): an odor's value = sign * product of its cue
// bits over rule.mask, replacing the random codebook labels in every family.
// With rule.terms ([[mask,coef],...]) and rule.bias: value = sign * sgn(bias +
// sum coef * product over mask) (threshold rules, e.g. majority, AND, OR).
// With rule.odor (16 n-bit codes, indexed by 4-bit cue pattern) masks range over the odor code.
export const cueIndex=bits=>bits.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);
export function applyValenceRule(run,rule){
  const code=rule.odor?bits=>rule.odor[cueIndex(bits)]:bits=>bits;
  const walsh=(mask,cue)=>{const bits=code(cue);let v=1;for(let bit=0;bit<bits.length;bit++)if(mask>>bit&1)v*=bits[bit];return v;};
  const value=rule.terms?bits=>rule.sign*Math.sign(rule.bias+rule.terms.reduce((s,[m,c])=>s+c*walsh(m,bits),0)):bits=>rule.sign*walsh(rule.mask,bits);
  for(const family of Object.values(run.codebook))for(const item of family)item.valence=value(item.bits);
  for(const patch of run.world.food)if(patch.cueId)patch.valence=value(patch.cue);
}
export function evaluateOne(program,history,world={}){
  const {code,...tasteProgram}=program,{valenceRule=null,toxinScale=null,nutrientScale=null,odorShiftEvery=null,odorShiftSeed=1,inheritTaste=null,sipFraction=null,sipLabels=false,...options}=world;
  const run=new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:'learned',trainingRegime:'continuous',steeringLearner:'original',tasteCode:code,tasteProgram,...options});
  if(valenceRule)applyValenceRule(run,valenceRule);
  // Opt-in lineage relay: founder i (by id order) starts with its parent's taste PROGRAM (masks) and
  // self-revision evidence; weights and replay memory start empty (no inherited knowledge of values).
  const founders=Object.keys(run.learners).map(Number).sort((a,b)=>a-b).map(id=>run.learners[id]);
  if(inheritTaste!==null){assert.ok(Array.isArray(inheritTaste)&&inheritTaste.length===founders.length);
    for(const [i,st] of founders.entries()){const h=inheritTaste[i];assert.ok(st.taste.code==='masks'&&Array.isArray(h.masks));
      st.taste.masks=[...h.masks];st.taste.weights=Array(h.masks.length).fill(0);
      if(st.taste.revise&&h.evidence){assert.equal(h.evidence.length,st.taste.revise.evidence.length);Object.assign(st.taste.revise,{evidence:[...h.evidence],n:h.n,s2:h.s2});}
      if(st.taste.revise&&h.z!==undefined){assert.ok(h.z>0);st.taste.revise.z=h.z;}}}
  // Opt-in world pressure (P1 of the 2026-11-14 review); null keeps the engine defaults.
  if(toxinScale!==null)run.world.config.toxinScale=toxinScale;
  if(nutrientScale!==null)run.world.config.nutrientScale=nutrientScale;
  // Opt-in sip body (P15): sips in the engine; sipLabels turns stationary refusals with a sip into taste labels.
  if(sipFraction!==null){assert.ok(sipFraction>0&&sipFraction<1);run.world.config.sipFraction=sipFraction;}
  if(sipLabels){assert.ok(sipFraction!==null);for(const st of Object.values(run.learners))st.credit.sipLabels=true;}
  // The flies' own experience: for each Walsh term, sum of term(cue)*(2*target-1).
  let odor=tasteProgram.odor??null;const width=odor?odor[0].length:4,termEvidence=Array(2**width).fill(0);let examples=0;
  const listener=({cue,target})=>{if(cue[0]===0)return;examples++;const bits=odor?odor[cueIndex(cue)]:cue;for(let m=0;m<2**width;m++){let v=1;for(let b=0;b<width;b++)if(m>>b&1)v*=bits[b];termEvidence[m]+=v*(2*target-1);}};
  tasteExampleListeners.add(listener);
  try{
  const total=(options.phaseDurations??[512,512,512,256]).reduce((x,y)=>x+y,0);
  // Opt-in many-odor world: every odorShiftEvery ticks the 16 cue patterns are
  // re-assigned fresh random odor codes (world chemistry); valences follow the
  // rule and every fly's taste transduction reads the new codes. Steering still
  // sees the 4-bit cue. null keeps one fixed table (16 odors per lifetime).
  if(odorShiftEvery!==null){
    assert.ok(Number.isInteger(odorShiftEvery)&&odorShiftEvery>0&&valenceRule?.odor&&odor&&valenceRule.odor[0].length===width);
    let rng=odorShiftSeed>>>0||1,end=null,rule=valenceRule;const next=()=>(rng=advanceRng(rng))>>>0;
    for(let t=0;t<total;t+=odorShiftEvery){
      if(t>0){const seen=new Set(),table=[];while(table.length<16){const c=next()%2**width;if(seen.has(c))continue;seen.add(c);table.push(Array.from({length:width},(_,b)=>c>>b&1?1:-1));}
        odor=table;rule={...rule,odor:table};applyValenceRule(run,rule);
        for(const state of Object.values(run.learners))if(state.taste?.odor)state.taste.odor=table.map(c=>[...c]);}
      end=run.advance(Math.min(odorShiftEvery,total-t));}
    var outcome0={survivors:end.survivors,energy:end.budgetAdjustedEnergyPerFounder};
  }else{
  var end=run.advance(total),outcome0={survivors:end.survivors,energy:end.budgetAdjustedEnergyPerFounder};
  }
  }finally{tasteExampleListeners.delete(listener);}
  const aliveIds=new Set(run.world.flies.map(f=>f.id)),tasteStates=founders.map(st=>({alive:aliveIds.has(st.agentId),masks:[...(st.taste.masks??[])],weights:[...(st.taste.weights??[])],...(st.taste.revise?{evidence:[...st.taste.revise.evidence],n:st.taste.revise.n,s2:st.taste.revise.s2??0,z:st.taste.revise.z,added:st.taste.revise.added.map(a=>a.mask)}:{})}));
  const outcome={...outcome0,termEvidence,examples,tasteStates};
  const anchor=run.anchors.C;if(!anchor)return {score:0,discrimination:0,alive:0,...outcome};
  const probe=OdorRoutedExperiment.restore(anchor),book=run.codebook,values=[],balanced=[];
  for(const fly of probe.world.flies){const s=structuredClone(probe.learners[fly.id]);let d=0,b=0,n=0;
    for(const family of ['A','B','C']){const g=[],x=[];for(const item of book[family]){const p=predictTargetTaste(s,item.bits);d+=(item.valence>0?1:-1)*p/2;(item.valence>0?g:x).push(p);}
      if(g.length&&x.length){b+=g.reduce((a,c)=>a+c,0)/g.length-x.reduce((a,c)=>a+c,0)/x.length;n++;}}
    values.push(d/3);if(n)balanced.push(b/n);}
  // discrimination: P(accept|good)-P(accept|bad) within each family that has both classes (base-rate free).
  const avg=v=>v.length?v.reduce((a,c)=>a+c,0)/v.length:0;
  return {score:avg(values),discrimination:avg(balanced),alive:values.length,...outcome};
}
// Child-process pool: evaluate many (program, history) jobs in parallel.
// A worker that dies (e.g. out of memory) is replaced and its job re-queued;
// evaluation is deterministic, so a retried job returns the same result.
export class Pool{
  constructor(size=6){this.closed=false;this.workers=new Set();this.idle=[];this.queue=[];this.next=0;this.busy=new Map();this.retries=0;for(let i=0;i<size;i++)this.spawn();}
  spawn(){
    const w=fork(fileURLToPath(import.meta.url),['worker'],{stdio:['ignore','ignore','inherit','ipc']});this.workers.add(w);
    w.on('message',({id,result})=>{const job=this.busy.get(w);this.busy.delete(w);job.resolve(result);this.idle.push(w);this.pump();});
    w.on('exit',()=>{this.workers.delete(w);this.idle=this.idle.filter(x=>x!==w);if(this.closed)return;
      const job=this.busy.get(w);this.busy.delete(w);if(job){this.retries++;this.queue.unshift(job);}
      if(this.retries>50)throw new Error('Pool: too many worker deaths');setTimeout(()=>{this.spawn();this.pump();},2000);});
    this.idle.push(w);
  }
  run(program,history,world={}){return new Promise(resolve=>{this.queue.push({id:this.next++,program,history,world,resolve});this.pump();});}
  pump(){while(this.idle.length&&this.queue.length){const job=this.queue.shift(),w=this.idle.pop();this.busy.set(w,job);w.send({id:job.id,program:job.program,history:job.history,world:job.world});}}
  close(){this.closed=true;for(const w of this.workers)w.kill();}
}
if(process.argv[2]==='worker')process.on('message',({id,program,history,world})=>process.send({id,result:evaluateOne(program,history,world)}));
