import test from 'node:test';
import assert from 'node:assert/strict';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {PursuitCensus,observePursuit,summarizePursuit} from '../learning/pursuit-census.mjs';

test('observer records actual acquisition without changing any checkpoint bytes, work or randomness',()=>{
  const options={history:{seed:255201,cueSeed:255202,resourceSeeds:[255203,255204,255205,255206]},reference:{...structuredClone(VALUE_REFERENCE),founders:2},learnerOptions:{holdTicks:1,motorRepresentation:'balance',greedyInference:true}};
  const observed=new TasteExperiment(options),plain=new TasteExperiment(options),records=[],census=new PursuitCensus(record=>records.push(record));
  observePursuit(observed.world,census,()=>observed.resource.family);observed.advance(32);plain.advance(32);
  assert.deepEqual(observed.checkpoint(),plain.checkpoint());assert.equal(records.length,64);
  const episodes=census.finishAll(),summary=summarizePursuit(episodes);assert.equal(summary.ticks,64);
  assert.ok(Math.abs(summary.intake-records.reduce((sum,record)=>sum+record.intake,0))<1e-12);
});
test('episodes split by target position and phase, preserve null targets and include zero-intake moving pursuit',()=>{
  const census=new PursuitCensus(),raw=Array(17).fill(0),base={id:1,phase:'A',raw,target:{index:0,x:10,y:20,deepInterior:false},x:0,y:0,afterX:1,afterY:0,distanceBefore:10,distanceAfter:9,displacement:1,intake:0,toxinDamage:0,cost:.1,movementCost:.01,collision:false,boundaryClip:false};
  census.record({...base,tick:1});census.record({...base,tick:2});census.record({...base,tick:3,target:{...base.target,x:11}});
  census.record({...base,tick:4,phase:'B'});census.record({...base,tick:5,phase:'B',target:null,distanceBefore:null,distanceAfter:null});
  const episodes=census.finishAll();assert.equal(episodes.length,4);assert.equal(episodes[0].ticks,2);
  assert.equal(episodes[0].netApproach,2);assert.equal(summarizePursuit(episodes).targetedTicks,4);assert.equal(summarizePursuit(episodes).ticks,5);
});
