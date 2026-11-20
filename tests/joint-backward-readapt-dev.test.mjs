// JOINT-BACKWARD-READAPT V1 fixtures (FROZEN docs/JOINT_BACKWARD_READAPT_PLAN_V1.md).
// 6 tests, zero worlds: bank tmp-mint shape/exclusion, scorer
// AGREE-BOTH-POSITIVE / AGREE-BOTH-NEGATIVE / DISAGREE branches (both
// directions), constants, triage-seed exclusion.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {jrBank,scoreJointRows,JR_FIXTURE_SEEDS,JR_TRIAGE_SEEDS,JR_ARMS,JR_MARGIN} from '../scripts/joint-backward-readapt-dev.mjs';
import {RR_SWITCH_TICKS} from '../scripts/retention-readapt-dev.mjs';

const bwRow=(seed,arm,retA,a=2.0)=>({history:{seed},arm,stage:'backward',
  seg:{A:{rate:a,ticks:512},B:{rate:1,ticks:512},C:{rate:1,ticks:512},retA:{rate:retA,ticks:256}},
  phaseRows:[{phase:'A'},{phase:'B'},{phase:'C'},{phase:'return-A'}],
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});
const raRow=(seed,arm,t,rate)=>({history:{seed},arm,stage:'readapt',switchTick:t,foodRate:rate,
  endpoint:{tick:t+128,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});
const mk=(retC,retU,raC,raU)=>{
  const rows=[];
  for(const s of [474163,474172]){rows.push(bwRow(s,'candidate',retC));rows.push(bwRow(s,'unlearned',retU));}
  for(const t of RR_SWITCH_TICKS)for(const s of [474163,474172]){rows.push(raRow(s,'candidate',t,raC[t]));rows.push(raRow(s,'unlearned',t,raU[t]));}
  return rows;
};
const flat=(v)=>({512:v,640:v,768:v,896:v,1024:v});

describe('joint-backward-readapt-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'joint-br-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=jrBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'joint-backward-readapt-dev');
    assert.equal(p.histories.length,2);
    assert.deepEqual(p.histories.map(h=>h.role),['main','main']);
    const flatS=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flatS).size,18);
    assert.deepEqual([...JR_FIXTURE_SEEDS].sort((a,b)=>a-b),flatS.slice().sort((a,b)=>a-b));
    assert.equal(JR_FIXTURE_SEEDS[0],474163);
    assert.deepEqual([...JR_TRIAGE_SEEDS],[490037,490038,490039,490040,490041,490042,490043,490044,490045]);
    assert.ok(!JR_FIXTURE_SEEDS.some(s=>JR_TRIAGE_SEEDS.includes(s)));
    assert.deepEqual([...JR_ARMS],['candidate','unlearned']);
    assert.ok(RR_SWITCH_TICKS.length===5&&JR_MARGIN===1.1);
    rmSync(dir,{recursive:true,force:true});
  });
  it('scorer AGREE-BOTH-POSITIVE branch',()=>{
    const v=scoreJointRows(mk(2.0,1.0,flat(2.0),flat(1.0)));
    assert.equal(v.g1,true);assert.equal(v.verdict,'JOINT-AGREE-BOTH-POSITIVE');
  });
  it('scorer AGREE-BOTH-NEGATIVE branch',()=>{
    const v=scoreJointRows(mk(1.0,1.0,flat(1.0),flat(1.0)));
    assert.equal(v.g1,true);assert.equal(v.verdict,'JOINT-AGREE-BOTH-NEGATIVE');
  });
  it('scorer DISAGREE branch (backward positive, readapt negative)',()=>{
    const v=scoreJointRows(mk(2.0,1.0,flat(1.0),flat(1.0)));
    assert.equal(v.g1,true);assert.equal(v.verdict,'JOINT-DISAGREE');
  });
  it('scorer DISAGREE branch (mirror: backward negative, readapt positive)',()=>{
    const v=scoreJointRows(mk(1.0,1.0,flat(2.0),flat(1.0)));
    assert.equal(v.g1,true);assert.equal(v.verdict,'JOINT-DISAGREE');
  });
  it('scorer all-zero readapt rates still score (no void here)',()=>{
    const rows=mk(2.0,1.0,flat(0),flat(0));
    const v=scoreJointRows(rows);
    assert.equal(v.g1,true);
    assert.ok(v.verdict==='JOINT-DISAGREE'||v.verdict==='JOINT-AGREE-BOTH-NEGATIVE');
  });
});
