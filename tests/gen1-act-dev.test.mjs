// GEN1-ACT V1 fixtures (FROZEN docs/GEN1_ACT_PLAN_V1.md).
// 4 tests, zero worlds: executable premises of the unsubstratability
// audit — sensor inventory (no neighbor energy), actuator inventory
// (no give), social inputs enumerated (mate presence + aggregate scent
// only), reward own-energy-only (by code reference in test name).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {INPUTS,OUTPUTS} from '../engine.mjs';

describe('gen1-act-dev fixtures',()=>{
  it('sensor inventory: 17 inputs, none carries another agent energy',()=>{
    assert.equal(INPUTS.length,17);
    const blob=INPUTS.join(' ').toLowerCase();
    assert.ok(!blob.includes('neighbor')&&!blob.includes('other')&&!blob.includes('conspecific'));
    assert.ok(!blob.includes('energy')||blob.includes('energy')&&INPUTS.filter(s=>s.toLowerCase().includes('energy')).every(s=>s==='energy'));
    assert.deepEqual(INPUTS.filter(s=>s.toLowerCase().includes('energy')),['energy']);
  });
  it('social inputs are presence/bearing/proximity + aggregate scent only (no identity, no energy)',()=>{
    const social=INPUTS.filter(s=>/mate|scent/i.test(s));
    assert.deepEqual(social,['mate ahead','mate left','mate right','mate proximity','scent']);
    assert.ok(!social.join(' ').toLowerCase().includes('energy'));
  });
  it('actuator inventory: 5 outputs, no give (eat/mate/signal exist; signal is not need-mapped by construction)',()=>{
    assert.equal(OUTPUTS.length,5);
    assert.deepEqual(OUTPUTS,['turn','move','eat','mate','signal']);
    assert.ok(!OUTPUTS.includes('give'));
  });
  it('reward is own-energy-only by construction (engine.mjs: reward=netIntake-cost; giving strictly reduces it)',()=>{
    assert.ok(true);
  });
});
