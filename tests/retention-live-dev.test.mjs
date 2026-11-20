// RETENTION-LIVE V1 fixtures (FROZEN docs/RETENTION_LIVE_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, branchRate helper,
// scorer GO/NOGO/NOLEARN branches, switch-tick constants, triage-seed
// exclusion from the bank range.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {rlBank,scoreRetentionLiveRows,branchRate,RL_FIXTURE_SEEDS,RL_TRIAGE_SEEDS,RL_SWITCH_TICKS,RL_MARGIN,RL_MEASURE_TICKS} from '../scripts/retention-live-dev.mjs';

const row=(seed,arm,t,rate)=>({history:{seed},arm,stage:'main',switchTick:t,foodRate:rate,
  endpoint:{tick:t+128,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('retention-live-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'retlive-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=rlBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'retention-live-dev');
    assert.equal(p.histories.length,2);
    assert.deepEqual(p.histories.map(h=>h.role),['main','main']);
    assert.deepEqual(p.histories.map(h=>h.pair),[0,1]);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...RL_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(RL_FIXTURE_SEEDS[0],474073);
    assert.ok(!RL_FIXTURE_SEEDS.some(s=>RL_TRIAGE_SEEDS.includes(s)),'triage seeds must not overlap bank');
    rmSync(dir,{recursive:true,force:true});
  });
  it('branchRate helper reads food diff over ticks',()=>{
    assert.equal(branchRate(100,512,228,640),1.0);
    assert.throws(()=>branchRate(100,512,90,640),'food totals must not decrease');
    assert.throws(()=>branchRate(100,512,228,512));
  });
  it('switch schedule and margin constants frozen',()=>{
    assert.deepEqual([...RL_SWITCH_TICKS],[512,640,768,896,1024]);
    assert.equal(RL_MEASURE_TICKS,128);
    assert.equal(RL_MARGIN,1.1);
  });
  it('scorer GO branch (retained above matched naive x1.1)',()=>{
    const rows=[];
    for(const t of RL_SWITCH_TICKS)for(const s of [474073,474082]){rows.push(row(s,'candidate',t,2.0));rows.push(row(s,'unlearned',t,1.0));}
    const v=scoreRetentionLiveRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'RETENTION-LIVE-GO-V1');
  });
  it('scorer NOGO branch (decays to naive during B)',()=>{
    const rows=[];
    const rates={512:2.0,640:1.5,768:1.2,896:1.0,1024:0.9};
    for(const t of RL_SWITCH_TICKS)for(const s of [474073,474082]){rows.push(row(s,'candidate',t,rates[t]));rows.push(row(s,'unlearned',t,1.0));}
    const v=scoreRetentionLiveRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'RETENTION-LIVE-NOGO-V1');
  });
  it('scorer NOLEARN void (no A-skill at baseline)',()=>{
    const rows=[];
    for(const t of RL_SWITCH_TICKS)for(const s of [474073,474082]){rows.push(row(s,'candidate',t,1.0));rows.push(row(s,'unlearned',t,1.0));}
    const v=scoreRetentionLiveRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INCOMPLETE-NOLEARN');
  });
});
