import test from 'node:test';
import assert from 'node:assert/strict';
import {World,RNG,inherit,brainStep,INPUTS} from '../engine.mjs';

test('checkpoint continuation is exactly reproducible, including RNG and memory',()=>{
  const a=new World({founders:8});a.advance(250);const b=World.restore(JSON.parse(JSON.stringify(a.checkpoint())));a.advance(350);b.advance(350);assert.deepEqual(a.checkpoint(),b.checkpoint());
});
test('energy accounting includes external renewal, metabolism and offspring transfer',()=>{
  const w=new World();w.advance(2200);assert.ok(w.totals.births>0);assert.ok(Math.abs(w.metrics().accountingError)<1e-6);
});
test('offspring retain both parent identities and do not inherit acquired memory',()=>{
  const w=new World({founders:2,mutation:false});const [a,b]=w.flies;
  a.x=b.x=180;a.y=b.y=180;a.age=b.age=35;a.energy=b.energy=100;
  a.brain.plastic.fill(.4);b.brain.plastic.fill(.3);
  w.initialEnergy=w.energy();w.step();const child=w.flies.find(f=>f.parents.length);
  assert.ok(child);assert.deepEqual(child.parents,[a.id,b.id]);assert.equal(child.generation,1);
  assert.ok(child.brain.plastic.every(v=>v===0));assert.ok(Object.values(child.brain.activity).every(v=>v===0));assert.equal(child.energy,48);
  for(const k of Object.keys(child.genome.traits))assert.ok([a.genome.traits[k],b.genome.traits[k]].includes(child.genome.traits[k]));
  assert.ok(Math.abs(w.metrics().accountingError)<1e-7);
});
test('structural mutation adds valid inherited topology with unique innovation IDs',()=>{
  const w=new World({founders:2});let g=w.flies[0].genome,id=w.nextNode,added=false,removed=false;
  for(let i=0;i<200;i++){const next=inherit(g,g,w.rng,()=>id++);g=next.genome;added ||= next.changes.includes('add neuron');removed ||= next.changes.includes('remove neuron');const ids=new Set(g.nodes.map(n=>n.id));assert.equal(ids.size,g.nodes.length);assert.ok(g.edges.every(e=>ids.has(e.from)&&ids.has(e.to)));}
  assert.ok(added);assert.ok(removed);
});
test('no mutation preserves parental alleles',()=>{
  const w=new World();for(const f of w.flies){const g=f.genome;
  const child=inherit(g,g,new RNG(18),()=>999,false);assert.deepEqual(child.genome,g);assert.deepEqual(child.changes,[]);}
});
test('learning changes eligible weights; frozen treatment leaves weights untouched',()=>{
  const w=new World({founders:2});const f=w.flies[0],a=structuredClone(f.brain),b=structuredClone(f.brain),obs=Array(INPUTS.length).fill(.5);
  for(let i=0;i<80;i++){brainStep(f.genome,a,obs,.5,true);brainStep(f.genome,b,obs,.5,false);}
  assert.ok(a.plastic.some(v=>Math.abs(v)>0));assert.ok(b.plastic.every(v=>v===0));
});
test('extinction is terminal and does not insert replacements',()=>{
  const w=new World({founders:2,nutrient:0});w.flies.forEach(f=>f.energy=0);w.food.forEach(p=>p.amount=0);w.initialEnergy=0;w.advance(10);assert.equal(w.flies.length,0);const tick=w.tick;w.advance(1000);assert.equal(w.tick,tick);assert.equal(w.totals.births,0);assert.equal(w.metrics().status,'extinct');
});
test('capacity pauses instead of silently selecting which offspring survive',()=>{
  const w=new World({founders:2,capacity:2});w.flies.forEach(f=>{f.x=180;f.y=180;f.age=35;f.energy=100;});w.initialEnergy=w.energy();w.step();assert.equal(w.capacityReached,true);assert.equal(w.flies.length,2);assert.equal(w.totals.births,0);const tick=w.tick;w.advance(10);assert.equal(w.tick,tick);
});
test('malformed checkpoints fail before becoming a world',()=>{
  const w=new World({founders:2});const d=w.checkpoint();d.world.flies[0].genome.edges[0].to=999999;assert.throws(()=>World.restore(d),/connection/);
  assert.throws(()=>World.restore({schema:2}),/Unsupported/);
  const n=w.checkpoint();n.world.flies[0].brain.activity[0]=null;assert.throws(()=>World.restore(n),/neural/);
});
