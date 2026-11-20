// Feasibility probe fixtures (G5 gate). Zero bank worlds: synthetic emit
// streams + synthetic rows only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {collectMaxEnergy,scoreFeasibility} from '../scripts/feasibility-probe.mjs';

test('collector tracks per-tick max own.energy',()=>{
  const c=collectMaxEnergy();
  for(let t=0;t<10;t++)c.emit({type:'observe',own:{tick:t,agentId:1,energy:40+t}});
  for(let t=10;t<20;t++)c.emit({type:'observe',own:{tick:t,agentId:1,energy:60-(t-10)}});
  const s=c.summarize();
  assert.equal(s.max,60);
  assert.equal(s.ticks,20);
  assert.deepEqual(s,{max:60,ticks:20,fracOver65:null});
});

test('collector ignores malformed events',()=>{
  const c=collectMaxEnergy();
  c.emit({type:'observe',own:{tick:0}}); // missing energy
  c.emit({type:'observe',own:{tick:1,agentId:2,energy:NaN}});
  c.emit({type:'decision',own:{tick:2,agentId:2},action:1}); // wrong type
  c.emit({type:'observe',own:{tick:2,agentId:2,energy:70}});
  assert.equal(c.summarize().max,70);
});

test('scorer: FEASIBLE on any birth',()=>{
  const rows=[{tag:'founders-24',history:{seed:1},endpoint:{totals:{births:3}},maxEnergy:80},
              {tag:'founders-24',history:{seed:2},endpoint:{totals:{births:0}},maxEnergy:70},
              {tag:'founders-8',history:{seed:1},endpoint:{totals:{births:0}},maxEnergy:66},
              {tag:'founders-8',history:{seed:2},endpoint:{totals:{births:1}},maxEnergy:71}];
  const v=scoreFeasibility(rows);
  assert.equal(v.verdict,'FEASIBLE');
  assert.equal(v.go,true);
  assert.equal(v.births,4);
});

test('scorer: INFEASIBLE-ENERGETIC when max never reaches 65',()=>{
  const rows=[{tag:'founders-24',history:{seed:1},endpoint:{totals:{births:0}},maxEnergy:50},
              {tag:'founders-24',history:{seed:2},endpoint:{totals:{births:0}},maxEnergy:60},
              {tag:'founders-8',history:{seed:1},endpoint:{totals:{births:0}},maxEnergy:61},
              {tag:'founders-8',history:{seed:2},endpoint:{totals:{births:0}},maxEnergy:64.9}];
  const v=scoreFeasibility(rows);
  assert.equal(v.verdict,'INFEASIBLE-ENERGETIC');
  assert.equal(v.go,false);
});

test('scorer: INFEASIBLE-BEHAVIORAL when energy suffices but no births',()=>{
  const rows=[{tag:'founders-24',history:{seed:1},endpoint:{totals:{births:0}},maxEnergy:80},
              {tag:'founders-24',history:{seed:2},endpoint:{totals:{births:0}},maxEnergy:75},
              {tag:'founders-8',history:{seed:1},endpoint:{totals:{births:0}},maxEnergy:90},
              {tag:'founders-8',history:{seed:2},endpoint:{totals:{births:0}},maxEnergy:66}];
  const v=scoreFeasibility(rows);
  assert.equal(v.verdict,'INFEASIBLE-BEHAVIORAL');
  assert.equal(v.go,false);
});
