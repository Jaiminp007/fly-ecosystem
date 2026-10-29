import test from 'node:test';
import assert from 'node:assert/strict';
import {createTasteEnergyBody,chooseTasteEnergyAction,observeTasteEnergyBody,restoreTasteEnergyBody,TASTE_ENERGY_DEFAULTS} from '../learning/taste-energy.mjs';
import {collectMarginReadback} from '../scripts/margin-readback-check.mjs';

// D1-FIX fixtures: zero worlds. Seeds are tests/*.mjs literals (numeric-token
// scan auto-excludes them from future banks). No bank contact of any kind.
const SEED=381001;
const own=(s,tick)=>{
  const raw=Array(17).fill(0);raw[4]=.5;raw[16]=1;
  return {agentId:s.agentId,tick,energy:60-tick*.02,raw,cue:[1,-1,1,-1],contactPresent:true,odorPresent:true};
};
const cycle=(s,tick,emit)=>{
  const input=own(s,tick),action=chooseTasteEnergyAction(s,input,emit);
  observeTasteEnergyBody(s,{agentId:s.agentId,tick,energy:input.energy-.02,lastFood:action===2?.05:0,terminal:false},emit);
  return action;
};

test('marginReadback defaults off and old checkpoints restore with it off',()=>{
  assert.equal(TASTE_ENERGY_DEFAULTS.marginReadback,false);
  const s=createTasteEnergyBody(SEED,SEED);
  assert.equal(s.config.marginReadback,false);
  const filed=JSON.parse(JSON.stringify(s));delete filed.config.marginReadback;
  const r=restoreTasteEnergyBody(filed);
  assert.equal(r.config.marginReadback,false);
});

test('default-off with recording emit is bit-identical to noop emit (actions, weights, billing)',()=>{
  let a=createTasteEnergyBody(SEED+1,SEED+1),b=createTasteEnergyBody(SEED+1,SEED+1);
  const events=[];
  const aa=[],bb=[];
  for(let tick=1;tick<=40;tick++){
    aa.push(cycle(a,tick,e=>events.push(e)));
    a=restoreTasteEnergyBody(JSON.parse(JSON.stringify(a)));
    bb.push(cycle(b,tick,()=>{}));
    b=restoreTasteEnergyBody(JSON.parse(JSON.stringify(b)));
  }
  assert.deepEqual(aa,bb);assert.deepEqual(b.weights,a.weights);assert.deepEqual(b.work,a.work);
  assert.ok(events.every(e=>e.type!=='update'||!e.event||e.event.type!=='motor-margin'));
});

test('flag-on emits shaped motor-margin records, bills exactly 2+motorDimensions per decision, changes nothing else',()=>{
  let on=createTasteEnergyBody(SEED+2,SEED+2),off=createTasteEnergyBody(SEED+2,SEED+2);
  on.config.marginReadback=true;
  const events=[],ao=[],af=[];
  for(let tick=1;tick<=40;tick++){ao.push(cycle(on,tick,e=>events.push(e)));af.push(cycle(off,tick,()=>{}));}
  assert.deepEqual(ao,af);assert.deepEqual(on.weights,off.weights);
  const margins=events.filter(e=>e.type==='motor-margin');
  assert.equal(margins.length,3); // ticks 1, 17, 33 with default holdTicks=16
  for(const m of margins){
    assert.ok(Number.isFinite(m.record.baseProbability)&&m.record.baseProbability>=0&&m.record.baseProbability<=1);
    assert.equal(m.record.phi.length,16);assert.equal(typeof m.record.cruise,'boolean');
    assert.ok(Number.isSafeInteger(m.record.tick)&&m.record.tick>0);
  }
  assert.equal(on.work.scalarOperations-off.work.scalarOperations,3*(2+on.config.motorDimensions));
});

test('collector accepts wrapped and raw motor-margin, counts bad records, ignores other types',()=>{
  const c=collectMarginReadback(16);
  const good={type:'update',event:{type:'motor-margin',record:{tick:1,cruise:true,baseProbability:.62,probability:.608,phi:Array.from({length:16},(_,j)=>j===0?1:0)}}};
  c.emit({probe:'A:current',event:good});
  c.emit({type:'update',event:{type:'motor-margin',record:{tick:2,cruise:false,baseProbability:.5,probability:.5,phi:Array(16).fill(0)}}});
  c.emit({probe:'A:current',event:{type:'update',event:{type:'motor-margin',record:{tick:3,cruise:true,baseProbability:NaN,probability:.5,phi:Array(16).fill(0)}}}});
  c.emit({probe:'A:current',event:{type:'update',event:{type:'motor-margin',record:{tick:4,cruise:true,baseProbability:.7,probability:.68,phi:[1,2,3]}}}});
  c.emit({probe:'A:current',event:{type:'update',event:{type:'motor-progress',record:{cruise:true}}}});
  c.emit({type:'decision',own:null,action:0,outputs:[0,0],requestedExtra:0});
  const s=c.summarize(c.perProbe['A:current']);
  assert.equal(s.n,1);assert.equal(s.events,3);assert.equal(s.bad,2);
  assert.ok(Number.isFinite(s.meanMargin)&&s.nearFrac>=0);
  assert.equal(c.summarize(c.perProbe.main).n,1);
});

test('collector is dims-aware: ecology 96-dim accepted, wrong length bad, stream seen without margins',()=>{
  const c=collectMarginReadback(96);
  const rec96={type:'update',event:{type:'motor-margin',record:{tick:1,cruise:true,baseProbability:.62,probability:.608,phi:Array.from({length:96},(_,j)=>j===0?1:0)}}};
  c.emit({probe:'A:current',event:rec96});
  c.emit({probe:'A:current',event:rec96});
  const s=c.summarize(c.perProbe['A:current']);
  assert.equal(s.n,2);assert.equal(s.bad,0);assert.equal(s.phiLength,96);
  assert.ok(s.blocks[0]>=2);assert.ok(Number.isFinite(s.meanMargin));
  // 16-dim record under 96 expectation is bad, not counted.
  c.emit({probe:'A:current',event:{type:'update',event:{type:'motor-margin',record:{tick:3,cruise:true,baseProbability:.6,probability:.59,phi:Array(16).fill(0)}}}});
  assert.equal(c.summarize(c.perProbe['A:current']).bad,1);
  // Reset-style stream: decision records observed (seen) but zero margin events.
  c.emit({probe:'A:reset',event:{type:'decision',own:null,action:0,outputs:[0,0],requestedExtra:0}});
  const r=c.summarize(c.perProbe['A:reset']);
  assert.ok(r.seen>0&&r.n===0&&r.events===0);
});

test('collector tracks min/max margins; bit-constant zero-weight stream has min===max',()=>{
  const c=collectMarginReadback(96);
  const mk=bp=>({probe:'A:reset',event:{type:'update',event:{type:'motor-margin',record:{tick:1,cruise:true,baseProbability:bp,probability:bp,phi:Array(96).fill(0)}}}});
  c.emit(mk(0.75));c.emit(mk(0.75));c.emit(mk(0.75));
  const s=c.summarize(c.perProbe['A:reset']);
  assert.equal(s.n,3);assert.equal(s.bad,0);
  assert.equal(s.minMargin,s.maxMargin);assert.equal(s.minMargin,0.25);
  const d=collectMarginReadback(96);
  d.emit(mk(0.75));d.emit({probe:'A:reset',event:{type:'update',event:{type:'motor-margin',record:{tick:2,cruise:false,baseProbability:0.6,probability:0.59,phi:Array(96).fill(0)}}}});
  const t=d.summarize(d.perProbe['A:reset']);
  assert.ok(t.minMargin<t.maxMargin);assert.equal(t.n,2);
});
