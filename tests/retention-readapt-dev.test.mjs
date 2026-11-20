// RETENTION-READAPT V1 fixtures (FROZEN docs/RETENTION_READAPT_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, branchRate helper,
// scorer GO/NOGO/NOLEARN branches, switch-tick constants, triage-seed
// exclusion from the bank range.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {rrBank,scoreRetentionReadaptRows,branchRate,RR_FIXTURE_SEEDS,RR_TRIAGE_SEEDS,RR_SWITCH_TICKS,RR_MARGIN,RR_MEASURE_TICKS} from '../scripts/retention-readapt-dev.mjs';

const row=(seed,arm,t,rate)=>({history:{seed},arm,stage:'main',switchTick:t,foodRate:rate,
  endpoint:{tick:t+128,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('retention-readapt-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'retreadapt-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=rrBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'retention-readapt-dev');
    assert.equal(p.histories.length,2);
    assert.deepEqual(p.histories.map(h=>h.role),['main','main']);
    assert.deepEqual(p.histories.map(h=>h.pair),[0,1]);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...RR_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(RR_FIXTURE_SEEDS[0],474091);
    assert.deepEqual([...RR_TRIAGE_SEEDS],[490010,490011,490012,490013,490014,490015,490016,490017,490018]);
    assert.ok(!RR_FIXTURE_SEEDS.some(s=>RR_TRIAGE_SEEDS.includes(s)),'triage seeds must not overlap bank');
    rmSync(dir,{recursive:true,force:true});
  });
  it('branchRate helper reads food diff over ticks',()=>{
    assert.equal(branchRate(100,512,228,640),1.0);
    assert.throws(()=>branchRate(100,512,90,640),'food totals must not decrease');
    assert.throws(()=>branchRate(100,512,228,512));
  });
  it('switch schedule and margin constants frozen',()=>{
    assert.deepEqual([...RR_SWITCH_TICKS],[512,640,768,896,1024]);
    assert.equal(RR_MEASURE_TICKS,128);
    assert.equal(RR_MARGIN,1.1);
  });
  it('scorer GO branch (live readaptation above matched naive x1.1)',()=>{
    const rows=[];
    for(const t of RR_SWITCH_TICKS)for(const s of [474091,474100]){rows.push(row(s,'candidate',t,2.0));rows.push(row(s,'unlearned',t,1.0));}
    const v=scoreRetentionReadaptRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'RETENTION-READAPT-GO-V1');
  });
  it('scorer NOGO branch (baseline passes, readaptation fails during B)',()=>{
    const rows=[];
    const rates={512:2.0,640:1.0,768:1.0,896:1.0,1024:1.0};
    for(const t of RR_SWITCH_TICKS)for(const s of [474091,474100]){rows.push(row(s,'candidate',t,rates[t]));rows.push(row(s,'unlearned',t,1.0));}
    const v=scoreRetentionReadaptRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,false);assert.equal(v.verdict,'RETENTION-READAPT-NOGO-V1');
  });
  it('scorer NOLEARN void (no live A-skill at baseline)',()=>{
    const rows=[];
    for(const t of RR_SWITCH_TICKS)for(const s of [474091,474100]){rows.push(row(s,'candidate',t,0.5));rows.push(row(s,'unlearned',t,1.0));}
    const v=scoreRetentionReadaptRows(rows);
    assert.equal(v.go,false);assert.equal(v.verdict,'INCOMPLETE-NOLEARN');
  });
});
