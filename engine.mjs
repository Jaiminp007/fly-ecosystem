import {challengeAt,fertility,stress} from './challenges.mjs';
// Compact artificial controller. No biological connectome is represented here.
export const INPUTS = ['food ahead','food left','food right','food proximity','energy','age','mate ahead','mate left','mate right','mate proximity','wall left','wall right','scent','previous food','clock sin','clock cos','bias'];
export const OUTPUTS = ['turn','move','eat','mate','signal'];
export const DT = 0.1;
const IN = INPUTS.length, OUT = OUTPUTS.length, HSTART = IN + OUT;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const angle = a => Math.atan2(Math.sin(a),Math.cos(a));
const clone = v => structuredClone(v);
export class RNG {
  constructor(seed=1){this.state=(seed>>>0)||1;}
  next(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return this.state/4294967296;}
  range(a,b){return a+(b-a)*this.next();}
  pick(xs){return xs[Math.floor(this.next()*xs.length)];}
  normal(){return Math.sqrt(-2*Math.log(Math.max(this.next(),1e-12)))*Math.cos(2*Math.PI*this.next());}
}
class Spatial {
  constructor(items,cell=80){this.cell=cell;this.bins=new Map();for(const a of items){const k=this.key(a.x,a.y);if(!this.bins.has(k))this.bins.set(k,[]);this.bins.get(k).push(a);}}
  key(x,y){return `${Math.floor(x/this.cell)},${Math.floor(y/this.cell)}`;}
  nearby(a,r){const found=[];for(let x=Math.floor((a.x-r)/this.cell);x<=Math.floor((a.x+r)/this.cell);x++)for(let y=Math.floor((a.y-r)/this.cell);y<=Math.floor((a.y+r)/this.cell);y++)for(const b of this.bins.get(`${x},${y}`)||[])if(distance(a,b)<=r)found.push(b);return found;}
}
function seedGenome(rng){
  const nodes=Array.from({length:HSTART+8},(_,id)=>({id,kind:id<IN?'input':id<HSTART?'output':'hidden',bias:0}));
  const edges=[];const add=(from,to,w)=>{const old=edges.find(e=>e.from===from&&e.to===to);if(old)old.w+=w;else edges.push({from,to,w});};
  // A disclosed seed reflex, encoded in genes: food attraction + random exploration.
  // Evolution and plasticity may change it. This is not an evolved result.
  for(let h=0;h<8;h++)add([1,2,4,7,8,10,11,16][h],HSTART+h,1);
  const turn=IN,move=IN+1,eat=IN+2,mate=IN+3;
  add(HSTART,turn,-2.0);add(HSTART+1,turn,2.0);
  add(HSTART+3,turn,-0.35);add(HSTART+4,turn,0.35);
  add(HSTART+5,turn,1.8);add(HSTART+6,turn,-1.8);
  add(16,move,0.9);add(3,move,-0.5);add(16,eat,1.2);add(16,mate,0.8);
  add(14,turn,0.15);add(15,turn,0.15);
  for(let i=0;i<10;i++)add(rng.pick(nodes).id,IN+Math.floor(rng.next()*OUT),rng.normal()*0.12);
  return {nodes,edges,traits:{speed:rng.range(22,34),sense:rng.range(95,145),metabolism:rng.range(.24,.36),maturity:rng.range(18,28),lifespan:rng.range(200,320),learningRate:rng.range(.005,.018),memoryDecay:rng.range(.0001,.0005),color:rng.range(0,1)}};
}
export function inherit(a,b,rng,innovation,mutation=true){
  const traits={};for(const k of Object.keys(a.traits)){traits[k]=(rng.next()<.5?a:b).traits[k];if(mutation&&rng.next()<.3)traits[k]*=Math.exp(rng.normal()*.06);}
  const bounds={speed:[8,65],sense:[40,230],metabolism:[.1,.9],maturity:[8,90],lifespan:[80,700],learningRate:[0,.08],memoryDecay:[0,.005],color:[0,1]};
  for(const k in traits)traits[k]=clamp(traits[k],...bounds[k]);
  const nodeMap=new Map(a.nodes.map(n=>[n.id,clone(n)]));
  for(const n of b.nodes)if(!nodeMap.has(n.id)||rng.next()<.5)nodeMap.set(n.id,clone(n));
  const em=new Map(a.edges.map(e=>[`${e.from}:${e.to}`,clone(e)]));
  for(const e of b.edges)if(!em.has(`${e.from}:${e.to}`)||rng.next()<.5)em.set(`${e.from}:${e.to}`,clone(e));
  const genome={nodes:[...nodeMap.values()].sort((a,b)=>a.id-b.id),edges:[...em.values()],traits};const changes=[];
  if(mutation){
    for(const e of genome.edges)if(rng.next()<.12){e.w=clamp(e.w+rng.normal()*.18,-4,4);changes.push('weight');}
    if(rng.next()<.22&&genome.edges.length){
      const e=genome.edges.splice(Math.floor(rng.next()*genome.edges.length),1)[0];const id=innovation();
      genome.nodes.push({id,kind:'hidden',bias:0});genome.edges.push({from:e.from,to:id,w:1},{from:id,to:e.to,w:e.w});changes.push('add neuron');
    }
    if(rng.next()<.2){const from=rng.pick(genome.nodes).id,to=rng.pick(genome.nodes.filter(n=>n.kind!=='input')).id;
      if(!genome.edges.some(e=>e.from===from&&e.to===to)){genome.edges.push({from,to,w:rng.normal()*.25});changes.push('add connection');}}
    if(rng.next()<.1&&genome.edges.length>10){genome.edges.splice(Math.floor(rng.next()*genome.edges.length),1);changes.push('remove connection');}
    if(rng.next()<.04&&genome.nodes.length>HSTART+2){const n=rng.pick(genome.nodes.filter(n=>n.kind==='hidden'));genome.nodes=genome.nodes.filter(x=>x.id!==n.id);genome.edges=genome.edges.filter(e=>e.from!==n.id&&e.to!==n.id);changes.push('remove neuron');}
  }
  return {genome,changes};
}
function initialBrain(g){return {activity:Object.fromEntries(g.nodes.map(n=>[n.id,0])),plastic:g.edges.map(()=>0),eligibility:g.edges.map(()=>0),baseline:0};}
export function brainStep(g,s,inputs,reward,learning){
  // Reward from previous world step modulates the preceding activity trace.
  const error=clamp(reward-s.baseline,-1,1);s.baseline=.98*s.baseline+.02*reward;
  if(learning)for(let i=0;i<g.edges.length;i++)s.plastic[i]=clamp(s.plastic[i]*(1-g.traits.memoryDecay)+g.traits.learningRate*error*s.eligibility[i],-.75,.75);
  let activity={...s.activity};for(let i=0;i<IN;i++)activity[i]=inputs[i];
  for(let phase=0;phase<2;phase++){
    const next=Object.fromEntries(g.nodes.map(n=>[n.id,n.kind==='input'?inputs[n.id]:n.bias]));
    for(let i=0;i<g.edges.length;i++){const e=g.edges[i];next[e.to]+=(e.w+s.plastic[i])*activity[e.from];}
    for(const n of g.nodes)if(n.kind!=='input')next[n.id]=Math.tanh(next[n.id]);
    activity=next;
  }
  for(let i=0;i<g.edges.length;i++){const e=g.edges[i];s.eligibility[i]=.85*s.eligibility[i]+.15*activity[e.from]*activity[e.to];}
  s.activity=activity;return Array.from({length:OUT},(_,i)=>activity[IN+i]);
}
export class World {
  constructor(config={}){
    this.config={seed:42,founders:36,capacity:240,learning:true,mutation:true,nutrient:3,seasonal:true,...config};
    validateConfig(this.config);this.rng=new RNG(this.config.seed);this.width=1000;this.height=640;this.tick=0;this.nextId=1;this.nextNode=HSTART+8;
    this.flies=[];this.food=[];this.obstacles=[{x:400,y:210,r:42},{x:620,y:415,r:55},{x:760,y:190,r:26}];
    this.lineage=[];this.events=[];this.history=[];this.capacityReached=false;
    this.totals={births:0,deaths:0,foodEaten:0,externalEnergy:0,dissipated:0,structuralMutations:0};
    for(let y=28;y<this.height;y+=32)for(let x=28;x<this.width;x+=32){const abundance=Math.max(...[{x:180,y:180},{x:800,y:450},{x:470,y:500}].map(p=>Math.exp(-(distance({x,y},p)**2)/24000)));
      const amount=abundance*this.rng.range(.7,2);this.food.push({x,y,amount,capacity:abundance*4+.05,regrowth:abundance*.16+.001});}
    for(let i=0;i<this.config.founders;i++){const g=seedGenome(this.rng);this.flies.push(this.makeFly(g,[],0,i%2,[],this.rng.range(50,950),this.rng.range(50,590),65));}
    for(const f of this.flies)for(const o of this.obstacles)if(distance(f,o)<o.r+8){f.x=o.x+o.r+9;}
    this.initialEnergy=this.energy();this.record('start',`${this.flies.length} founders · seed ${this.config.seed}`);this.sample();
  }
  makeFly(genome,parents,generation,sex,mutations,x,y,energy){const id=this.nextId++;const fly={id,genome,brain:initialBrain(genome),parents,generation,sex,x,y,heading:this.rng.range(-Math.PI,Math.PI),energy,age:0,cooldown:0,reward:0,lastFood:0,signal:0,offspring:0,born:this.tick};
    this.lineage.push({id,parents,generation,sex,born:this.tick,died:null,mutations,nodes:genome.nodes.length,edges:genome.edges.length,traits:clone(genome.traits)});return fly;}
  record(kind,text){this.events.push({tick:this.tick,kind,text});if(this.events.length>300)this.events.shift();}
  energy(){return this.food.reduce((s,f)=>s+f.amount,0)+this.flies.reduce((s,f)=>s+f.energy,0);}
  sensors(f,fi,ai,challenge=null){
    const r=f.genome.traits.sense;const foods=fi.nearby(f,r).filter(p=>p.amount>.06);let best=null,score=0;
    for(const p of foods){const value=p.amount/(distance(f,p)+20);if(value>score){best=p;score=value;}}
    const mates=ai.nearby(f,r).filter(m=>m.id!==f.id&&m.sex!==f.sex&&m.age>=m.genome.traits.maturity);
    const mate=mates.sort((a,b)=>distance(f,a)-distance(f,b))[0];
    const bearing=p=>p?angle(Math.atan2(p.y-f.y,p.x-f.x)-f.heading):0;
    const foodA=bearing(best),mateA=bearing(mate);
    const wall=(offset)=>{const x=f.x+Math.cos(f.heading+offset)*35,y=f.y+Math.sin(f.heading+offset)*35;return x<10||x>990||y<10||y>630||(this.obstacles.some(o=>distance({x,y},o)<o.r+6)||stress(challenge,{x,y})>0)?1:0;};
    const scent=ai.nearby(f,r/2).filter(m=>m.id!==f.id).reduce((s,m)=>s+m.signal/(1+distance(f,m)),0);
    return [best?Math.cos(foodA):0,best?Math.max(0,-Math.sin(foodA)):0,best?Math.max(0,Math.sin(foodA)):0,best?1-distance(f,best)/r:0,f.energy/120,Math.min(f.age/300,1),mate?Math.cos(mateA):0,mate?Math.max(0,-Math.sin(mateA)):0,mate?Math.max(0,Math.sin(mateA)):0,mate?1-distance(f,mate)/r:0,wall(-.7),wall(.7),clamp(scent,0,1),f.lastFood,Math.sin(this.tick*.018),Math.cos(this.tick*.018),1];
  }
  step(){
    if(!this.flies.length||this.capacityReached)return false;
    this.tick++;const challenge=challengeAt(this.config,this.tick);
    if(challenge){
      if(!this.challengeHistory)this.challengeHistory=[];
      const key=`${challenge.cycle}:${challenge.index}`,previous=this.challengeHistory.at(-1);
      if(previous?.key!==key){if(previous){previous.endTick=this.tick;previous.endPopulation=this.flies.length;previous.births=this.totals.births-previous.startBirths;previous.deaths=this.totals.deaths-previous.startDeaths;previous.foodEaten=this.totals.foodEaten-previous.startFood;}
        this.challengeHistory.push({key,name:challenge.name,startTick:this.tick,startPopulation:this.flies.length,startBirths:this.totals.births,startDeaths:this.totals.deaths,startFood:this.totals.foodEaten});
        if(this.challengeHistory.length>64)this.challengeHistory.shift();this.record('challenge',`${challenge.name} · cycle ${challenge.cycle}`);}
    }
    const season=this.config.seasonal?.6+.4*Math.sin(this.tick*DT/50):1;
    for(const p of this.food){const inc=Math.min(p.capacity-p.amount,p.regrowth*this.config.nutrient*season*DT*fertility(challenge,p));p.amount+=inc;this.totals.externalEnergy+=inc;}
    const fi=new Spatial(this.food),ai=new Spatial(this.flies);const actions=new Map();
    for(const f of this.flies)actions.set(f.id,brainStep(f.genome,f.brain,this.sensors(f,fi,ai,challenge),f.reward,this.config.learning));
    // Shuffle update order with the checkpointed RNG to avoid fixed-ID resource priority.
    const order=[...this.flies];for(let i=order.length-1;i>0;i--){const j=Math.floor(this.rng.next()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    for(const f of order){
      const [turn,move,eat,,signal]=actions.get(f.id),g=f.genome.traits;
      f.age+=DT;f.cooldown=Math.max(0,f.cooldown-DT);
      f.heading=angle(f.heading+turn*2.8*DT+this.rng.normal()*.06);
      const speed=(move+1)/2*g.speed;const x=clamp(f.x+Math.cos(f.heading)*speed*DT,6,994),y=clamp(f.y+Math.sin(f.heading)*speed*DT,6,634);
      if(!this.obstacles.some(o=>distance({x,y},o)<o.r+5)){f.x=x;f.y=y;}else f.heading=angle(f.heading+1.1);
      f.signal=(signal+1)/2;
      const cost=Math.min(f.energy,(g.metabolism+speed*.008+f.genome.nodes.length*.0007+f.signal*.015+stress(challenge,f))*DT);f.energy-=cost;this.totals.dissipated+=cost;
      let eaten=0;if(eat>0){for(const p of fi.nearby(f,15)){const take=Math.min(p.amount,Math.max(0,120-f.energy),.8);p.amount-=take;f.energy+=take;eaten+=take;}}
      this.totals.foodEaten+=eaten;f.lastFood=Math.min(1,eaten);f.reward=clamp(eaten-cost,-1,1);
    }
    const dead=this.flies.filter(f=>f.energy<=0||f.age>f.genome.traits.lifespan);
    for(const f of dead){this.totals.dissipated+=f.energy;this.totals.deaths++;this.lineage.find(l=>l.id===f.id).died=this.tick;this.record('death',`Fly ${f.id} · ${f.energy<=0?'energy depleted':'lifespan reached'}`);}
    this.flies=this.flies.filter(f=>!dead.includes(f));
    const candidates=new Spatial(this.flies);const children=[];
    for(const f of order){
      if(!this.flies.includes(f)||f.sex!==0||f.cooldown>0||f.energy<65||f.age<f.genome.traits.maturity||actions.get(f.id)[3]<=0)continue;
      const mate=candidates.nearby(f,26).find(m=>m.sex===1&&m.cooldown<=0&&m.energy>=65&&m.age>=m.genome.traits.maturity&&actions.get(m.id)[3]>0);
      if(!mate)continue;
      if(this.flies.length+children.length>=this.config.capacity){this.capacityReached=true;this.record('capacity','Resource ceiling reached. Run paused; no births silently discarded.');break;}
      const {genome,changes}=inherit(f.genome,mate.genome,this.rng,()=>this.nextNode++,this.config.mutation);
      f.energy-=24;mate.energy-=24;f.cooldown=12;mate.cooldown=12;f.offspring++;mate.offspring++;
      const child=this.makeFly(genome,[f.id,mate.id],Math.max(f.generation,mate.generation)+1,this.rng.next()<.5?0:1,changes,(f.x+mate.x)/2,(f.y+mate.y)/2,48);children.push(child);
      this.totals.births++;this.totals.structuralMutations+=changes.filter(c=>c!=='weight').length;this.record('birth',`Fly ${child.id} ← ${f.id} + ${mate.id} · lineage ${child.generation}`);
    }
    this.flies.push(...children);
    if(!this.flies.length)this.record('extinction','Population extinct. No replacement agents were inserted.');
    if(this.tick%20===0)this.sample();return true;
  }
  advance(n){for(let i=0;i<n;i++)if(!this.step())break;return this.tick;}
  metrics(){const n=this.flies.length,mean=fn=>n?this.flies.reduce((s,f)=>s+fn(f),0)/n:0;
    return {tick:this.tick,seconds:this.tick*DT,population:n,births:this.totals.births,deaths:this.totals.deaths,generation:Math.max(0,...this.flies.map(f=>f.generation)),meanNodes:mean(f=>f.genome.nodes.length),meanEnergy:mean(f=>f.energy),meanSpeed:mean(f=>f.genome.traits.speed),learnedMagnitude:mean(f=>f.brain.plastic.reduce((s,p)=>s+Math.abs(p),0)/Math.max(1,f.brain.plastic.length)),food:this.food.reduce((s,p)=>s+p.amount,0),structuralMutations:this.totals.structuralMutations,accountingError:this.energy()+this.totals.dissipated-this.initialEnergy-this.totals.externalEnergy,status:!n?'extinct':this.capacityReached?'capacity':'running'};}
  sample(){this.history.push(this.metrics());if(this.history.length>2000)this.history.shift();}
  snapshot(){return {schema:1,model:this.config.challenges==='cycle'?'compact-challenges-v2':'compact-evolving-v1',challenge:challengeAt(this.config,this.tick),challengeHistory:this.challengeHistory||[],config:clone(this.config),width:this.width,height:this.height,metrics:this.metrics(),food:this.food,obstacles:this.obstacles,flies:this.flies.map(f=>({id:f.id,x:f.x,y:f.y,heading:f.heading,energy:f.energy,sex:f.sex,generation:f.generation,nodes:f.genome.nodes.length,color:f.genome.traits.color})),history:this.history,events:this.events.slice(-35),lineage:this.lineage.slice(-500)};}
  inspect(id){const f=this.flies.find(f=>f.id===id);return f?clone(f):{archived:this.lineage.find(l=>l.id===id)||null};}
  checkpoint(){return {schema:1,model:this.config.challenges==='cycle'?'compact-challenges-v2':'compact-evolving-v1',world:clone({...this,rng:{state:this.rng.state}})};}
  static restore(data){validateCheckpoint(data);const w=Object.create(World.prototype);Object.assign(w,clone(data.world));w.rng=new RNG(data.world.rng.state);return w;}
}
export function validateConfig(c){
  if(c.challenges!==undefined&&!['off','cycle'].includes(c.challenges))throw Error('Invalid challenge profile');
  if(c.challengeStartTick!==undefined&&(!Number.isInteger(c.challengeStartTick)||c.challengeStartTick<0))throw Error('Invalid challenge start');
  for(const [k,min,max] of [['seed',1,4294967295],['founders',2,500],['capacity',2,2000]])if(!Number.isInteger(c[k])||c[k]<min||c[k]>max)throw new Error(`Invalid ${k}`);
  if(c.capacity<c.founders)throw new Error('Capacity must cover founders');
  if(typeof c.learning!=='boolean'||typeof c.mutation!=='boolean'||typeof c.seasonal!=='boolean'||!Number.isFinite(c.nutrient)||c.nutrient<0||c.nutrient>5)throw new Error('Invalid environment settings');
}
export function validateCheckpoint(d){
  if(d?.schema!==1||!['compact-evolving-v1','compact-challenges-v2'].includes(d?.model)||!d.world)throw new Error('Unsupported checkpoint');
  const w=d.world;validateConfig(w.config);
  if((d.model==='compact-challenges-v2')!==(w.config.challenges==='cycle'))throw Error('Challenge model mismatch');
  if(w.config.challengeStartTick>w.tick)throw Error('Challenge start is in the future');
  if(!Number.isInteger(w.tick)||w.tick<0||!Number.isInteger(w.rng?.state)||w.rng.state<=0||w.width!==1000||w.height!==640)throw new Error('Invalid clock or geometry');
  if(!Array.isArray(w.flies)||w.flies.length>w.config.capacity||!Array.isArray(w.food)||w.food.length>10000||!Array.isArray(w.lineage)||!Array.isArray(w.history)||!Array.isArray(w.events)||!Array.isArray(w.obstacles))throw new Error('Invalid populations');
  const walk=v=>{if(typeof v==='number'&&!Number.isFinite(v))throw new Error('Nonfinite state');if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))throw new Error('Invalid property');walk(x);}};walk(w);
  const ids=new Set();for(const f of w.flies){
    for(const k of ['id','energy','x','y','heading','age','cooldown','reward','lastFood','signal','offspring','generation','sex','born'])if(!Number.isFinite(f[k]))throw new Error('Invalid fly field');
    if(!Array.isArray(f.parents)||![0,1].includes(f.sex)||ids.has(f.id)||!Number.isInteger(f.id)||f.id<1||f.energy<0||f.energy>120||f.x<0||f.x>1000||f.y<0||f.y>640)throw new Error('Invalid fly');ids.add(f.id);
    const g=f.genome;if(!Array.isArray(g?.nodes)||g.nodes.length>10000||!Array.isArray(g.edges)||g.edges.length>100000)throw new Error('Invalid genome');
    const nodes=new Set(g.nodes.map(n=>n.id));if(nodes.size!==g.nodes.length)throw new Error('Duplicate neurons');
    if(g.nodes.some(n=>!Number.isInteger(n.id)||n.id<0||!['input','hidden','output'].includes(n.kind)||!Number.isFinite(n.bias)))throw new Error('Invalid neuron');
    for(let i=0;i<HSTART;i++)if(!g.nodes.some(n=>n.id===i&&n.kind===(i<IN?'input':'output')))throw new Error('Missing interface neurons');
    for(const e of g.edges)if(!nodes.has(e.from)||!nodes.has(e.to)||e.to<IN||!Number.isFinite(e.w))throw new Error('Invalid connection');
    if(new Set(g.edges.map(e=>`${e.from}:${e.to}`)).size!==g.edges.length)throw new Error('Duplicate connection genes');
    if(!Array.isArray(f.brain?.plastic)||!Array.isArray(f.brain.eligibility)||f.brain.plastic.some(p=>!Number.isFinite(p))||f.brain.eligibility.some(p=>!Number.isFinite(p))||!Number.isFinite(f.brain.baseline)||f.brain.plastic.length!==g.edges.length||f.brain.eligibility.length!==g.edges.length||g.nodes.some(n=>!Number.isFinite(f.brain.activity[n.id])))throw new Error('Invalid neural state');
    for(const k of ['speed','sense','metabolism','maturity','lifespan','learningRate','memoryDecay','color'])if(!Number.isFinite(g.traits[k])||g.traits[k]<0)throw new Error('Invalid trait');
  }
  if(!Number.isInteger(w.nextId)||w.nextId<=Math.max(0,...ids)||!Number.isInteger(w.nextNode)||w.flies.some(f=>f.genome.nodes.some(n=>n.id>=w.nextNode)))throw new Error('Invalid innovation counters');
  for(const p of w.food)if(['x','y','amount','capacity','regrowth'].some(k=>!Number.isFinite(p[k]))||p.amount<0||p.amount>p.capacity+1e-8||p.regrowth<0)throw new Error('Invalid resource');
  for(const o of w.obstacles)if(['x','y','r'].some(k=>!Number.isFinite(o[k]))||o.r<0)throw new Error('Invalid obstacle');
  if(typeof w.capacityReached!=='boolean'||w.lineage.some(l=>!Number.isInteger(l.id)||!Array.isArray(l.parents)||!Array.isArray(l.mutations)))throw new Error('Invalid lineage');
  for(const k of ['births','deaths','foodEaten','externalEnergy','dissipated','structuralMutations'])if(!Number.isFinite(w.totals?.[k])||w.totals[k]<0)throw new Error('Invalid accounting');
  if(!Number.isFinite(w.initialEnergy))throw new Error('Invalid energy baseline');
}
