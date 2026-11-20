// MEMORY-RESET V1b fixtures (FROZEN docs/MEMORY_RESET_PLAN_V1B.md).
// 3 tests, zero worlds: reuse reader accepts the joint-identical protocol,
// rejects tampered histories, scorer smoke (GO branch synthetic).
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {mrReuseBank,scoreMemoryResetRows,MR_MARGIN} from '../scripts/memory-reset-v1b.mjs';

const row=(seed,arm,retA)=>({history:{seed},arm,
  seg:{A:{rate:2.0,ticks:512},retA:{rate:retA,ticks:256}},phaseRows:[{phase:'A'},{phase:'return-A'}],
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('memory-reset-v1b fixtures',()=>{
  it('reuse reader accepts the joint-identical protocol',()=>{
    const p=mrReuseBank('evidence/memory-reset-dev/reuse-01/protocol.json');
    assert.equal(p.experiment,'memory-reset-dev');
    assert.equal(p.reuseOf,'joint-backward-readapt-dev/fresh-11');
    assert.deepEqual(p.histories.map(h=>h.seed),[474163,474172]);
  });
  it('reuse reader rejects tampered histories',()=>{
    const dir=join(tmpdir(),'memreuse-tamper-test');
    rmSync(dir,{recursive:true,force:true});mkdirSync(dir,{recursive:true});
    const good=JSON.parse(readFileSync('evidence/memory-reset-dev/reuse-01/protocol.json','utf8'));
    const bad={...good,histories:[{...good.histories[0],seed:1},good.histories[1]]};
    writeFileSync(join(dir,'protocol.json'),JSON.stringify(bad));
    assert.throws(()=>mrReuseBank(join(dir,'protocol.json')));
    assert.throws(()=>mrReuseBank(join(dir,'missing.json')));
    rmSync(dir,{recursive:true,force:true});
  });
  it('scorer GO smoke (full wipe erases benefit)',()=>{
    const rows=[];
    for(const s of [474163,474172]){rows.push(row(s,'intact',2.0));rows.push(row(s,'wreset',0.5));rows.push(row(s,'sreset',0.5));rows.push(row(s,'both',0.5));rows.push(row(s,'unlearned',0.5));}
    const v=scoreMemoryResetRows(rows);
    assert.equal(v.g1,true);assert.equal(v.go,true);assert.equal(v.verdict,'MEMORY-RESET-GO-V1');
    assert.ok(MR_MARGIN===1.1);
  });
});
